import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('maintenance')
@UseGuards(JwtAuthGuard)
export class MaintenanceController {
    constructor(private readonly maintenanceService: MaintenanceService) { }

    @Post()
    create(@Request() req: any, @Body() createMaintenanceDto: any) {
        return this.maintenanceService.create({
            ...createMaintenanceDto,
            organizationId: req.user.organizationId,
        });
    }

    @Get()
    findAll(@Request() req: any) {
        return this.maintenanceService.findAll(req.user.organizationId);
    }

    @Post(':id/complete')
    complete(
        @Param('id') id: string,
        @Request() req: any,
        @Body() data: { cost: number; notes?: string; lastKm: number }
    ) {
        return this.maintenanceService.complete(id, req.user.organizationId, data);
    }
}
