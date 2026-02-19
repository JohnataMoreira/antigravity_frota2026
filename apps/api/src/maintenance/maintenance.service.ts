import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { CompleteMaintenanceDto } from './dto/complete-maintenance.dto';
import { CreateMaintenanceTemplateDto } from './dto/create-template.dto';
import { MaintenanceStatus, VehicleStatus } from '@prisma/client';

import { FinanceService } from '../finance/finance.service';

@Injectable()
export class MaintenanceService {
    constructor(
        private prisma: PrismaService,
        private finance: FinanceService
    ) { }

    async create(data: CreateMaintenanceDto & { organizationId: string }) {
        return this.prisma.$transaction(async (tx) => {
            const maintenance = await tx.maintenance.create({
                data: {
                    ...data,
                    status: MaintenanceStatus.PENDING
                }
            });

            await tx.vehicle.update({
                where: { id: maintenance.vehicleId },
                data: { status: VehicleStatus.MAINTENANCE }
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

    async complete(id: string, data: CompleteMaintenanceDto) {
        return this.prisma.$transaction(async (tx) => {
            const maintenance = await tx.maintenance.update({
                where: { id },
                data: {
                    status: MaintenanceStatus.COMPLETED,
                    cost: data.cost,
                    notes: data.notes,
                    performedAt: new Date()
                }
            });

            await tx.vehicle.update({
                where: { id: maintenance.vehicleId },
                data: {
                    status: VehicleStatus.AVAILABLE,
                    lastMaintenanceKm: data.lastKm,
                    lastMaintenanceDate: new Date()
                }
            });

            // Create financial transaction
            if (data.cost && data.cost > 0) {
                await tx.financialTransaction.create({
                    data: {
                        organizationId: maintenance.organizationId,
                        amount: data.cost,
                        description: `Manutenção: ${maintenance.type} - Veículo ${maintenance.vehicleId}`,
                        category: 'MAINTENANCE',
                        type: 'EXPENSE',
                        status: 'PENDING',
                        dueDate: new Date(),
                        maintenanceId: maintenance.id
                    }
                });
            }

            return maintenance;
        });
    }

    // Template Methods
    async createTemplate(data: CreateMaintenanceTemplateDto & { organizationId: string }) {
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

