import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('compliance')
@UseGuards(JwtAuthGuard)
export class ComplianceController {
    constructor(private readonly complianceService: ComplianceService) { }

    @Post('templates')
    create(@Request() req: any, @Body() data: any) {
        return this.complianceService.createTemplate(req.user.organizationId, data);
    }

    @Get('templates')
    findAll(@Request() req: any) {
        return this.complianceService.findAllTemplates(req.user.organizationId);
    }

    @Patch('templates/:id')
    update(@Request() req: any, @Param('id') id: string, @Body() data: any) {
        return this.complianceService.updateTemplate(id, req.user.organizationId, data);
    }

    @Delete('templates/:id')
    remove(@Request() req: any, @Param('id') id: string) {
        return this.complianceService.deleteTemplate(id, req.user.organizationId);
    }
}
