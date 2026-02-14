/* eslint-disable @typescript-eslint/no-explicit-any */
import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('maintenance')
export class MaintenanceController {
    constructor(private readonly maintenanceService: MaintenanceService) { }

    @Post()
    create(@Body() data: any) {
        return this.maintenanceService.create(data);
    }

    @Get()
    findAll() {
        return this.maintenanceService.findAll();
    }

    @Get('vehicle/:vehicleId')
    findByVehicle(@Param('vehicleId') vehicleId: string) {
        return this.maintenanceService.findByVehicle(vehicleId);
    }

    @Post(':id/complete')
    complete(
        @Param('id') id: string,
        @Body() data: { cost: number; notes?: string; lastKm: number }
    ) {
        return this.maintenanceService.complete(id, data);
    }
}
