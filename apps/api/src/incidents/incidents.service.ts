import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { NotificationService } from '../common/notifications/notification.service';

@Injectable()
export class IncidentsService {
    constructor(
        private prisma: PrismaService,
        private notificationService: NotificationService
    ) { }

    async create(driverId: string, dto: CreateIncidentDto) {
        const driver = await this.prisma.user.findUnique({
            where: { id: driverId },
            select: { organizationId: true }
        });

        if (!driver) throw new NotFoundException('Driver not found');

        const incident = await this.prisma.incident.create({
            data: {
                driverId,
                vehicleId: dto.vehicleId,
                journeyId: dto.journeyId,
                description: dto.description,
                severity: dto.severity || 'MEDIUM',
                status: 'OPEN',
                photoUrl: dto.photoUrl,
                organizationId: driver.organizationId
            },
            include: {
                vehicle: { select: { plate: true } },
                driver: { select: { name: true, organizationId: true } }
            }
        });

        // Notify Admins
        await this.notificationService.notifyAdmins(
            driver.organizationId,
            `⚠️ Novo Incidente: ${incident.vehicle.plate}`,
            `${incident.driver.name} relatou um incidente (${incident.severity}).`,
            { incidentId: incident.id }
        );

        return incident;
    }

    async findAll(status?: string) {
        return this.prisma.incident.findMany({
            where: status ? { status } : {},
            include: {
                driver: { select: { name: true } },
                vehicle: { select: { plate: true, model: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async resolve(id: string) {
        return this.prisma.incident.update({
            where: { id },
            data: { status: 'RESOLVED' },
        });
    }
}
