import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { addDays, isPast, differenceInHours } from 'date-fns';

@Injectable()
export class AlertsProcessorService {
    private readonly logger = new Logger(AlertsProcessorService.name);

    constructor(
        private prisma: PrismaService,
        private notificationService: NotificationsService,
    ) { }

    @Cron(CronExpression.EVERY_6_HOURS)
    async handleCron() {
        this.logger.log('Iniciando processamento de alertas inteligentes...');
        await this.processExpirations();
        await this.processLongJourneys();
        await this.processMissingChecklists();
        this.logger.log('Processamento de alertas concluído.');
    }

    private async processExpirations() {
        const thirtyDaysFromNow = addDays(new Date(), 30);

        const expiringDocs = await this.prisma.document.findMany({
            where: {
                expiryDate: {
                    lte: thirtyDaysFromNow,
                },
                // Somente documentos ativos? (Depende da implementação de 'active' em Document)
            },
            include: {
                organization: true,
                vehicle: true,
                user: true,
            }
        });

        for (const doc of expiringDocs) {
            const title = `Vencimento de Documento: ${doc.type}`;
            const message = doc.vehicle
                ? `O documento ${doc.name} do veículo ${doc.vehicle.plate} vence em ${doc.expiryDate?.toLocaleDateString()}`
                : `O documento ${doc.name} do motorista ${doc.user?.name} vence em ${doc.expiryDate?.toLocaleDateString()}`;

            await this.createAlertIfNotExist(doc.organizationId, title, message, 'HIGH');
        }
    }

    private async processLongJourneys() {
        const inProgressJourneys = await this.prisma.journey.findMany({
            where: {
                status: 'IN_PROGRESS',
            },
            include: {
                driver: true,
                vehicle: true,
            }
        });

        for (const journey of inProgressJourneys) {
            const hoursActive = differenceInHours(new Date(), journey.startTime);
            if (hoursActive >= 12) {
                const title = `Jornada Longa Detectada`;
                const message = `O motorista ${journey.driver.name} está em jornada ativa há ${hoursActive} horas no veículo ${journey.vehicle.plate}.`;

                await this.createAlertIfNotExist(journey.organizationId, title, message, 'MEDIUM');
            }
        }
    }

    private async processMissingChecklists() {
        // Regra: Veículos ativos que não fizeram checklist nos últimos 7 dias
        const sevenDaysAgo = addDays(new Date(), -7);

        const vehicles = await this.prisma.vehicle.findMany({
            where: {
                status: 'AVAILABLE',
                active: true
            }
        });

        for (const vehicle of vehicles) {
            const lastChecklist = await this.prisma.checklist.findFirst({
                where: {
                    journey: {
                        vehicleId: vehicle.id
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            if (!lastChecklist || isPast(addDays(lastChecklist.createdAt, 7))) {
                const title = `Checklist Pendente`;
                const message = `O veículo ${vehicle.plate} não realiza um checklist há mais de 7 dias.`;

                await this.createAlertIfNotExist(vehicle.organizationId, title, message, 'LOW');
            }
        }
    }

    private async createAlertIfNotExist(organizationId: string, title: string, message: string, severity: string) {
        // Evitar duplicidade de alertas não resolvidos com o mesmo título/veículo no mesmo dia
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const existingAlert = await this.prisma.alert.findFirst({
            where: {
                organizationId,
                title,
                resolved: false,
                createdAt: {
                    gte: today
                }
            }
        });

        if (!existingAlert) {
            await this.prisma.alert.create({
                data: {
                    organizationId,
                    title,
                    message,
                    severity,
                }
            });

            // Notificar via WebSocket/Push se possível
            // await this.notificationService.notifyAdmins(organizationId, title, message);
        }
    }
}
