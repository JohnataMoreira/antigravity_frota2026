import { Controller, Get, Post, Body, Query, Request, UseGuards } from '@nestjs/common';
import { SyncService } from './sync.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('sync')
export class SyncController {
    constructor(private readonly syncService: SyncService) { }

    @Get()
    async pull(@Request() req: any, @Query('last_pulled_at') lastPulledAt: string) {
        const timestamp = lastPulledAt ? parseInt(lastPulledAt) : 0;
        return this.syncService.pull(timestamp, req.user.organizationId);
    }

    @Post()
    async push(@Request() req: any, @Body() changes: any) {
        await this.syncService.push(changes, req.user.organizationId, req.user.userId);
        return { status: 'ok' };
    }
}
