import { Controller, Get, Post, Body, Param, Patch, Request, UseGuards } from '@nestjs/common';
import { JourneysService } from './journeys.service';
import { StartJourneyDto, EndJourneyDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserRequest } from '../auth/user-request.interface';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

@ApiTags('Jornadas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('journeys')
export class JourneysController {
    constructor(private readonly journeysService: JourneysService) { }

    @Post('start')
    @ApiOperation({ summary: 'Iniciar uma nova jornada de veículo' })
    @ApiResponse({ status: 201, description: 'Jornada iniciada com sucesso.' })
    start(@Request() req: UserRequest, @Body() dto: StartJourneyDto) {
        return this.journeysService.start(req.user.userId, dto);
    }

    @Patch(':id/end')
    @ApiOperation({ summary: 'Encerrar uma jornada ativa' })
    @ApiResponse({ status: 200, description: 'Jornada encerrada com sucesso.' })
    end(@Request() req: UserRequest, @Param('id') id: string, @Body() dto: EndJourneyDto) {
        return this.journeysService.end(req.user.userId, id, dto);
    }

    @Get('active')
    @ApiOperation({ summary: 'Obter jornada ativa do motorista' })
    findActive(@Request() req: UserRequest) {
        return this.journeysService.findActive(req.user.userId);
    }

    @Get()
    findAll() {
        return this.journeysService.findAll();
    }
}
