import { Injectable, UnauthorizedException, ConflictException, Inject, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { LoginDto, RegisterOrgDto } from './dto';
import { AuditService } from '../common/audit/audit.service';
import { AuditAction, AuditEntity } from '../common/audit/audit.types';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
        private audit: AuditService,
        private usersService: UsersService,
        private configService: ConfigService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
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

            const newUser = await tx.user.create({
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

            return { user: newUser };
        });

        const tokens = await this.generateTokenPair(user.id, invite.organizationId, user.email, user.role, user.name);
        await this.usersService.saveRefreshTokenHash(user.id, tokens.refresh_token);

        return tokens;
    }

    async registerOrg(dto: RegisterOrgDto) {
        this.logger.log(`Attempting to register organization: ${dto.orgName} for user: ${dto.email}`);

        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (existingUser) throw new ConflictException('User email already exists');

        if (dto.document) {
            const existingOrg = await this.prisma.organization.findUnique({
                where: { document: dto.document },
            });
            if (existingOrg) throw new ConflictException('Organization already exists');
        }

        try {
            const { org, user } = await this.prisma.$transaction(async (tx) => {
                const newOrg = await tx.organization.create({
                    data: {
                        name: dto.orgName,
                        document: dto.document || `TEMP-${Date.now()}`,
                    },
                });

                const salt = await bcrypt.genSalt();
                const passwordHash = await bcrypt.hash(dto.password, salt);

                const newUser = await tx.user.create({
                    data: {
                        organizationId: newOrg.id,
                        email: dto.email,
                        name: `${dto.firstName} ${dto.lastName}`,
                        firstName: dto.firstName,
                        lastName: dto.lastName,
                        passwordHash,
                        role: 'ADMIN',
                    },
                });

                return { org: newOrg, user: newUser };
            });

            await this.audit.log({
                organizationId: org.id,
                userId: user.id,
                action: AuditAction.CREATE,
                entity: AuditEntity.ORGANIZATION,
                entityId: org.id,
                metadata: { email: user.email }
            });

            const tokens = await this.generateTokenPair(user.id, org.id, user.email, user.role, user.name);
            await this.usersService.saveRefreshTokenHash(user.id, tokens.refresh_token);

            return tokens;
        } catch (error) {
            this.logger.error(`Critical error during organization registration:`, error);
            throw error;
        }
    }

    async login(dto: LoginDto, ip?: string) {
        this.logger.log(`Login attempt for email: ${dto.email}`);

        const user = await this.usersService.findByEmailForAuth(dto.email);

        const dummyHash = '$2b$12$invalidhashpaddingtomatchtime.invalid.hash.here';
        const passwordToCompare = (user as any)?.passwordHash ?? dummyHash;
        const pwMatches = await bcrypt.compare(dto.password, passwordToCompare);

        const genericError = new UnauthorizedException('Credenciais incorretas');

        if (!user || !pwMatches) {
            if (user) {
                await this.usersService.recordFailedLogin(user.id, ip || 'unknown');
            }
            throw genericError;
        }

        if ((user as any).lockedUntil && (user as any).lockedUntil > new Date()) {
            const minutesLeft = Math.ceil(((user as any).lockedUntil.getTime() - Date.now()) / 60000);
            throw new UnauthorizedException(`Conta bloqueada. Tente novamente em ${minutesLeft} minuto(s).`);
        }

        if (!user.active) {
            throw new UnauthorizedException('Esta conta está inativada');
        }

        const result = await this.generateTokenPair(user.id, user.organizationId, user.email, user.role, user.name);

        await this.usersService.saveRefreshTokenHash(user.id, result.refresh_token);
        await this.usersService.recordSuccessfulLogin(user.id, ip || 'unknown');

        await this.audit.log({
            organizationId: user.organizationId,
            userId: user.id,
            action: AuditAction.LOGIN,
            entity: AuditEntity.USER,
            entityId: user.id,
            metadata: { email: user.email }
        });

        return result;
    }

    async refreshTokens(userId: string, incomingRefreshToken: string) {
        const isRevoked = await this.isTokenRevoked(incomingRefreshToken);
        if (isRevoked) {
            this.logger.warn(`Tentativa de uso de refresh token revogado para o usuário ${userId}`);
            await this.usersService.clearRefreshToken(userId);
            throw new UnauthorizedException('Sessão inválida. Faça login novamente.');
        }

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !(user as any).hashedRefreshToken || !user.active) {
            throw new UnauthorizedException('Sessão expirada ou usuário inativo');
        }

        const isTokenValid = await bcrypt.compare(incomingRefreshToken, (user as any).hashedRefreshToken);
        if (!isTokenValid) {
            this.logger.warn(`Refresh token inválido (reuso detectado) para o usuário ${userId}`);
            await this.usersService.clearRefreshToken(userId);
            throw new UnauthorizedException('Sessão comprometida. Faça login novamente.');
        }

        await this.revokeToken(incomingRefreshToken);

        const tokens = await this.generateTokenPair(user.id, user.organizationId, user.email, user.role, user.name);
        await this.usersService.saveRefreshTokenHash(user.id, tokens.refresh_token);

        return tokens;
    }

    async logout(userId: string, refreshToken?: string) {
        if (refreshToken) {
            await this.revokeToken(refreshToken);
        }
        await this.usersService.clearRefreshToken(userId);
        this.logger.log(`Logout realizado para o usuário ${userId}`);
    }

    private async generateTokenPair(userId: string, orgId: string, email: string, role: string, name: string) {
        const jti = crypto.randomBytes(16).toString('hex');

        const payload = {
            sub: userId,
            orgId,
            organizationId: orgId,
            email,
            role,
            jti,
        };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwt.signAsync(payload, {
                secret: this.configService.get('JWT_ACCESS_SECRET'),
                expiresIn: '15m',
            }),
            this.jwt.signAsync(
                { sub: userId, email },
                {
                    secret: this.configService.get('JWT_REFRESH_SECRET'),
                    expiresIn: '7d',
                }
            ),
        ]);

        return {
            access_token: accessToken,
            refresh_token: refreshToken,
            user: {
                id: userId,
                email,
                role,
                organizationId: orgId,
                name: name
            }
        };
    }

    private async revokeToken(token: string) {
        try {
            const decoded = this.jwt.decode(token) as any;
            if (!decoded?.exp) return;

            const ttl = decoded.exp - Math.floor(Date.now() / 1000);
            if (ttl <= 0) return;

            const key = `revoked:rt:${this.hashTokenForCache(token)}`;
            await this.cacheManager.set(key, '1', ttl * 1000);
        } catch (error: any) {
            this.logger.warn('Falha ao registrar revogação de token no Redis', error.message);
        }
    }

    private async isTokenRevoked(token: string): Promise<boolean> {
        try {
            const key = `revoked:rt:${this.hashTokenForCache(token)}`;
            const value = await this.cacheManager.get(key);
            return value === '1';
        } catch {
            return false;
        }
    }

    private hashTokenForCache(token: string): string {
        return crypto.createHash('sha256').update(token).digest('hex');
    }

    async signSocialToken(profile: any, ip?: string) {
        this.logger.log(`Social login: ${profile.email}`);
        try {
            let user = await this.prisma.user.findUnique({
                where: { email: profile.email },
            });

            if (!user) {
                const org = await this.prisma.organization.findFirst();
                if (!org) throw new UnauthorizedException('No organization found');

                user = await this.prisma.user.create({
                    data: {
                        email: profile.email,
                        name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.email,
                        firstName: profile.firstName || null,
                        lastName: profile.lastName || null,
                        passwordHash: 'SOCIAL_AUTH_PROVIDER',
                        role: 'ADMIN',
                        organizationId: org.id,
                        provider: 'GOOGLE',
                        isEmailVerified: true,
                    },
                });
            }

            const tokens = await this.generateTokenPair(user.id, user.organizationId, user.email, user.role, user.name);
            await this.usersService.saveRefreshTokenHash(user.id, tokens.refresh_token);
            await this.usersService.recordSuccessfulLogin(user.id, ip || 'unknown');

            return tokens;
        } catch (error) {
            this.logger.error(`Error in signSocialToken:`, error);
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
