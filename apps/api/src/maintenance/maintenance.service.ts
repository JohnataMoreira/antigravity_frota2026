/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MaintenanceService {
    constructor(private prisma: PrismaService) { }

    async create(data: any) {
        return this.prisma.$transaction(async (tx) => {
            const maintenance = await tx.maintenance.create({
                data: data as any // organizationId is injected by Prisma Extension
            });

            await tx.vehicle.update({
                where: { id: maintenance.vehicleId },
                data: { status: 'MAINTENANCE' }
            });

            return maintenance;
        });
    }

    async findAll() {
        return this.prisma.maintenance.findMany({
            orderBy: { createdAt: 'desc' },
            include: { vehicle: { select: { plate: true, model: true } } }
        });
    }

    async findByVehicle(vehicleId: string) {
        return this.prisma.maintenance.findMany({
            where: { vehicleId },
            orderBy: { createdAt: 'desc' }
        });
    }

    async complete(id: string, data: { cost: number; notes?: string; lastKm: number }) {
        return this.prisma.$transaction(async (tx) => {
            const maintenance = await tx.maintenance.update({
                where: { id },
                data: {
                    status: 'COMPLETED',
                    cost: data.cost,
                    notes: data.notes,
                    performedAt: new Date()
                }
            });

            await tx.vehicle.update({
                where: { id: maintenance.vehicleId },
                data: {
                    status: 'AVAILABLE',
                    lastMaintenanceKm: data.lastKm,
                    lastMaintenanceDate: new Date()
                }
            });

            return maintenance;
        });
    }

    // Template Methods
    async createTemplate(data: any) {
        return this.prisma.maintenanceTemplate.create({
            data: data
        });
    }

    async findAllTemplates() {
        return this.prisma.maintenanceTemplate.findMany({
            orderBy: { name: 'asc' }
        });
    }

    async deleteTemplate(id: string) {
        return this.prisma.maintenanceTemplate.delete({
            where: { id }
        });
    }
}

// Minimal DTOs for local types if needed
export interface CreateMaintenanceDto {
    vehicleId: string;
    description: string;
    scheduledDate: Date;
    cost?: number;
}
