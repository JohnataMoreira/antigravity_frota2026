import { Controller, Get, Post, Delete, UseGuards, Request, Body, Param } from '@nestjs/common';
import { MaintenanceService } from '../maintenance.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CreateMaintenanceTemplateDto } from '../dto/create-template.dto';

@Controller('maintenance-templates')
@UseGuards(JwtAuthGuard)
export class MaintenanceTemplateController {
    constructor(private readonly maintenanceService: MaintenanceService) { }

    @Get()
    findAll() {
        return this.maintenanceService.findAllTemplates();
    }

    @Post()
    create(@Request() req: any, @Body() dto: CreateMaintenanceTemplateDto) {
        return this.maintenanceService.createTemplate({
            ...dto,
            organizationId: req.user.organizationId
        });
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.maintenanceService.deleteTemplate(id);
    }
}
