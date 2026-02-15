import { Controller, Get, Post, Body, Patch, Param, Query, Request, UseGuards } from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserRequest } from '../auth/user-request.interface';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('Incidentes')
@ApiBearerAuth()
@Controller('incidents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IncidentsController {
    constructor(private readonly incidentsService: IncidentsService) { }

    @Post()
    @ApiOperation({ summary: 'Relatar um novo incidente de veículo' })
    @ApiResponse({ status: 201, description: 'Incidente relatado com sucesso.' })
    create(@Request() req: UserRequest, @Body() createIncidentDto: CreateIncidentDto) {
        return this.incidentsService.create(req.user.userId, createIncidentDto);
    }

    @Get()
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Listar todos os incidentes (Admin)' })
    @ApiQuery({ name: 'status', required: false, description: 'Filtrar por status (OPEN, RESOLVED)' })
    findAll(@Query('status') status?: string) {
        return this.incidentsService.findAll(status);
    }

    @Patch(':id/resolve')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Marcar incidente como resolvido' })
    @ApiResponse({ status: 200, description: 'Incidente resolvido com sucesso.' })
    resolve(@Param('id') id: string) {
        return this.incidentsService.resolve(id);
    }
}
