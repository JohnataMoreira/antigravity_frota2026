import { Controller, Get, Post, Body, UseGuards, Request, Query } from '@nestjs/common';
import { FuelService } from './fuel.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateFuelDto } from './dto/create-fuel.dto';
import { UserRequest } from '../auth/user-request.interface';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Abastecimento')
@ApiBearerAuth()
@Controller('fuel')
@UseGuards(JwtAuthGuard)
export class FuelController {
    constructor(private readonly fuelService: FuelService) { }

    @Post()
    @ApiOperation({ summary: 'Registrar novo abastecimento' })
    @ApiResponse({ status: 201, description: 'Abastecimento registrado com sucesso.' })
    async create(@Request() req: UserRequest, @Body() dto: CreateFuelDto) {
        return this.fuelService.create({
            ...dto,
            organizationId: req.user.organizationId,
            driverId: req.user.userId || req.user.userId // Correcting field access
        });
    }

    @Get()
    @ApiOperation({ summary: 'Listar todos os abastecimentos' })
    async findAll(
        @Request() req: UserRequest,
        @Query('vehicleId') vehicleId?: string,
        @Query('driverId') driverId?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.fuelService.findAll(req.user.organizationId, {
            vehicleId,
            driverId,
            startDate,
            endDate
        });
    }

    @Get('stats')
    @ApiOperation({ summary: 'Obter estatísticas de consumo' })
    async getStats(
        @Request() req: UserRequest,
        @Query('vehicleId') vehicleId?: string
    ) {
        return this.fuelService.getStats(req.user.organizationId, vehicleId);
    }
}
