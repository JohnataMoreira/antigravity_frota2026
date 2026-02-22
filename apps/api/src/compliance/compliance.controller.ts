import { Controller, Get, Post, Body, Req, UseGuards, Query } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

// Definir a tipagem extendida do Request do Express
interface UserRequest extends Request {
    user?: {
        organizationId: string;
        [key: string]: any;
    };
}

@Controller('compliance')
@UseGuards(JwtAuthGuard)
export class ComplianceController {
    constructor(private readonly complianceService: ComplianceService) { }

    @Post('documents')
    async createDocument(@Req() req: UserRequest, @Body() data: any) {
        const organizationId = req.user!.organizationId;
        return this.complianceService.createDocument(organizationId, data);
    }

    @Get('documents')
    async getDocuments(@Req() req: UserRequest, @Query() filters: any) {
        const organizationId = req.user!.organizationId;
        return this.complianceService.getDocuments(organizationId, filters);
    }

    @Get('alerts')
    async getComplianceAlerts(
        @Req() req: UserRequest,
        @Query('vehicleId') vehicleId?: string,
        @Query('driverId') driverId?: string
    ) {
        const organizationId = req.user!.organizationId;
        return this.complianceService.getComplianceAlerts(organizationId, vehicleId, driverId);
    }
}
