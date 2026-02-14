import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIncidentDto } from './dto/create-incident.dto';

@Injectable()
export class IncidentsService {
    constructor(private prisma: PrismaService) { }

    async create(driverId: string, dto: CreateIncidentDto) {
        // organizationId is injected by Prisma Extension
        return this.prisma.incident.create({
            data: {
                driverId,
                vehicleId: dto.vehicleId,
                journeyId: dto.journeyId,
                description: dto.description,
                severity: dto.severity || 'MEDIUM',
                status: 'OPEN',
                photoUrl: dto.photoUrl,
            } as any,
        });
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
