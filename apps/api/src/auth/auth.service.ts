import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto, LoginDto, RegisterOrgDto } from './dto';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
    ) { }

    async registerOrg(dto: RegisterOrgDto) {
        // Check if org document already exists
        const existingOrg = await this.prisma.organization.findUnique({
            where: { document: dto.document },
        });
        if (existingOrg) throw new ConflictException('Organization already exists');

        // Transaction to create Org + Admin User
        const { org, user } = await this.prisma.$transaction(async (tx) => {
            const org = await tx.organization.create({
                data: {
                    name: dto.orgName,
                    document: dto.document,
                },
            });

            const salt = await bcrypt.genSalt();
            const passwordHash = await bcrypt.hash(dto.password, salt);

            const user = await tx.user.create({
                data: {
                    organizationId: org.id,
                    email: dto.adminEmail,
                    name: dto.adminName,
                    passwordHash,
                    role: 'ADMIN',
                },
            });

            return { org, user };
        });

        return this.signToken(user.id, org.id, user.email, user.role);
    }

    async login(dto: LoginDto) {
        const user = await this.prisma.user.findFirst({
            where: { email: dto.email },
        });

        if (!user) throw new UnauthorizedException('Credentials incorrect');

        const pwMatches = await bcrypt.compare(dto.password, user.passwordHash);
        if (!pwMatches) throw new UnauthorizedException('Credentials incorrect');

        return this.signToken(user.id, user.organizationId, user.email, user.role);
    }

    async signToken(userId: string, orgId: string, email: string, role: string) {
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
        };
    }
}
