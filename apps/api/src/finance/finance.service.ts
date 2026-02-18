import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FinanceService {
    constructor(private prisma: PrismaService) { }

    async getOverview(organizationId: string, filters: any = {}) {
        const { start, end, vehicleId } = filters;

        const fuelDateFilter = start && end ? {
            date: { gte: new Date(start), lte: new Date(end) }
        } : {};

        const maintenanceDateFilter = start && end ? {
            performedAt: { gte: new Date(start), lte: new Date(end) }
        } : {};

        const fuelExpenses = await this.prisma.fuelEntry.findMany({
            where: {
                organizationId,
                ...fuelDateFilter,
                ...(vehicleId && { vehicleId })
            },
            select: { date: true, totalValue: true, fuelType: true, paymentMethod: true },
            orderBy: { date: 'desc' },
        });

        const maintenanceExpenses = await this.prisma.maintenance.findMany({
            where: {
                organizationId,
                status: 'COMPLETED',
                ...maintenanceDateFilter,
                ...(vehicleId && { vehicleId })
            },
            select: { performedAt: true, cost: true, type: true },
            orderBy: { performedAt: 'desc' },
        });

        // Aggregate by month for trends
        const trendsMap = new Map<string, { month: string; fuel: number; maintenance: number; total: number }>();

        fuelExpenses.forEach((e: any) => {
            const month = new Date(e.date).toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
            const current = trendsMap.get(month) || { month, fuel: 0, maintenance: 0, total: 0 };
            current.fuel += e.totalValue;
            current.total += e.totalValue;
            trendsMap.set(month, current);
        });

        maintenanceExpenses.forEach((m) => {
            if (!m.performedAt || !m.cost) return;
            const month = new Date(m.performedAt).toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
            const current = trendsMap.get(month) || { month, fuel: 0, maintenance: 0, total: 0 };
            current.maintenance += m.cost;
            current.total += m.cost;
            trendsMap.set(month, current);
        });

        const totalFuel = fuelExpenses.reduce((acc: number, e: any) => acc + e.totalValue, 0);
        const totalMaintenance = maintenanceExpenses.reduce((acc, m) => acc + (m.cost || 0), 0);

        return {
            summary: {
                totalFuel,
                totalMaintenance,
                grandTotal: totalFuel + totalMaintenance,
            },
            trends: Array.from(trendsMap.values()).slice(-12), // Last 12 months
            recentExpenses: [
                ...fuelExpenses.slice(0, 5).map((e: any) => ({ type: 'Combustível', date: e.date, value: e.totalValue, details: e.paymentMethod })),
                ...maintenanceExpenses.slice(0, 5).map((m: any) => ({ type: 'Manutenção', date: m.performedAt, value: m.cost, details: m.type }))
            ].sort((a: any, b: any) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()).slice(0, 10)
        };
    }
}
