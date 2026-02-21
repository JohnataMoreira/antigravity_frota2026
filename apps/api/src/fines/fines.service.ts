import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// FineStatus enum — Prisma client may lag after schema regen in IDE
export enum FineStatus {
    PENDING_IDENTIFICATION = 'PENDING_IDENTIFICATION',
    IDENTIFIED = 'IDENTIFIED',
    PAID = 'PAID',
    APPEAL = 'APPEAL',
    CANCELED = 'CANCELED',
}

@Injectable()
export class FinesService {
    // PrismaService uses $extends() which returns 'any'. Cast to PrismaClient for type safety.
    private get db(): PrismaClient { return this.prisma as unknown as PrismaClient; }

    constructor(private prisma: PrismaService) { }

    async create(organizationId: string, data: any) {
        const fine = await this.db.trafficFine.create({
            data: {
                ...data,
                organizationId,
                status: data.driverId ? FineStatus.IDENTIFIED : FineStatus.PENDING_IDENTIFICATION,
            },
        });

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

        return this.db.trafficFine.findMany({
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
        const fine = await this.db.trafficFine.findFirst({
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
        const fine = await this.db.trafficFine.findUnique({
            where: { id: fineId },
            include: { vehicle: true },
        });

        if (!fine) throw new NotFoundException('Multa não encontrada');

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
            return this.db.trafficFine.update({
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
        return this.db.trafficFine.updateMany({
            where: { id, organizationId },
            data: { status },
        });
    }

    async getFinesSummary(organizationId: string) {
        return this.db.trafficFine.groupBy({
            by: ['status'],
            where: { organizationId },
            _count: true,
            _sum: { amount: true },
        });
    }
}
