import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FineStatus } from '@prisma/client';

@Injectable()
export class FinesService {
    constructor(private prisma: PrismaService) { }

    async create(organizationId: string, data: any) {
        // 1. Create the Fine record
        const fine = await this.prisma.trafficFine.create({
            data: {
                ...data,
                organizationId,
                status: data.driverId ? FineStatus.IDENTIFIED : FineStatus.PENDING_IDENTIFICATION,
            },
        });

        // 2. If no driverId was provided, try to auto-identify
        if (!data.driverId) {
            return this.autoIdentifyDriver(fine.id);
        }

        return fine;
    }

    async findAll(organizationId: string, filters: any = {}) {
        const { status, vehicleId, driverId, start, end } = filters;

        const where: any = { organizationId };

        if (status) where.status = status;
        if (vehicleId) where.vehicleId = vehicleId;
        if (driverId) where.driverId = driverId;

        if (start && end) {
            where.occurredAt = {
                gte: new Date(start),
                lte: new Date(end),
            };
        }

        return this.prisma.trafficFine.findMany({
            where,
            include: {
                vehicle: { select: { plate: true, model: true } },
                driver: { select: { name: true } },
                journey: { select: { id: true, startTime: true, endTime: true } },
            },
            orderBy: { occurredAt: 'desc' },
        });
    }

    async findOne(id: string, organizationId: string) {
        const fine = await this.prisma.trafficFine.findFirst({
            where: { id, organizationId },
            include: {
                vehicle: true,
                driver: true,
                journey: true,
                attachments: true,
            },
        });

        if (!fine) throw new NotFoundException('Multa não encontrada');
        return fine;
    }

    async autoIdentifyDriver(fineId: string) {
        const fine = await this.prisma.trafficFine.findUnique({
            where: { id: fineId },
            include: { vehicle: true },
        });

        if (!fine) throw new NotFoundException('Multa não encontrada');

        // Find a journey that was active during the fine timestamp
        const journey = await this.prisma.journey.findFirst({
            where: {
                organizationId: fine.organizationId,
                vehicleId: fine.vehicleId,
                startTime: { lte: fine.occurredAt },
                OR: [
                    { endTime: { gte: fine.occurredAt } },
                    { endTime: null, status: 'IN_PROGRESS' },
                ],
            },
        });

        if (journey) {
            return this.prisma.trafficFine.update({
                where: { id: fineId },
                data: {
                    driverId: journey.driverId,
                    journeyId: journey.id,
                    status: FineStatus.IDENTIFIED,
                },
                include: { driver: { select: { name: true } } },
            });
        }

        return fine;
    }

    async updateStatus(id: string, organizationId: string, status: FineStatus) {
        return this.prisma.trafficFine.updateMany({
            where: { id, organizationId },
            data: { status },
        });
    }

    async getFinesSummary(organizationId: string) {
        const fines = await this.prisma.trafficFine.groupBy({
            by: ['status'],
            where: { organizationId },
            _count: true,
            _sum: { amount: true },
        });

        return fines;
    }
}
