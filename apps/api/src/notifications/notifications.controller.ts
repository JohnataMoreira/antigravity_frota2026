import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Post('subscribe')
    async subscribe(@Request() req: any, @Body() subscription: any) {
        // req.user from JwtAuthGuard contains the authenticated user
        return this.notificationsService.subscribeUser(req.user.id, subscription);
    }

    @Post('test')
    async testPush(@Request() req: any) {
        // Triggers a test push notification to the current authenticated user
        await this.notificationsService.triggerTestPush(req.user.id);
        return { message: 'Push test sent' };
    }
}
