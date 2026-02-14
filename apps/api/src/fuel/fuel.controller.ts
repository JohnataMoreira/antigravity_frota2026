import { Controller, Get, Post, Body, UseGuards, Request, Query } from '@nestjs/common';
import { FuelService } from './fuel.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('fuel')
@UseGuards(JwtAuthGuard)
export class FuelController {
    constructor(private readonly fuelService: FuelService) { }

    @Post()
    async create(@Request() req: any, @Body() data: any) {
        return this.fuelService.create({
            ...data,
            organizationId: req.user.organizationId,
            driverId: req.user.id
        });
    }

    @Get()
    async findAll(@Request() req: any) {
        return this.fuelService.findAll(req.user.organizationId);
    }

    @Get('stats')
    async getStats(
        @Request() req: any,
        @Query('vehicleId') vehicleId?: string
    ) {
        return this.fuelService.getStats(req.user.organizationId, vehicleId);
    }
}
