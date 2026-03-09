import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        config: ConfigService,
        private prisma: PrismaService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: config.get('JWT_SECRET') || process.env.JWT_SECRET || 'super-secret-key-change-in-prod',
        });
    }

    async validate(payload: { sub: string; orgId: string; email: string; role: string; version: number }) {
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            select: { active: true, tokenVersion: true }
        });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        if (!user.active) {
            throw new UnauthorizedException('User account is inactive');
        }

        if (payload.version !== user.tokenVersion) {
            throw new UnauthorizedException('Token revoked');
        }

        return {
            userId: payload.sub,
            organizationId: payload.orgId,
            email: payload.email,
            role: payload.role
        };
    }
}
