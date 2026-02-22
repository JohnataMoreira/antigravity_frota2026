import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { GoogleStrategy } from './google.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuditModule } from '../common/audit/audit.module';
import { CacheModule } from '@nestjs/cache-manager';
import { UsersModule } from '../users/users.module';
import { AuthScheduler } from './auth.scheduler';
import { redisStore } from 'cache-manager-redis-yet';

@Module({
    imports: [
        PassportModule,
        AuditModule,
        UsersModule,
        ConfigModule,
        CacheModule.registerAsync({
            inject: [ConfigService],
            useFactory: async (config: ConfigService) => ({
                store: await redisStore({
                    url: config.get('REDIS_URL'),
                    ttl: 600000, // 10 min default
                }),
            }),
        }),
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.get('JWT_ACCESS_SECRET'),
                signOptions: { expiresIn: '15m' },
            }),
        }),
    ],
    providers: [AuthService, JwtStrategy, GoogleStrategy, AuthScheduler],
    controllers: [AuthController],
    exports: [AuthService],
})
export class AuthModule { }
