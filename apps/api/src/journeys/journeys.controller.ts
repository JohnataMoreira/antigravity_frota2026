import { Controller, Get, Post, Body, Param, Patch, Request } from '@nestjs/common';
import { JourneysService } from './journeys.service';
import { StartJourneyDto, EndJourneyDto } from './dto';

@Controller('journeys')
export class JourneysController {
    constructor(private readonly journeysService: JourneysService) { }

    @Post('start')
    start(@Request() req: any, @Body() dto: StartJourneyDto) {
        return this.journeysService.start(req.user.organizationId, req.user.userId, dto);
    }

    @Patch(':id/end')
    end(@Request() req: any, @Param('id') id: string, @Body() dto: EndJourneyDto) {
        return this.journeysService.end(req.user.organizationId, req.user.userId, id, dto);
    }

    @Get('active')
    findActive(@Request() req: any) {
        return this.journeysService.findActive(req.user.organizationId, req.user.userId);
    }

    @Get()
    findAll(@Request() req: any) {
        return this.journeysService.findAll(req.user.organizationId);
    }
}
