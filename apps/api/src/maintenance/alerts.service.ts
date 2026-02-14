import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../common/notifications/notification.service';

@Injectable()
export class MaintenanceAlertsService {
    constructor(
        private prisma: PrismaService,
        private notificationService: NotificationService
    ) { }

    async checkAlerts(organizationId: string) {
        // Rule: Maintenance every 10,000 km
        const MAINTENANCE_INTERVAL = 10000;

        const vehicles = await this.prisma.vehicle.findMany({
            where: { organizationId, status: { not: 'MAINTENANCE' } }
        });

        const alerts = vehicles
            .map(v => {
                const kmSinceLast = v.currentKm - (v.lastMaintenanceKm || 0);
                const kmToNext = MAINTENANCE_INTERVAL - kmSinceLast;

                if (kmToNext <= 1000) { // Alert 1000km before
                    return {
                        vehicleId: v.id,
                        plate: v.plate,
                        model: v.model,
                        severity: kmToNext <= 0 ? 'CRITICAL' : 'WARNING',
                        message: kmToNext <= 0
                            ? `Manutenção vencida há ${Math.abs(kmToNext)} km`
                            : `Manutenção próxima: faltam ${kmToNext} km`,
                        kmSinceLast,
                        nextMaintenanceKm: (v.lastMaintenanceKm || 0) + MAINTENANCE_INTERVAL
                    };
                }
                return null;
            })
            .filter((a): a is NonNullable<typeof a> => a !== null);

        const sortedAlerts = alerts.sort((a, b) => a.severity === 'CRITICAL' ? -1 : 1);

        // Notify Admins about Critical Alerts
        const criticalCount = alerts.filter(a => a.severity === 'CRITICAL').length;
        if (criticalCount > 0) {
            await this.notificationService.notifyAdmins(
                organizationId,
                '🚨 Manutenções Críticas',
                `Existem ${criticalCount} veículos com manutenção vencida.`
            );
        }

        return sortedAlerts;
    }
}
