import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto, RegisterOrgDto } from './dto';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
    ) { }

    async registerOrg(dto: RegisterOrgDto) {
        // Check if user email already exists (global unique)
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (existingUser) throw new ConflictException('User email already exists');

        // Check if org document already exists if provided
        if (dto.document) {
            const existingOrg = await this.prisma.organization.findUnique({
                where: { document: dto.document },
            });
            if (existingOrg) throw new ConflictException('Organization already exists');
        }

        // Transaction to create Org + Admin User
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

        return this.signToken(user.id, org.id, user.email, user.role, user.name);
    }

    async login(dto: LoginDto) {
        // 1. Find the user by email globally
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user) throw new UnauthorizedException('Credentials incorrect');

        // 2. Verify password
        const pwMatches = await bcrypt.compare(dto.password, user.passwordHash);
        if (!pwMatches) throw new UnauthorizedException('Credentials incorrect');

        return this.signToken(user.id, user.organizationId, user.email, user.role, user.name);
    }

    async signToken(userId: string, orgId: string, email: string, role: string, name: string) {
        const payload = {
            sub: userId,
            orgId,
            email,
            role,
        };

        const token = await this.jwt.signAsync(payload, {
            secret: process.env.JWT_SECRET,
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
