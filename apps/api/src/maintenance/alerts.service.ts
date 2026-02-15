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
        const vehicles = await this.prisma.vehicle.findMany({
            where: { organizationId, status: { not: 'MAINTENANCE' } }
        });

        const templates = await this.prisma.maintenanceTemplate.findMany({
            where: { organizationId }
        }) as any[]; // Type assertion for intervalKm

        const alerts: any[] = [];

        for (const vehicle of vehicles) {
            const applicableTemplates = templates.filter(t =>
                t.vehicleTypes.includes(vehicle.type)
            );

            for (const template of applicableTemplates) {
                // Find last completed maintenance for this template/type
                const lastMaintenance = await this.prisma.maintenance.findFirst({
                    where: {
                        vehicleId: vehicle.id,
                        status: 'COMPLETED',
                        // Since we don't have templateId in Maintenance yet, 
                        // we match by type or name if possible. 
                        // For now, let's use the vehicle's lastMaintenanceKm as a fallback.
                    },
                    orderBy: { performedAt: 'desc' }
                });

                const baseKm = lastMaintenance?.lastKm ?? vehicle.lastMaintenanceKm ?? 0;
                const kmSinceLast = vehicle.currentKm - baseKm;
                const kmToNext = template.intervalKm - kmSinceLast;

                if (kmToNext <= 500) {
                    alerts.push({
                        id: `${vehicle.id}-${template.id}`,
                        vehicleId: vehicle.id,
                        plate: vehicle.plate,
                        model: vehicle.model,
                        templateName: template.name,
                        templateId: template.id,
                        severity: kmToNext <= 0 ? 'CRITICAL' : 'WARNING',
                        message: kmToNext <= 0
                            ? `${template.name} vencido há ${Math.abs(kmToNext)} km`
                            : `${template.name} próximo: faltam ${kmToNext} km`,
                        kmSinceLast,
                        baseKm,
                        nextMaintenanceKm: baseKm + template.intervalKm
                    });
                }
            }
        }

        const sortedAlerts = alerts.sort((a, b) => {
            if (a.severity === 'CRITICAL' && b.severity !== 'CRITICAL') return -1;
            if (a.severity !== 'CRITICAL' && b.severity === 'CRITICAL') return 1;
            return 0;
        });

        // Notify Admins about Critical Alerts
        const criticalCount = alerts.filter(a => a.severity === 'CRITICAL').length;
        if (criticalCount > 0) {
            await this.notificationService.notifyAdmins(
                organizationId,
                '🚨 Manutenções Críticas',
                `Existem ${criticalCount} veículos com manutenção preventiva vencida.`
            );
        }

        return sortedAlerts;
    }
}
