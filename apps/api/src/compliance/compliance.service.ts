/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { NotificationService } from '../common/notifications/notification.service';
import { UploadDocumentDto, UpdateDocumentDto } from './dto';

@Injectable()
export class ComplianceService {
    private readonly logger = new Logger(ComplianceService.name);

    constructor(
        private prisma: PrismaService,
        private storage: StorageService,
        private notifications: NotificationService,
    ) { }

    async uploadDocument(organizationId: string, dto: UploadDocumentDto, file: any) {
        const fileUrl = await this.storage.upload(file);
        const fileType = file.mimetype.split('/').pop();

        return this.prisma.document.create({
            data: {
                organizationId,
                userId: dto.userId,
                vehicleId: dto.vehicleId,
                type: dto.type,
                name: dto.name,
                number: dto.number,
                issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
                expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
                fileUrl,
                fileType,
            }
        });
    }

    async findAll(organizationId: string, filters: any = {}) {
        const { userId, vehicleId, expired } = filters;

        const where: any = { organizationId };
        if (userId) where.userId = userId;
        if (vehicleId) where.vehicleId = vehicleId;

        if (expired === 'true') {
            where.expiryDate = { lt: new Date() };
        } else if (expired === 'false') {
            where.expiryDate = { gte: new Date() };
        }

        return this.prisma.document.findMany({
            where,
            orderBy: { expiryDate: 'asc' },
            include: { user: { select: { name: true } }, vehicle: { select: { plate: true } } }
        });
    }

    async getExpirations(organizationId: string, days: number = 30) {
        const limitDate = new Date();
        limitDate.setDate(limitDate.getDate() + days);

        return this.prisma.document.findMany({
            where: {
                organizationId,
                expiryDate: {
                    gte: new Date(),
                    lte: limitDate
                }
            },
            include: { user: { select: { name: true } }, vehicle: { select: { plate: true } } },
            orderBy: { expiryDate: 'asc' }
        });
    }

    async remove(organizationId: string, id: string) {
        const doc = await this.prisma.document.findFirst({
            where: { id, organizationId }
        });

        if (!doc) throw new NotFoundException('Document not found');

        return this.prisma.document.delete({ where: { id } });
    }

    async update(organizationId: string, id: string, dto: UpdateDocumentDto) {
        const doc = await this.prisma.document.findFirst({
            where: { id, organizationId }
        });

        if (!doc) throw new NotFoundException('Document not found');

        return this.prisma.document.update({
            where: { id },
            data: {
                name: dto.name,
                number: dto.number,
                expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
            }
        });
    }

    @Cron(CronExpression.EVERY_DAY_AT_9AM)
    async handleCron() {
        this.logger.log('Running document expiration check...');
        const today = new Date();
        const alerts = [7, 30]; // Days to alert before expiration

        for (const days of alerts) {
            const targetDate = new Date();
            targetDate.setDate(today.getDate() + days);

            // Set time to start/end of day to match precisely
            const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
            const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

            const expiringDocs = await this.prisma.document.findMany({
                where: {
                    expiryDate: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                },
                include: { organization: true, user: true, vehicle: true }
            });

            for (const doc of expiringDocs) {
                const entityName = doc.user?.name || doc.vehicle?.plate || 'Entidade desconhecida';
                const message = `O documento "${doc.name}" de ${entityName} vence em ${days} dias (${doc.expiryDate?.toLocaleDateString()}).`;

                await this.notifications.notifyAdmins(
                    doc.organizationId,
                    'Alerta de Melhoria: Vencimento de Documento',
                    message,
                    { documentId: doc.id, type: 'COMPLIANCE' }
                );
            }
        }
    }
}
