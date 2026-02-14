import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Request } from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('incidents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IncidentsController {
    constructor(private readonly incidentsService: IncidentsService) { }

    @Post()
    create(@Request() req: any, @Body() createIncidentDto: CreateIncidentDto) {
        return this.incidentsService.create(req.user.id, createIncidentDto);
    }

    @Get()
    @Roles(Role.ADMIN)
    findAll(@Query('status') status?: string) {
        return this.incidentsService.findAll(status);
    }

    @Patch(':id/resolve')
    @Roles(Role.ADMIN)
    resolve(@Param('id') id: string) {
        return this.incidentsService.resolve(id);
    }
}
