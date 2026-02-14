import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { StockService } from './stock.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('stock')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StockController {
    constructor(private readonly stockService: StockService) { }

    @Get()
    async findAll() {
        return this.stockService.findAll();
    }

    @Post()
    @Roles(Role.ADMIN)
    async create(@Body() dto: any) {
        return this.stockService.create(dto);
    }

    @Post('movement')
    @Roles(Role.ADMIN, Role.DRIVER) // Drivers might register usage (e.g. fluid top-up)
    async registerMovement(@Req() req: any, @Body() dto: any) {
        return this.stockService.registerMovement({
            ...dto,
            userId: req.user.id
        });
    }

    @Get('alerts')
    @Roles(Role.ADMIN)
    async getAlerts() {
        return this.stockService.getAlerts();
    }
}
