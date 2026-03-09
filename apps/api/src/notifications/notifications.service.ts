import { Injectable, Logger } from '@nestjs/common';
import * as webpush from 'web-push';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);
    private expo = new Expo();

    constructor(private prisma: PrismaService) {
        const publicKey = process.env.VAPID_PUBLIC_KEY;
        const privateKey = process.env.VAPID_PRIVATE_KEY;

        if (publicKey && privateKey) {
            webpush.setVapidDetails(
                'mailto:suporte@frota2026.com',
                publicKey,
                privateKey
            );
        } else {
            this.logger.warn('As chaves VAPID (VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY) não estão configuradas. O Web Push não funcionará.');
        }
    }

    async subscribeUser(userId: string, subscription: any) {
        const pushToken = typeof subscription === 'string'
            ? subscription
            : JSON.stringify(subscription);

        await this.prisma.user.update({
            where: { id: userId },
            data: { pushToken },
        });
        return { success: true };
    }

    async sendPushNotificationToUser(userId: string, payload: { title: string; body: string; data?: any }) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { pushToken: true },
            });

            if (!user || !user.pushToken) {
                this.logger.warn(`Usuário ${userId} não possui um pushToken registrado.`);
                return false;
            }

            // Check if it's an Expo Token
            if (user.pushToken.startsWith('ExponentPushToken') || user.pushToken.startsWith('ExpoPushToken')) {
                return this.sendExpoPush(user.pushToken, payload);
            }

            // Otherwise, assume it's Web Push (JSON)
            const subscription = JSON.parse(user.pushToken);
            await webpush.sendNotification(subscription, JSON.stringify(payload));
            return true;
        } catch (error) {
            this.logger.error(`Erro ao enviar Push Notification para usuário ${userId}`, error);
            if ((error as any).statusCode === 410 || (error as any).statusCode === 404) {
                this.invalidateToken(userId);
            }
            return false;
        }
    }

    private async sendExpoPush(token: string, payload: { title: string; body: string; data?: any }) {
        if (!Expo.isExpoPushToken(token)) {
            this.logger.error(`Token ${token} não é um token Expo válido.`);
            return false;
        }

        const messages: ExpoPushMessage[] = [{
            to: token,
            sound: 'default',
            title: payload.title,
            body: payload.body,
            data: payload.data,
        }];

        try {
            const chunks = this.expo.chunkPushNotifications(messages);
            for (const chunk of chunks) {
                await this.expo.sendPushNotificationsAsync(chunk);
            }
            return true;
        } catch (error) {
            this.logger.error('Erro ao enviar Expo Push', error);
            return false;
        }
    }

    private async invalidateToken(userId: string) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { pushToken: null },
        });
    }

    async triggerTestPush(userId: string) {
        return this.sendPushNotificationToUser(userId, {
            title: 'Alerta Frota2026 🚛',
            body: 'O sistema de notificações mobile foi ativado com sucesso!',
            data: { url: '/(tabs)/' }
        });
    }

    async notifyAdmins(organizationId: string, title: string, body: string, data?: any) {
        const admins = await this.prisma.user.findMany({
            where: { organizationId, role: 'ADMIN', active: true, pushToken: { not: null } },
            select: { id: true }
        });

        for (const admin of admins) {
            await this.sendPushNotificationToUser(admin.id, { title, body, data });
        }
    }
}
