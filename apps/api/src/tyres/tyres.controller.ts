import { Controller, Get, Post, Put, Param, Body, Req, UseGuards, Query } from '@nestjs/common';
import { TyresService } from './tyres.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

// Definir a tipagem extendida do Request do Express que nossa engine de Auth cria
interface UserRequest extends Request {
    user?: {
        organizationId: string;
        [key: string]: any;
    };
}

@Controller('tyres')
@UseGuards(JwtAuthGuard)
export class TyresController {
    constructor(private readonly tyresService: TyresService) { }

    @Get('stats')
    async getDashboardStats(@Req() req: UserRequest) {
        const organizationId = req.user!.organizationId;
        return this.tyresService.getTyreDashboardStats(organizationId);
    }

    @Get()
    async getTyres(@Req() req: UserRequest, @Query() filters: any) {
        const organizationId = req.user!.organizationId;
        return this.tyresService.getTyres(organizationId, filters);
    }

    @Post()
    async createTyre(@Req() req: UserRequest, @Body() data: any) {
        const organizationId = req.user!.organizationId;
        return this.tyresService.createTyre(organizationId, data);
    }

    @Put(':id/allocate')
    async allocateTyre(
        @Req() req: UserRequest,
        @Param('id') id: string,
        @Body() body: { vehicleId: string; installKm: number }
    ) {
        const organizationId = req.user!.organizationId;
        return this.tyresService.allocateTyre(organizationId, id, body.vehicleId, body.installKm);
    }

    @Put(':id/discard')
    async discardTyre(
        @Req() req: UserRequest,
        @Param('id') id: string,
        @Body() body: { currentVehicleKm: number; reason: string }
    ) {
        const organizationId = req.user!.organizationId;
        return this.tyresService.discardTyre(organizationId, id, body.currentVehicleKm, body.reason);
    }
}
