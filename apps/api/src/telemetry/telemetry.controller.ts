import { Controller, Post, Body, Param, Get, Query, UseGuards, Request } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { IngestTelemetryDto } from './dto/ingest-telemetry.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('telemetry')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('telemetry')
export class TelemetryController {
    constructor(private readonly telemetryService: TelemetryService) { }

    @Post('ingest/:vehicleId')
    @ApiOperation({ summary: 'Ingerir dados de telemetria de um veículo' })
    ingest(
        @Param('vehicleId') vehicleId: string,
        @Request() req: any,
        @Body() data: IngestTelemetryDto
    ) {
        return this.telemetryService.ingest(vehicleId, req.user.organizationId, data);
    }

    @Get('history/:vehicleId')
    @ApiOperation({ summary: 'Obter histórico de telemetria de um veículo' })
    getHistory(
        @Param('vehicleId') vehicleId: string,
        @Request() req: any,
        @Query('limit') limit?: number
    ) {
        return this.telemetryService.getHistory(vehicleId, req.user.organizationId, limit ? Number(limit) : 100);
    }
}
