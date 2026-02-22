import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(config: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: config.get('JWT_ACCESS_SECRET'),
        });
    }

    async validate(payload: { sub: string; orgId: string; email: string; role: string }) {
        return {
            userId: payload.sub,
            organizationId: payload.orgId,
            email: payload.email,
            role: payload.role
        };
    }
}
