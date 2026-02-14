import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationService {
    async sendPush(userId: string, title: string, body: string, data?: any) {
        // Placeholder for OneSignal or FCM integration
        console.log(`[PUSH] To: ${userId} | Title: ${title} | Body: ${body}`);
        return { success: true, messageId: Math.random().toString(36).substring(7) };
    }
}
