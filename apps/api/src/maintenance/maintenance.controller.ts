import { Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceAlertsService } from './alerts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('maintenance')
@UseGuards(JwtAuthGuard)
export class MaintenanceController {
    constructor(
        private readonly maintenanceService: MaintenanceService,
        private readonly alertsService: MaintenanceAlertsService
    ) { }

    @Get()
    findAll() {
        return this.maintenanceService.findAll();
    }

    @Get('alerts')
    async getAlerts(@Request() req: any) {
        return this.alertsService.checkAlerts(req.user.organizationId);
    }

    @Post()
    create(@Request() req: any) { // Body would be a DTO
        return this.maintenanceService.create({ ...req.body, organizationId: req.user.organizationId });
    }

    @Post(':id/complete')
    complete(@Request() req: any) {
        return this.maintenanceService.complete(req.params.id, req.body);
    }
}
