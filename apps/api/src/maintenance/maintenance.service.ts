import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MaintenanceService {
    constructor(private prisma: PrismaService) { }

    async create(data: any) {
        return this.prisma.maintenance.create({ data });
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

    async checkMaintenanceDue(vehicleId: string, currentKm: number) {
        // Basic logic: Find pending maintenance where due date/km passed
        const dues = await this.prisma.maintenance.findMany({
            where: {
                vehicleId,
                status: 'PENDING',
                nextDueKm: { lte: currentKm },
            },
        });
        return dues;
    }
}
