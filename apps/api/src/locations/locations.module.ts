import { Module } from '@nestjs/common';
import { LocationsGateway } from './locations.gateway';
import { JwtModule } from '@nestjs/jwt';

@Module({
    imports: [
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: '1d' },
        }),
    ],
    providers: [LocationsGateway],
    exports: [LocationsGateway],
})
export class LocationsModule { }
