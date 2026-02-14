import { Module } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceAlertsService } from './alerts.service';

@Module({
    controllers: [MaintenanceController],
    providers: [MaintenanceService, MaintenanceAlertsService],
    exports: [MaintenanceService, MaintenanceAlertsService],
})
export class MaintenanceModule { }
