import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { FinesService, FineStatus } from './fines.service';
// import { FineStatus } from '@prisma/client'; // Disabled until prisma generate matches schema

@Controller('fines')
export class FinesController {
    constructor(private readonly finesService: FinesService) { }

    @Post()
    create(@Body() data: any, @Query('orgId') organizationId: string) {
        // Note: In real app, organizationId comes from JWT/User request
        return this.finesService.create(organizationId, data);
    }

    @Get()
    findAll(@Query('orgId') organizationId: string, @Query() filters: any) {
        return this.finesService.findAll(organizationId, filters);
    }

    @Get('summary')
    getSummary(@Query('orgId') organizationId: string) {
        return this.finesService.getFinesSummary(organizationId);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Query('orgId') organizationId: string) {
        return this.finesService.findOne(id, organizationId);
    }

    @Patch(':id/status')
    updateStatus(
        @Param('id') id: string,
        @Body('status') status: FineStatus,
        @Query('orgId') organizationId: string,
    ) {
        return this.finesService.updateStatus(id, organizationId, status);
    }

    @Post(':id/auto-identify')
    autoIdentify(@Param('id') id: string) {
        return this.finesService.autoIdentifyDriver(id);
    }
}
