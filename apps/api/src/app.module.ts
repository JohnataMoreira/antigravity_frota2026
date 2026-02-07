import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { VehiclesModule } from './vehicles/vehicles.module';
import { DriversModule } from './drivers/drivers.module';
import { JourneysModule } from './journeys/journeys.module';
import { StorageModule } from './storage/storage.module';
import { SyncModule } from './sync/sync.module';
import { ReportsModule } from './reports/reports.module';
import { LocationsModule } from './locations/locations.module';
import { MaintenanceModule } from './maintenance/maintenance.module';


@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule,
        AuthModule,
        VehiclesModule,
        DriversModule,
        JourneysModule,
        StorageModule,
        SyncModule,
        ReportsModule,
        LocationsModule,
        MaintenanceModule,
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
    ],
})
export class AppModule { }
