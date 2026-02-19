import { Module } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceTemplateController } from './maintenance-template.controller';
import { MaintenanceAlertsService } from './alerts.service';
import { FinanceModule } from '../finance/finance.module';

@Module({
    imports: [FinanceModule],
    controllers: [MaintenanceController, MaintenanceTemplateController],
    providers: [MaintenanceService, MaintenanceAlertsService],
    exports: [MaintenanceService, MaintenanceAlertsService],
})
export class MaintenanceModule { }
