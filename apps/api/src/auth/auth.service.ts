import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto, RegisterOrgDto } from './dto';
import { AuditService } from '../common/audit/audit.service';
import { AuditAction, AuditEntity } from '../common/audit/audit.types';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
        private audit: AuditService,
    ) { }

    async registerWithInvite(dto: any) {
        // 1. Validate Invite Token
        const invite = await this.prisma.invite.findUnique({
            where: { token: dto.token },
        });

        if (!invite || invite.status !== 'PENDING' || new Date() > invite.expiresAt) {
            throw new UnauthorizedException('Invalid or expired invite token');
        }

        // 2. Check if user already exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email: invite.email },
        });
        if (existingUser) throw new ConflictException('User already exists');

        // 3. Create User and Close Invite
        const { user } = await this.prisma.$transaction(async (tx) => {
            const salt = await bcrypt.genSalt();
            const passwordHash = await bcrypt.hash(dto.password, salt);

            const user = await tx.user.create({
                data: {
                    organizationId: invite.organizationId,
                    email: invite.email,
                    name: dto.name,
                    passwordHash,
                    role: invite.role,
                },
            });

            await tx.invite.update({
                where: { id: invite.id },
                data: { status: 'ACCEPTED' },
            });

            return { user };
        });

        return this.signToken(user.id, invite.organizationId, user.email, user.role, user.name);
    }

    async registerOrg(dto: RegisterOrgDto) {
        console.log(`[AuthService] Attempting to register organization: ${dto.orgName} for user: ${dto.email}`);
        // Check if user email already exists (global unique)
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (existingUser) {
            console.warn(`[AuthService] Registration failed: Email ${dto.email} already exists`);
            throw new ConflictException('User email already exists');
        }

        // Check if org document already exists if provided
        if (dto.document) {
            const existingOrg = await this.prisma.organization.findUnique({
                where: { document: dto.document },
            });
            if (existingOrg) {
                console.warn(`[AuthService] Registration failed: Organization document ${dto.document} already exists`);
                throw new ConflictException('Organization already exists');
            }
        }

        // Transaction to create Org + Admin User
        try {
            const { org, user } = await this.prisma.$transaction(async (tx) => {
                const org = await tx.organization.create({
                    data: {
                        name: dto.orgName,
                        document: dto.document || `TEMP-${Date.now()}`,
                    },
                });

                const salt = await bcrypt.genSalt();
                const passwordHash = await bcrypt.hash(dto.password, salt);

                const user = await tx.user.create({
                    data: {
                        organizationId: org.id,
                        email: dto.email,
                        name: `${dto.firstName} ${dto.lastName}`,
                        firstName: dto.firstName,
                        lastName: dto.lastName,
                        passwordHash,
                        role: 'ADMIN',
                    },
                });

                return { org, user };
            });

            console.log(`[AuthService] Successfully registered organization ${org.name} (ID: ${org.id}) and admin ${user.email}`);

            await this.audit.log({
                organizationId: org.id,
                userId: user.id,
                action: AuditAction.CREATE,
                entity: AuditEntity.ORGANIZATION,
                entityId: org.id,
                metadata: { email: user.email }
            });

            return this.signToken(user.id, org.id, user.email, user.role, user.name);
        } catch (error) {
            console.error(`[AuthService] Critical error during organization registration:`, error);
            throw error;
        }
    }

    async login(dto: LoginDto) {
        console.log(`[AuthService] Login attempt for email: ${dto.email}`);

        try {
            // 1. Find the user by email globally
            const user = await this.prisma.user.findUnique({
                where: { email: dto.email },
            });

            if (!user) {
                console.warn(`[AuthService] Login failed: User not found for email ${dto.email}`);
                throw new UnauthorizedException('Credentials incorrect');
            }

            // 2. Verify password
            const pwMatches = await bcrypt.compare(dto.password, user.passwordHash);
            if (!pwMatches) {
                console.warn(`[AuthService] Login failed: Incorrect password for email ${dto.email}`);
                throw new UnauthorizedException('Credentials incorrect');
            }

            console.log(`[AuthService] Login successful for email: ${dto.email} (OrgID: ${user.organizationId})`);
            const result = await this.signToken(user.id, user.organizationId, user.email, user.role, user.name);

            await this.audit.log({
                organizationId: user.organizationId,
                userId: user.id,
                action: AuditAction.LOGIN,
                entity: AuditEntity.USER,
                entityId: user.id,
                metadata: { email: user.email }
            });

            return result;
        } catch (error) {
            if (error instanceof UnauthorizedException) throw error;
            console.error(`[AuthService] Unexpected error during login for ${dto.email}:`, error);
            throw error;
        }
    }

    async signToken(userId: string, orgId: string, email: string, role: string, name: string) {
        const payload = {
            sub: userId,
            orgId,
            organizationId: orgId,
            email,
            role,
        };

        const token = await this.jwt.signAsync(payload, {
            secret: process.env.JWT_SECRET || 'frota2026_fallback_secret_for_emergency_use_only',
        });

        return {
            access_token: token,
            user: {
                id: userId,
                email,
                role,
                organizationId: orgId,
                name: name
            }
        };
    }

    async signSocialToken(profile: any) {
        console.log(`[AuthService] signSocialToken Profile:`, JSON.stringify(profile));
        try {
            let user = await this.prisma.user.findUnique({
                where: { email: profile.email },
            });

            if (!user) {
                console.log(`[AuthService] User ${profile.email} not found during social login. Auto-registering...`);

                const org = await this.prisma.organization.findFirst();
                console.log(`[AuthService] Default organization found: ${org?.id}`);

                if (!org) {
                    console.error(`[AuthService] No organization found to bind user.`);
                    throw new UnauthorizedException('No organization found to bind user. Please contact administrator.');
                }

                user = await this.prisma.user.create({
                    data: {
                        email: profile.email,
                        name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.email,
                        firstName: profile.firstName || null,
                        lastName: profile.lastName || null,
                        passwordHash: 'SOCIAL_AUTH_PROVIDER',
                        role: 'ADMIN',
                        organizationId: org.id,
                    },
                });
                console.log(`[AuthService] User created successfully: ${user.id}`);

                await this.audit.log({
                    organizationId: org.id,
                    userId: user.id,
                    action: AuditAction.CREATE,
                    entity: AuditEntity.USER,
                    entityId: user.id,
                    metadata: { email: user.email, provider: 'google', note: 'Auto-registered' }
                });
            }

            const result = await this.signToken(user.id, user.organizationId, user.email, user.role, user.name);
            console.log(`[AuthService] Token signed successfully for: ${user.email}`);

            await this.audit.log({
                organizationId: user.organizationId,
                userId: user.id,
                action: AuditAction.LOGIN,
                entity: AuditEntity.USER,
                entityId: user.id,
                metadata: { email: user.email, provider: 'google' }
            });

            return result;
        } catch (error) {
            console.error(`[AuthService] Error in signSocialToken:`, error);
            throw error;
        }
    }

    async getProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { organization: { select: { name: true } } }
        });

        if (!user || !user.organization) throw new UnauthorizedException();

        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            organizationId: user.organizationId,
            organizationName: user.organization.name
        };
    }
}
