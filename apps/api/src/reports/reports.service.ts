/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
    constructor(private prisma: PrismaService) { }

    async getOverview() {
        // Logic moved from Controller + Enhanced
        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

        const [
            totalVehicles,
            availableVehicles,
            inUseVehicles,
            maintenanceVehicles,
            criticalVehicles,
            activeJourneys,
            totalDrivers,
            recentJourneys,
            maintenanceCosts,
            journeysWithKm,
            checklistsWithIssues,
            availableByType,
            inUseByType,
            maintenanceByType
        ] = await Promise.all([
            this.prisma.vehicle.count(),
            this.prisma.vehicle.count({ where: { status: 'AVAILABLE' } }),
            this.prisma.vehicle.count({ where: { status: 'IN_USE' } }),
            this.prisma.vehicle.count({ where: { status: 'MAINTENANCE' } }),
            this.prisma.vehicle.count({ where: { status: 'CRITICAL_ISSUE' } }),
            this.prisma.journey.count({ where: { status: 'IN_PROGRESS' } }),
            this.prisma.user.count({ where: { role: 'DRIVER' } }),
            this.prisma.journey.findMany({
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: { driver: { select: { name: true } }, vehicle: { select: { plate: true } } }
            }),
            this.prisma.maintenance.aggregate({
                where: {
                    status: 'COMPLETED',
                    performedAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) }
                },
                _sum: { cost: true }
            }),
            this.prisma.journey.findMany({
                where: { status: 'COMPLETED' },
                select: { startKm: true, endKm: true }
            }),
            this.prisma.checklist.count({
                where: {
                    items: { path: ['$'], array_contains: { status: 'ISSUE' } }
                }
            }),
            this.prisma.vehicle.groupBy({
                by: ['type'],
                where: { status: 'AVAILABLE' },
                _count: { _all: true }
            }),
            this.prisma.vehicle.groupBy({
                by: ['type'],
                where: { status: 'IN_USE' },
                _count: { _all: true }
            }),
            this.prisma.vehicle.groupBy({
                by: ['type'],
                where: { status: 'MAINTENANCE' },
                _count: { _all: true }
            })
        ]);

        const totalKm = journeysWithKm.reduce((acc: number, j: any) => acc + ((j.endKm || 0) - j.startKm), 0);
        const history = await this.getMonthlyHistory(sixMonthsAgo);

        return {
            stats: {
                totalVehicles,
                availableVehicles,
                inUseVehicles,
                maintenanceVehicles,
                criticalVehicles,
                activeJourneys,
                totalDrivers,
                monthlyCosts: maintenanceCosts._sum?.cost || 0,
                totalKm,
                issuesReported: checklistsWithIssues,
                breakdown: {
                    available: availableByType,
                    inUse: inUseByType,
                    maintenance: maintenanceByType
                }
            },
            history,
            recentActivity: recentJourneys
        };
    }

    private async getMonthlyHistory(startDate: Date) {
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const results = [];

        for (let i = 0; i < 6; i++) {
            const d = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
            const nextD = new Date(startDate.getFullYear(), startDate.getMonth() + i + 1, 1);

            const [costAgg, journeyList] = await Promise.all([
                this.prisma.maintenance.aggregate({
                    where: { status: 'COMPLETED', performedAt: { gte: d, lt: nextD } },
                    _sum: { cost: true }
                }),
                this.prisma.journey.findMany({
                    where: { status: 'COMPLETED', endTime: { gte: d, lt: nextD } },
                    select: { startKm: true, endKm: true }
                })
            ]);

            const monthlyKm = journeyList.reduce((acc: number, j: any) => acc + ((j.endKm || 0) - j.startKm), 0);

            results.push({
                name: months[d.getMonth()],
                costs: costAgg._sum?.cost || 0,
                km: monthlyKm
            });
        }
        return results;
    }

    async getDriverPerformance(start?: Date, end?: Date) {
        const dateFilter = start && end ? { createdAt: { gte: start, lte: end } } : {};

        const drivers = await this.prisma.user.findMany({
            where: { role: 'DRIVER' },
            select: { id: true, name: true, email: true }
        });

        const performanceData = [];

        for (const driver of drivers) {
            const journeys = await this.prisma.journey.findMany({
                where: {
                    driverId: driver.id,
                    status: 'COMPLETED',
                    ...dateFilter
                },
                select: { startKm: true, endKm: true }
            });

            const totalKm = journeys.reduce((acc, j) => acc + ((j.endKm || 0) - j.startKm), 0);

            // Assume 1 issue per checklist implies safety score reduction (mock logic)
            // Real logic requires joining checklists -> journeys -> driver
            // For MVP: Count total journeys

            performanceData.push({
                driverName: driver.name,
                totalJourneys: journeys.length,
                totalKm,
                avgKmPerJourney: journeys.length > 0 ? Math.round(totalKm / journeys.length) : 0
            });
        }

        return performanceData.sort((a, b) => b.totalKm - a.totalKm);
    }

    async getVehicleUtilization(start?: Date, end?: Date) {
        // Logic to calculate vehicle usage & cost per km
        const vehicles = await this.prisma.vehicle.findMany();
        const report = [];

        for (const v of vehicles) {
            const journeys = await this.prisma.journey.findMany({
                where: {
                    vehicleId: v.id,
                    status: 'COMPLETED',
                    ...(start && end ? { endTime: { gte: start, lte: end } } : {})
                },
                select: { startKm: true, endKm: true }
            });

            const totalKm = journeys.reduce((acc, j) => acc + ((j.endKm || 0) - j.startKm), 0);

            const maintenances = await this.prisma.maintenance.aggregate({
                where: {
                    vehicleId: v.id,
                    status: 'COMPLETED',
                    ...(start && end ? { performedAt: { gte: start, lte: end } } : {})
                },
                _sum: { cost: true }
            });

            const totalCost = maintenances._sum.cost || 0;

            report.push({
                plate: v.plate,
                model: v.model,
                totalKm,
                trips: journeys.length,
                maintenanceCost: totalCost,
                costPerKm: totalKm > 0 ? (totalCost / totalKm).toFixed(2) : 0
            });
        }

        return report.sort((a, b) => b.totalKm - a.totalKm);
    }
}
