import { Controller, Get, Post, UseGuards, Request, Param, Body } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceAlertsService } from './alerts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserRequest } from '../auth/user-request.interface';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { CompleteMaintenanceDto } from './dto/complete-maintenance.dto';
import { CreateMaintenanceTemplateDto } from './dto/create-template.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

@ApiTags('Manutenção')
@ApiBearerAuth()
@Controller('maintenance')
@UseGuards(JwtAuthGuard)
export class MaintenanceController {
    constructor(
        private readonly maintenanceService: MaintenanceService,
        private readonly alertsService: MaintenanceAlertsService
    ) { }

    @Get()
    @ApiOperation({ summary: 'Listar todas as manutenções' })
    findAll() {
        return this.maintenanceService.findAll();
    }

    @Get('alerts')
    @ApiOperation({ summary: 'Obter alertas de manutenção preventiva' })
    async getAlerts(@Request() req: UserRequest) {
        return this.alertsService.checkAlerts(req.user.organizationId);
    }

    @Post()
    @ApiOperation({ summary: 'Registrar nova solicitação de manutenção' })
    @ApiResponse({ status: 201, description: 'Manutenção agendada com sucesso.' })
    create(@Request() req: UserRequest, @Body() dto: CreateMaintenanceDto) {
        return this.maintenanceService.create({ ...dto, organizationId: req.user.organizationId });
    }

    @Post(':id/complete')
    @ApiOperation({ summary: 'Marcar manutenção como concluída' })
    @ApiResponse({ status: 200, description: 'Manutenção concluída com sucesso.' })
    complete(@Request() _req: UserRequest, @Param('id') id: string, @Body() dto: CompleteMaintenanceDto) {
        return this.maintenanceService.complete(id, dto);
    }

    @Post('templates')
    @ApiOperation({ summary: 'Criar novo template de manutenção (Catálogo)' })
    @ApiResponse({ status: 201, description: 'Template criado com sucesso.' })
    createTemplate(@Request() req: UserRequest, @Body() dto: CreateMaintenanceTemplateDto) {
        return this.maintenanceService.createTemplate({ ...dto, organizationId: req.user.organizationId });
    }
}
