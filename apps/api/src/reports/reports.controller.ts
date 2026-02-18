import { Controller, Get, UseGuards, Query, Request } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsExportService } from './reports-export.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserRequest } from '../auth/user-request.interface';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('Relatórios')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
    constructor(
        private reportsService: ReportsService,
        private reportsExportService: ReportsExportService,
    ) { }

    @Get('overview')
    @ApiOperation({ summary: 'Resumo geral da frota (KPIs)' })
    async getOverview(@Request() req: UserRequest, @Query() query: any) {
        return this.reportsService.getOverview(req.user.organizationId, query);
    }

    @Get('drivers')
    @ApiOperation({ summary: 'Desempenho por motorista' })
    @ApiQuery({ name: 'start', required: false, description: 'Data inicial (ISO)' })
    @ApiQuery({ name: 'end', required: false, description: 'Data final (ISO)' })
    async getDriverPerformance(
        @Request() req: UserRequest,
        @Query('start') start?: string,
        @Query('end') end?: string
    ) {
        const startDate = start ? new Date(start) : undefined;
        const endDate = end ? new Date(end) : undefined;
        return this.reportsService.getDriverPerformance(req.user.organizationId, startDate, endDate);
    }

    @Get('vehicles')
    @ApiOperation({ summary: 'Uso da frota por veículo' })
    @ApiQuery({ name: 'start', required: false, description: 'Data inicial (ISO)' })
    @ApiQuery({ name: 'end', required: false, description: 'Data final (ISO)' })
    async getVehicleUtilization(
        @Request() req: UserRequest,
        @Query('start') start?: string,
        @Query('end') end?: string
    ) {
        const startDate = start ? new Date(start) : undefined;
        const endDate = end ? new Date(end) : undefined;
        return this.reportsService.getVehicleUtilization(req.user.organizationId, startDate, endDate);
    }

    @Get('driver-ranking')
    @ApiOperation({ summary: 'Ranking de pontuação dos motoristas' })
    @ApiQuery({ name: 'start', required: false, description: 'Data inicial (ISO)' })
    @ApiQuery({ name: 'end', required: false, description: 'Data final (ISO)' })
    async getDriverRanking(
        @Request() req: UserRequest,
        @Query('start') start?: string,
        @Query('end') end?: string
    ) {
        const startDate = start ? new Date(start) : undefined;
        const endDate = end ? new Date(end) : undefined;
        return this.reportsService.getDriverRanking(req.user.organizationId, startDate, endDate);
    }

    @Get('export/journeys')
    @ApiOperation({ summary: 'Dados consolidados para exportação de jornadas' })
    @ApiQuery({ name: 'start', required: false })
    @ApiQuery({ name: 'end', required: false })
    @ApiQuery({ name: 'driverId', required: false })
    @ApiQuery({ name: 'vehicleId', required: false })
    async getJourneysExport(
        @Request() req: UserRequest,
        @Query('start') start?: string,
        @Query('end') end?: string,
        @Query('driverId') driverId?: string,
        @Query('vehicleId') vehicleId?: string,
    ) {
        return this.reportsExportService.getJourneysExportData(req.user.organizationId, { start, end, driverId, vehicleId });
    }

    @Get('export/expenses')
    @ApiOperation({ summary: 'Dados consolidados para exportação de despesas (Combustível + Manutenção)' })
    @ApiQuery({ name: 'start', required: false })
    @ApiQuery({ name: 'end', required: false })
    @ApiQuery({ name: 'vehicleId', required: false })
    async getExpensesExport(
        @Request() req: UserRequest,
        @Query('start') start?: string,
        @Query('end') end?: string,
        @Query('vehicleId') vehicleId?: string,
    ) {
        return this.reportsExportService.getExpensesExportData(req.user.organizationId, { start, end, vehicleId });
    }
}
