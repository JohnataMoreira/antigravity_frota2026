import { Module } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceTemplateController } from './maintenance-template.controller';
import { MaintenanceAlertsService } from './alerts.service';

@Module({
    controllers: [MaintenanceController, MaintenanceTemplateController],
    providers: [MaintenanceService, MaintenanceAlertsService],
    exports: [MaintenanceService, MaintenanceAlertsService],
})
export class MaintenanceModule { }
