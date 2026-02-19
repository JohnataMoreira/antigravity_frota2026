import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
    constructor(private prisma: PrismaService) { }

    async getProfitabilityOverview(organizationId: string, filters: any = {}) {
        const { start, end } = filters;
        const dateFilter = start && end ? {
            endTime: { gte: new Date(start), lte: new Date(end) }
        } : {};

        // 1. Fetch all completed journeys with their costs
        const journeys = await this.prisma.journey.findMany({
            where: {
                organizationId,
                status: 'COMPLETED',
                ...dateFilter
            },
            include: {
                vehicle: { select: { plate: true, model: true } },
                driver: { select: { name: true } },
                fuelEntries: { select: { totalValue: true } },
                incidents: { select: { id: true } }
            }
        });

        // 2. Fetch maintenance costs in the same period
        const maintenances = await this.prisma.maintenance.aggregate({
            where: {
                organizationId,
                status: 'COMPLETED',
                performedAt: start && end ? { gte: new Date(start), lte: new Date(end) } : undefined
            },
            _sum: { cost: true }
        });

        const totalRevenue = journeys.reduce((acc, j: any) => acc + (j.revenue || 0), 0);
        const totalFuelCost = journeys.reduce((acc, j) =>
            acc + j.fuelEntries.reduce((fAcc, f) => fAcc + f.totalValue, 0), 0
        );
        const totalMaintenanceCost = maintenances._sum.cost || 0;

        const totalDistance = journeys.reduce((acc, j) => acc + ((j.endKm || 0) - j.startKm), 0);
        const totalProfit = totalRevenue - (totalFuelCost + totalMaintenanceCost);
        const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

        return {
            summary: {
                totalRevenue,
                totalExpenses: totalFuelCost + totalMaintenanceCost,
                totalProfit,
                profitMargin: profitMargin.toFixed(2),
                totalKm: totalDistance,
                costPerKm: totalDistance > 0 ? ((totalFuelCost + totalMaintenanceCost) / totalDistance).toFixed(2) : 0,
                revenuePerKm: totalDistance > 0 ? (totalRevenue / totalDistance).toFixed(2) : 0
            },
            breakdown: {
                fuel: totalFuelCost,
                maintenance: totalMaintenanceCost
            },
            history: await this.getProfitHistory(organizationId)
        };
    }

    private async getProfitHistory(organizationId: string) {
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const now = new Date();

        return Promise.all(
            Array.from({ length: 6 }).map(async (_, i) => {
                const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
                const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - (4 - i), 1);

                const data = await this.prisma.journey.aggregate({
                    where: {
                        organizationId,
                        status: 'COMPLETED',
                        endTime: { gte: monthDate, lt: nextMonthDate }
                    },
                    _sum: { revenue: true as any }
                });

                return {
                    name: months[monthDate.getMonth()],
                    revenue: (data._sum as any).revenue || 0
                };
            })
        );
    }

    async getVehicleRankings(organizationId: string) {
        const vehicles = await this.prisma.vehicle.findMany({
            where: { organizationId },
            include: {
                _count: { select: { journeys: { where: { status: 'COMPLETED' } } } },
                journeys: {
                    where: { status: 'COMPLETED' },
                    select: { revenue: true as any, startKm: true, endKm: true }
                }
            }
        });

        const ranking = vehicles.map(v => {
            const revenue = v.journeys.reduce((acc, j: any) => acc + (j.revenue || 0), 0);
            const km = v.journeys.reduce((acc, j) => acc + ((j.endKm || 0) - j.startKm), 0);

            return {
                id: v.id,
                plate: v.plate,
                model: v.model,
                revenue,
                km,
                trips: v._count.journeys,
                efficiency: km > 0 ? (revenue / km).toFixed(2) : 0
            };
        });

        return ranking.sort((a, b) => (b.revenue as number) - (a.revenue as number));
    }
}
