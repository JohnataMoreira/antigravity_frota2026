import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsExportService {
    constructor(private prisma: PrismaService) { }

    async getJourneysExportData(organizationId: string, filters: any) {
        const { start, end, driverId, vehicleId } = filters;

        const dateFilter = start && end ? {
            endTime: {
                gte: new Date(start),
                lte: new Date(end),
            },
        } : {};

        const journeys = await this.prisma.journey.findMany({
            where: {
                organizationId,
                status: 'COMPLETED',
                ...dateFilter,
                ...(driverId && { driverId }),
                ...(vehicleId && { vehicleId }),
            },
            include: {
                driver: { select: { name: true, email: true } },
                vehicle: { select: { plate: true, model: true } },
                incidents: true,
                checklists: true,
            },
            orderBy: { endTime: 'desc' },
        });

        return journeys.map(j => ({
            id: j.id,
            driver: j.driver.name,
            vehicle: `${j.vehicle.model} (${j.vehicle.plate})`,
            startTime: j.startTime,
            endTime: j.endTime,
            distance: (j.endKm || 0) - j.startKm,
            incidents: j.incidents.length,
            checklistRating: j.checklists[0]?.rating || 'N/A',
        }));
    }

    async getExpensesExportData(organizationId: string, filters: any) {
        const { start, end, vehicleId } = filters;

        const dateFilter = start && end ? {
            date: {
                gte: new Date(start),
                lte: new Date(end),
            },
        } : {};

        const performedAtFilter = start && end ? {
            performedAt: {
                gte: new Date(start),
                lte: new Date(end),
            },
        } : {};

        const [fuelEntries, maintenances] = await Promise.all([
            this.prisma.fuelEntry.findMany({
                where: {
                    organizationId,
                    ...dateFilter,
                    ...(vehicleId && { vehicleId }),
                },
                include: {
                    vehicle: { select: { plate: true, model: true } },
                    driver: { select: { name: true } },
                },
                orderBy: { date: 'desc' },
            }),
            this.prisma.maintenance.findMany({
                where: {
                    organizationId,
                    status: 'COMPLETED',
                    ...performedAtFilter,
                    ...(vehicleId && { vehicleId }),
                },
                include: {
                    vehicle: { select: { plate: true, model: true } },
                },
                orderBy: { performedAt: 'desc' },
            }),
        ]);

        const combined = [
            ...fuelEntries.map(f => ({
                date: f.date,
                category: 'ABASTECIMENTO',
                description: `${f.liters}L de ${f.fuelType}`,
                vehicle: `${f.vehicle.model} (${f.vehicle.plate})`,
                cost: f.totalValue,
                driver: f.driver.name,
            })),
            ...maintenances.map(m => ({
                date: m.performedAt,
                category: 'MANUTENÇÃO',
                description: m.notes || m.type,
                vehicle: `${m.vehicle.model} (${m.vehicle.plate})`,
                cost: m.cost || 0,
                driver: 'Geral',
            })),
        ];

        return combined.sort((a, b) => {
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;
            return dateB - dateA;
        });
    }
}
