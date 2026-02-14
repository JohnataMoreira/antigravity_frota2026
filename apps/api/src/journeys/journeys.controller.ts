import { Controller, Get, Post, Body, Param, Patch, Request, UseGuards } from '@nestjs/common';
import { JourneysService } from './journeys.service';
import { StartJourneyDto, EndJourneyDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserRequest } from '../auth/user-request.interface';

@UseGuards(JwtAuthGuard)
@Controller('journeys')
export class JourneysController {
    constructor(private readonly journeysService: JourneysService) { }

    @Post('start')
    start(@Request() req: UserRequest, @Body() dto: StartJourneyDto) {
        return this.journeysService.start(req.user.userId, dto);
    }

    @Patch(':id/end')
    end(@Request() req: UserRequest, @Param('id') id: string, @Body() dto: EndJourneyDto) {
        return this.journeysService.end(req.user.userId, id, dto);
    }

    @Get('active')
    findActive(@Request() req: UserRequest) {
        return this.journeysService.findActive(req.user.userId);
    }

    @Get()
    findAll() {
        return this.journeysService.findAll();
    }
}
