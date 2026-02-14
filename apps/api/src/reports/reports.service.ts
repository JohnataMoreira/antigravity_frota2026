/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
    constructor(private prisma: PrismaService) { }

    async getOverview(organizationId: string) {
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
            maintenanceByType,
            recentIncidents,
            journeysWithIncidentsCount
        ] = await Promise.all([
            this.prisma.vehicle.count({ where: { organizationId } }),
            this.prisma.vehicle.count({ where: { organizationId, status: 'AVAILABLE' } }),
            this.prisma.vehicle.count({ where: { organizationId, status: 'IN_USE' } }),
            this.prisma.vehicle.count({ where: { organizationId, status: 'MAINTENANCE' } }),
            this.prisma.vehicle.count({ where: { organizationId, status: 'CRITICAL_ISSUE' } }),
            this.prisma.journey.count({ where: { organizationId, status: 'IN_PROGRESS' } }),
            this.prisma.user.count({ where: { organizationId, role: 'DRIVER' } }),
            this.prisma.journey.findMany({
                where: { organizationId },
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: { driver: { select: { name: true } }, vehicle: { select: { plate: true } } }
            }),
            this.prisma.maintenance.aggregate({
                where: {
                    organizationId,
                    status: 'COMPLETED',
                    performedAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) }
                },
                _sum: { cost: true }
            }),
            this.prisma.journey.findMany({
                where: { organizationId, status: 'COMPLETED' },
                select: { startKm: true, endKm: true }
            }),
            this.prisma.checklist.count({
                where: {
                    journey: { organizationId },
                    items: { path: ['$'], array_contains: { status: 'ISSUE' } }
                }
            }),
            this.prisma.vehicle.groupBy({
                by: ['type'],
                where: { organizationId, status: 'AVAILABLE' },
                _count: { _all: true }
            }),
            this.prisma.vehicle.groupBy({
                by: ['type'],
                where: { organizationId, status: 'IN_USE' },
                _count: { _all: true }
            }),
            this.prisma.vehicle.groupBy({
                by: ['type'],
                where: { organizationId, status: 'MAINTENANCE' },
                _count: { _all: true }
            }),
            this.prisma.incident.findMany({
                where: { organizationId, status: 'OPEN' },
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: {
                    driver: { select: { name: true } },
                    vehicle: { select: { plate: true, model: true } }
                }
            }),
            this.prisma.journey.count({
                where: {
                    organizationId,
                    status: 'IN_PROGRESS',
                    incidents: { some: { status: 'OPEN' } }
                }
            })
        ]);

        const totalKm = journeysWithKm.reduce((acc: number, j: any) => acc + ((j.endKm || 0) - j.startKm), 0);
        const history = await this.getMonthlyHistory(organizationId, sixMonthsAgo);

        return {
            stats: {
                totalVehicles,
                availableVehicles,
                inUseVehicles,
                maintenanceVehicles,
                criticalVehicles,
                activeJourneys,
                journeysWithIncidents: journeysWithIncidentsCount,
                journeysWithoutIncidents: activeJourneys - journeysWithIncidentsCount,
                totalDrivers,
                monthlyCosts: maintenanceCosts._sum?.cost || 0,
                totalKm,
                issuesReported: checklistsWithIssues,
                breakdown: {
                    available: availableByType,
                    inUse: inUseByType,
                    maintenance: maintenanceByType
                },
                recentIncidents
            },
            history,
            recentActivity: recentJourneys
        };
    }

    private async getMonthlyHistory(organizationId: string, startDate: Date) {
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const results = [];

        for (let i = 0; i < 6; i++) {
            const d = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
            const nextD = new Date(startDate.getFullYear(), startDate.getMonth() + i + 1, 1);

            const [costAgg, journeyList] = await Promise.all([
                this.prisma.maintenance.aggregate({
                    where: { organizationId, status: 'COMPLETED', performedAt: { gte: d, lt: nextD } },
                    _sum: { cost: true }
                }),
                this.prisma.journey.findMany({
                    where: { organizationId, status: 'COMPLETED', endTime: { gte: d, lt: nextD } },
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

    async getDriverPerformance(organizationId: string, start?: Date, end?: Date) {
        const dateFilter = start && end ? { createdAt: { gte: start, lte: end } } : {};

        const drivers = await this.prisma.user.findMany({
            where: { organizationId, role: 'DRIVER' },
            select: { id: true, name: true, email: true }
        });

        const performanceData = [];

        for (const driver of drivers) {
            const journeys = await this.prisma.journey.findMany({
                where: {
                    organizationId,
                    driverId: driver.id,
                    status: 'COMPLETED',
                    ...dateFilter
                },
                select: { startKm: true, endKm: true }
            });

            const totalKm = journeys.reduce((acc, j) => acc + ((j.endKm || 0) - j.startKm), 0);

            performanceData.push({
                driverName: driver.name,
                totalJourneys: journeys.length,
                totalKm,
                avgKmPerJourney: journeys.length > 0 ? Math.round(totalKm / journeys.length) : 0
            });
        }

        return performanceData.sort((a, b) => b.totalKm - a.totalKm);
    }

    async getVehicleUtilization(organizationId: string, start?: Date, end?: Date) {
        // Logic to calculate vehicle usage & cost per km
        const vehicles = await this.prisma.vehicle.findMany({
            where: { organizationId }
        });
        const report = [];

        for (const v of vehicles) {
            const journeys = await this.prisma.journey.findMany({
                where: {
                    organizationId,
                    vehicleId: v.id,
                    status: 'COMPLETED',
                    ...(start && end ? { endTime: { gte: start, lte: end } } : {})
                },
                select: { startKm: true, endKm: true }
            });

            const totalKm = journeys.reduce((acc, j) => acc + ((j.endKm || 0) - j.startKm), 0);

            const maintenances = await this.prisma.maintenance.aggregate({
                where: {
                    organizationId,
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

    async getDriverRanking(organizationId: string, start?: Date, end?: Date) {
        const drivers = await this.prisma.user.findMany({
            where: { organizationId, role: 'DRIVER' },
            select: { id: true, name: true, photoUrl: true }
        });

        const ranking = [];

        for (const driver of drivers) {
            // 1. Calculate Fuel Efficiency
            const fuelEntries = await this.prisma.fuelEntry.findMany({
                where: {
                    organizationId,
                    driverId: driver.id,
                    ...(start && end ? { date: { gte: start, lte: end } } : {})
                }
            });

            const totalFuelLiters = fuelEntries.reduce((acc, f) => acc + f.liters, 0);

            // Get Journeys for Km calculation (only completed ones)
            const journeys = await this.prisma.journey.findMany({
                where: {
                    organizationId,
                    driverId: driver.id,
                    status: 'COMPLETED',
                    ...(start && end ? { endTime: { gte: start, lte: end } } : {})
                },
                select: { startKm: true, endKm: true }
            });

            const totalKm = journeys.reduce((acc, j) => acc + ((j.endKm || 0) - j.startKm), 0);
            const kmPerLiter = totalFuelLiters > 0 ? totalKm / totalFuelLiters : 0;

            // 2. Safety Score
            const incidents = await this.prisma.incident.findMany({
                where: {
                    organizationId,
                    driverId: driver.id,
                    ...(start && end ? { createdAt: { gte: start, lte: end } } : {})
                }
            });

            let safetyScore = 100;
            incidents.forEach(inc => {
                if (inc.severity === 'HIGH') safetyScore -= 20;
                else if (inc.severity === 'MEDIUM') safetyScore -= 10;
                else safetyScore -= 5;
            });
            if (safetyScore < 0) safetyScore = 0;

            // 3. Overall Efficiency Score (Weighted: 40% Fuel, 60% Safety)
            // Normalizing Km/L: Target 10km/l = 100 points
            const efficiencyScore = Math.min((kmPerLiter / 10) * 100, 100);

            const overallScore = Math.round((efficiencyScore * 0.4) + (safetyScore * 0.6));

            ranking.push({
                driverId: driver.id,
                name: driver.name,
                photoUrl: driver.photoUrl,
                totalKm,
                kmPerLiter: Number(kmPerLiter.toFixed(2)),
                incidentCount: incidents.length,
                safetyScore,
                efficiencyScore: Math.round(efficiencyScore),
                overallScore
            });
        }

        return ranking.sort((a, b) => b.overallScore - a.overallScore);
    }
}
