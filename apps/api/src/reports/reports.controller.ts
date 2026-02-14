import { Controller, Get, UseGuards, Query, Req } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
    constructor(private reportsService: ReportsService) { }

    @Get('overview')
    async getOverview(@Req() req: any) {
        return this.reportsService.getOverview(req.user.organizationId);
    }

    @Get('drivers')
    async getDriverPerformance(
        @Req() req: any,
        @Query('start') start?: string,
        @Query('end') end?: string
    ) {
        const startDate = start ? new Date(start) : undefined;
        const endDate = end ? new Date(end) : undefined;
        return this.reportsService.getDriverPerformance(req.user.organizationId, startDate, endDate);
    }

    @Get('vehicles')
    async getVehicleUtilization(
        @Req() req: any,
        @Query('start') start?: string,
        @Query('end') end?: string
    ) {
        const startDate = start ? new Date(start) : undefined;
        const endDate = end ? new Date(end) : undefined;
        return this.reportsService.getVehicleUtilization(req.user.organizationId, startDate, endDate);
    }
}
