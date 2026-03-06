import { Injectable, Logger } from '@nestjs/common';
import * as webpush from 'web-push';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

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
        await this.prisma.user.update({
            where: { id: userId },
            data: { pushToken: JSON.stringify(subscription) },
        });
        return { success: true };
    }

    async sendPushNotificationToUser(userId: string, payload: any) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { pushToken: true },
            });

            if (!user || !user.pushToken) {
                this.logger.warn(`Usuário ${userId} não possui um pushToken registrado.`);
                return false;
            }

            const subscription = JSON.parse(user.pushToken);
            await webpush.sendNotification(subscription, JSON.stringify(payload));
            return true;
        } catch (error) {
            this.logger.error(`Erro ao enviar Push Notification para usuário ${userId}`, error);
            if ((error as any).statusCode === 410 || (error as any).statusCode === 404) {
                // Subscription is no longer valid, remove it
                await this.prisma.user.update({
                    where: { id: userId },
                    data: { pushToken: null },
                });
            }
            return false;
        }
    }

    // Usado para testar
    async triggerTestPush(userId: string) {
        return this.sendPushNotificationToUser(userId, {
            title: 'Teste de Notificação PWA',
            body: 'Se você está vendo isso, o Web Push nativo está funcionando no Frota2026!',
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            data: { url: '/dashboard' }
        });
    }
}
