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

                // Time-based calculation
                const baseDate = lastMaintenance?.performedAt ?? vehicle.lastMaintenanceDate ?? vehicle.createdAt;
                const monthsSinceLast = (new Date().getTime() - new Date(baseDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44);
                const monthsToNext = (template.intervalMonths ?? 12) - monthsSinceLast;

                if (kmToNext <= 500 || monthsToNext <= 0.5) {
                    const isKmCritical = kmToNext <= 0;
                    const isTimeCritical = monthsToNext <= 0;

                    alerts.push({
                        id: `${vehicle.id}-${template.id}`,
                        vehicleId: vehicle.id,
                        plate: vehicle.plate,
                        model: vehicle.model,
                        templateName: template.name,
                        templateId: template.id,
                        severity: (isKmCritical || isTimeCritical) ? 'CRITICAL' : 'WARNING',
                        message: isKmCritical
                            ? `${template.name} vencido há ${Math.abs(kmToNext)} km`
                            : isTimeCritical
                                ? `${template.name} vencido há ${Math.abs(Math.floor(monthsToNext))} mês(es)`
                                : kmToNext <= 500
                                    ? `${template.name} próximo: faltam ${kmToNext} km`
                                    : `${template.name} próximo: faltam ${Math.ceil(monthsToNext * 30)} dias`,
                        kmSinceLast,
                        baseKm,
                        nextMaintenanceKm: baseKm + template.intervalKm,
                        nextMaintenanceDate: new Date(new Date(baseDate).setMonth(new Date(baseDate).getMonth() + (template.intervalMonths ?? 12)))
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
