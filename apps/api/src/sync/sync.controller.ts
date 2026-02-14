import { Body, Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { SyncService } from './sync.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserRequest } from '../auth/user-request.interface';

@Controller('sync')
@UseGuards(JwtAuthGuard)
export class SyncController {
    constructor(private readonly syncService: SyncService) { }

    @Get('pull')
    pull(@Query('lastPulledAt') lastPulledAt: string) {
        return this.syncService.pull(parseInt(lastPulledAt, 10) || 0);
    }

    @Post('push')
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    push(@Request() req: UserRequest, @Body() changes: any) {
        return this.syncService.push(changes, req.user.userId);
    }
}
