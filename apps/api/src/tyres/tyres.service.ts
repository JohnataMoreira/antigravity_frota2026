import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TyreStatus } from '@prisma/client';

@Injectable()
export class TyresService {
    constructor(private prisma: PrismaService) { }

    async createTyre(organizationId: string, data: any) {
        return this.prisma.tyre.create({
            data: {
                organizationId,
                identifier: data.identifier,
                brand: data.brand,
                model: data.model,
                size: data.size,
                status: 'STOCK',
                initialCost: data.initialCost || 0
            }
        });
    }

    async getTyres(organizationId: string, filters: any = {}) {
        return this.prisma.tyre.findMany({
            where: {
                organizationId,
                ...(filters.status && { status: filters.status as TyreStatus }),
                ...(filters.vehicleId && { vehicleId: filters.vehicleId }),
                ...(filters.search && {
                    OR: [
                        { identifier: { contains: filters.search, mode: 'insensitive' } },
                        { brand: { contains: filters.search, mode: 'insensitive' } },
                    ]
                })
            },
            include: { vehicle: { select: { plate: true, model: true } } },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getTyreDashboardStats(organizationId: string) {
        const [total, stock, inUse, scrap] = await Promise.all([
            this.prisma.tyre.count({ where: { organizationId } }),
            this.prisma.tyre.count({ where: { organizationId, status: 'STOCK' } }),
            this.prisma.tyre.count({ where: { organizationId, status: 'IN_USE' } }),
            this.prisma.tyre.count({ where: { organizationId, status: 'SCRAP' } }),
        ]);

        return { total, stock, inUse, scrap };
    }

    async allocateTyre(organizationId: string, tyreId: string, vehicleId: string, installKm: number) {
        const tyre = await this.prisma.tyre.findUnique({ where: { id: tyreId } });

        if (!tyre || tyre.organizationId !== organizationId) {
            throw new NotFoundException('Pneu não encontrado.');
        }
        if (tyre.status !== 'STOCK') {
            throw new BadRequestException('Apenas pneus em STOCK podem ser alocados.');
        }

        return this.prisma.$transaction(async (tx) => {
            const updatedTyre = await tx.tyre.update({
                where: { id: tyreId },
                data: {
                    status: 'IN_USE',
                    vehicleId
                }
            });

            await tx.tyreMovement.create({
                data: {
                    organizationId,
                    tyreId,
                    vehicleId,
                    type: 'INSTALL',
                    km: installKm,
                    tyreKm: tyre.currentKm
                }
            });

            return updatedTyre;
        });
    }

    async discardTyre(organizationId: string, tyreId: string, currentVehicleKm: number, reason: string) {
        const tyre = await this.prisma.tyre.findUnique({ where: { id: tyreId } });

        if (!tyre || tyre.organizationId !== organizationId) {
            throw new NotFoundException('Pneu não encontrado.');
        }

        return this.prisma.$transaction(async (tx) => {
            // Se estava em uso, soma o KM rodado desde a instalação base
            const lastInstall = await tx.tyreMovement.findFirst({
                where: { tyreId, type: 'INSTALL' },
                orderBy: { createdAt: 'desc' }
            });

            let newTyreKm = tyre.currentKm;
            if (tyre.status === 'IN_USE' && lastInstall && tyre.vehicleId) {
                const distanceDriven = currentVehicleKm - lastInstall.km;
                newTyreKm += (distanceDriven > 0 ? distanceDriven : 0);
            }

            const updatedTyre = await tx.tyre.update({
                where: { id: tyreId },
                data: {
                    status: 'SCRAP',
                    vehicleId: null,
                    currentKm: newTyreKm
                }
            });

            await tx.tyreMovement.create({
                data: {
                    organizationId,
                    tyreId,
                    vehicleId: tyre.vehicleId, // Mantém histórico de ONDE foi tirado
                    type: 'SCRAP',
                    km: currentVehicleKm,
                    tyreKm: newTyreKm,
                    notes: reason
                }
            });

            return updatedTyre;
        });
    }
}
