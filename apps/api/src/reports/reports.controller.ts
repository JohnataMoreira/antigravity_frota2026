import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
    constructor(private reportsService: ReportsService) { }

    @Get('overview')
    async getOverview() {
        return this.reportsService.getOverview();
    }

    @Get('drivers')
    async getDriverPerformance(
        @Query('start') start?: string,
        @Query('end') end?: string
    ) {
        const startDate = start ? new Date(start) : undefined;
        const endDate = end ? new Date(end) : undefined;
        return this.reportsService.getDriverPerformance(startDate, endDate);
    }

    @Get('vehicles')
    async getVehicleUtilization(
        @Query('start') start?: string,
        @Query('end') end?: string
    ) {
        const startDate = start ? new Date(start) : undefined;
        const endDate = end ? new Date(end) : undefined;
        return this.reportsService.getVehicleUtilization(startDate, endDate);
    }
}
