import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
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
import { FuelModule } from './fuel/fuel.module';
import { UsersModule } from './users/users.module';
import { HealthModule } from './health/health.module';
import { FinanceModule } from './finance/finance.module';
import { AppController } from './app.controller';
import { IncidentsModule } from './incidents/incidents.module';
import { LoggerInterceptor } from './prisma/logger.interceptor';
import { AuditModule } from './common/audit/audit.module';
import { AuditInterceptor } from './common/audit/audit.interceptor';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { MailModule } from './common/mail/mail.module';
import { NotificationModule } from './common/notifications/notification.module';
import { BackupModule } from './backup/backup.module';
import { InventoryModule } from './inventory/inventory.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { ComplianceModule } from './compliance/compliance.module';
import { PurchasingModule } from './purchasing/purchasing.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { TyresModule } from './tyres/tyres.module';
import { TenantMiddleware } from './prisma/tenant.middleware';


@Module({
    controllers: [AppController],
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        ScheduleModule.forRoot(),
        ThrottlerModule.forRoot([{
            ttl: 60000,
            limit: 100,
        }]),
        PrismaModule,
        AuditModule,
        MailModule,
        NotificationModule,
        AuthModule,
        VehiclesModule,
        DriversModule,
        JourneysModule,
        StorageModule,
        SyncModule,
        ReportsModule,
        LocationsModule,
        HealthModule,
        FinanceModule,
        MaintenanceModule,
        FuelModule,
        UsersModule,
        IncidentsModule,
        BackupModule,
        InventoryModule,
        TelemetryModule,
        ComplianceModule,
        PurchasingModule,
        TyresModule,
        AttachmentsModule,
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: LoggerInterceptor,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: AuditInterceptor,
        },
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(TenantMiddleware)
            .forRoutes({ path: '*', method: RequestMethod.ALL });
    }
}
