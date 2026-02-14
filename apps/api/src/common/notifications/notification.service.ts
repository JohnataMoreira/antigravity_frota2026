import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class NotificationService {
    constructor(private prisma: PrismaService) { }

    async sendPush(userId: string, title: string, body: string, data?: any) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { pushToken: true }
        });

        if (!user?.pushToken) {
            console.log(`[PUSH-SKIP] User ${userId} has no push token`);
            return;
        }

        try {
            // Expo Push Notification API
            await axios.post('https://exp.host/--/api/v2/push/send', {
                to: user.pushToken,
                title,
                body,
                data,
                sound: 'default'
            });
            console.log(`[PUSH-SENT] To: ${userId} | Title: ${title}`);
        } catch (error: any) {
            console.error('[PUSH-ERROR] Failed to send push', error.response?.data || error.message);
        }
    }

    async notifyAdmins(organizationId: string, title: string, body: string, data?: any) {
        const admins = await this.prisma.user.findMany({
            where: { organizationId, role: 'ADMIN', active: true, pushToken: { not: null } },
            select: { id: true, pushToken: true }
        });

        for (const admin of admins) {
            await this.sendPush(admin.id, title, body, data);
        }
    }
}
