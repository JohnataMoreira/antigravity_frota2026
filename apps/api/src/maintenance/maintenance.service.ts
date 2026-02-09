import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MaintenanceService {
    constructor(private prisma: PrismaService) { }

    async create(data: any) {
        return this.prisma.$transaction(async (tx) => {
            const maintenance = await tx.maintenance.create({ data });

            // Mark vehicle as in maintenance
            await tx.vehicle.update({
                where: { id: data.vehicleId },
                data: { status: 'MAINTENANCE' }
            });

            return maintenance;
        });
    }

    async findAll(organizationId: string) {
        return this.prisma.maintenance.findMany({
            where: { organizationId },
            include: { vehicle: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findByVehicle(vehicleId: string) {
        return this.prisma.maintenance.findMany({
            where: { vehicleId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async complete(id: string, organizationId: string, data: { cost: number; notes?: string; lastKm: number }) {
        return this.prisma.$transaction(async (tx) => {
            // 1. Update maintenance record
            const maintenance = await tx.maintenance.update({
                where: { id, organizationId },
                data: {
                    status: 'COMPLETED',
                    performedAt: new Date(),
                    cost: data.cost,
                    notes: data.notes,
                    lastKm: data.lastKm,
                },
            });

            // 2. Update vehicle status and Km
            await tx.vehicle.update({
                where: { id: maintenance.vehicleId },
                data: {
                    status: 'AVAILABLE',
                    currentKm: data.lastKm,
                },
            });

            return maintenance;
        });
    }

    async checkMaintenanceDue(vehicleId: string, currentKm: number) {
        return this.prisma.maintenance.findMany({
            where: {
                vehicleId,
                status: 'PENDING',
                nextDueKm: { lte: currentKm },
            },
        });
    }
}
