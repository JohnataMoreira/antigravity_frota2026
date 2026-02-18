/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
    constructor(private prisma: PrismaService) { }

    async getOverview(organizationId: string, filters: any = {}) {
        const { start, end, driverId, vehicleId } = filters;

        const dateFilter = start && end ? {
            createdAt: { gte: new Date(start), lte: new Date(end) }
        } : {};

        const performedAtFilter = start && end ? {
            performedAt: { gte: new Date(start), lte: new Date(end) }
        } : {
            performedAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
        };

        const fuelDateFilter = start && end ? {
            date: { gte: new Date(start), lte: new Date(end) }
        } : {
            date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
        };

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
            fuelCosts,
            journeysWithKm,
            checklistsWithIssues,
            availableByType,
            inUseByType,
            maintenanceByType,
            recentIncidents,
            journeysWithIncidentsCount,
            totalVehicleKm,
            avgFuelLevel
        ] = await Promise.all([
            this.prisma.vehicle.count({ where: { organizationId, ...(vehicleId && { id: vehicleId }) } }),
            this.prisma.vehicle.count({ where: { organizationId, status: 'AVAILABLE', ...(vehicleId && { id: vehicleId }) } }),
            this.prisma.vehicle.count({ where: { organizationId, status: 'IN_USE', ...(vehicleId && { id: vehicleId }) } }),
            this.prisma.vehicle.count({ where: { organizationId, status: 'MAINTENANCE', ...(vehicleId && { id: vehicleId }) } }),
            this.prisma.vehicle.count({ where: { organizationId, status: 'CRITICAL_ISSUE', ...(vehicleId && { id: vehicleId }) } }),
            this.prisma.journey.count({ where: { organizationId, status: 'IN_PROGRESS', ...(driverId && { driverId }), ...(vehicleId && { vehicleId }) } }),
            this.prisma.user.count({ where: { organizationId, role: 'DRIVER', ...(driverId && { id: driverId }) } }),
            this.prisma.journey.findMany({
                where: { organizationId, ...(driverId && { driverId }), ...(vehicleId && { vehicleId }) },
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: { driver: { select: { name: true } }, vehicle: { select: { plate: true } } }
            }),
            this.prisma.maintenance.aggregate({
                where: {
                    organizationId,
                    status: 'COMPLETED',
                    ...performedAtFilter,
                    ...(vehicleId && { vehicleId })
                },
                _sum: { cost: true }
            }),
            this.prisma.fuelEntry.aggregate({
                where: {
                    organizationId,
                    ...fuelDateFilter,
                    ...(driverId && { driverId }),
                    ...(vehicleId && { vehicleId })
                },
                _sum: { totalValue: true }
            }),
            this.prisma.journey.findMany({
                where: {
                    organizationId,
                    status: 'COMPLETED',
                    ...(start && end ? { endTime: { gte: new Date(start), lte: new Date(end) } } : {}),
                    ...(driverId && { driverId }),
                    ...(vehicleId && { vehicleId })
                },
                select: { startKm: true, endKm: true }
            }),
            this.prisma.checklist.count({
                where: {
                    journey: {
                        organizationId,
                        ...(driverId && { driverId }),
                        ...(vehicleId && { vehicleId }),
                        ...(start && end ? { createdAt: { gte: new Date(start), lte: new Date(end) } } : {})
                    },
                    items: { path: ['$'], array_contains: { status: 'ISSUE' } }
                }
            }),
            this.prisma.vehicle.groupBy({
                by: ['type'],
                where: { organizationId, status: 'AVAILABLE', ...(vehicleId && { id: vehicleId }) },
                _count: { _all: true }
            }),
            this.prisma.vehicle.groupBy({
                by: ['type'],
                where: { organizationId, status: 'IN_USE', ...(vehicleId && { id: vehicleId }) },
                _count: { _all: true }
            }),
            this.prisma.vehicle.groupBy({
                by: ['type'],
                where: { organizationId, status: 'MAINTENANCE', ...(vehicleId && { id: vehicleId }) },
                _count: { _all: true }
            }),
            this.prisma.incident.findMany({
                where: {
                    organizationId,
                    status: 'OPEN',
                    ...(driverId && { driverId }),
                    ...(vehicleId && { vehicleId }),
                    ...dateFilter
                },
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
                    incidents: { some: { status: 'OPEN' } },
                    ...(driverId && { driverId }),
                    ...(vehicleId && { vehicleId })
                }
            }),
            this.prisma.vehicle.aggregate({ where: { organizationId, ...(vehicleId && { id: vehicleId }) }, _sum: { currentKm: true } }).catch(() => ({ _sum: { currentKm: 0 } })),
            (this.prisma.vehicle as any).aggregate({ where: { organizationId, ...(vehicleId && { id: vehicleId }) }, _avg: { fuelLevel: true } }).catch(() => ({ _avg: { fuelLevel: 100 } }))
        ]);

        const totalKm = journeysWithKm.reduce((acc: number, j: any) => acc + ((j.endKm || 0) - j.startKm), 0);
        const history = await this.getMonthlyHistory(organizationId, new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1));

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
                monthlyCosts: (maintenanceCosts._sum?.cost || 0) + (fuelCosts._sum?.totalValue || 0),
                totalKm: Math.max(totalKm, (totalVehicleKm as any)._sum?.currentKm || 0),
                avgFuelLevel: Math.round((avgFuelLevel as any)._avg?.fuelLevel || 100),
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

            const [costAgg, fuelAgg, journeyList] = await Promise.all([
                this.prisma.maintenance.aggregate({
                    where: { organizationId, status: 'COMPLETED', performedAt: { gte: d, lt: nextD } },
                    _sum: { cost: true }
                }),
                this.prisma.fuelEntry.aggregate({
                    where: { organizationId, date: { gte: d, lt: nextD } },
                    _sum: { totalValue: true }
                }),
                this.prisma.journey.findMany({
                    where: { organizationId, status: 'COMPLETED', endTime: { gte: d, lt: nextD } },
                    select: { startKm: true, endKm: true }
                })
            ]);

            const monthlyKm = journeyList.reduce((acc: number, j: any) => acc + ((j.endKm || 0) - j.startKm), 0);

            results.push({
                name: months[d.getMonth()],
                costs: (costAgg._sum?.cost || 0) + (fuelAgg._sum?.totalValue || 0),
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
            select: { id: true, name: true }
        });

        const ranking = [];

        for (const driver of drivers) {
            const dateFilter = start && end ? { gte: start, lte: end } : {};

            // 1. Data Fetching
            const [fuelEntries, journeys, incidents, checklists] = await Promise.all([
                this.prisma.fuelEntry.findMany({
                    where: { organizationId, driverId: driver.id, date: dateFilter }
                }),
                this.prisma.journey.findMany({
                    where: { organizationId, driverId: driver.id, status: 'COMPLETED', endTime: dateFilter },
                    select: { startKm: true, endKm: true, startTime: true, checklists: true }
                }),
                this.prisma.incident.findMany({
                    where: { organizationId, driverId: driver.id, createdAt: dateFilter }
                }),
                this.prisma.checklist.count({
                    where: { journey: { driverId: driver.id }, createdAt: dateFilter }
                })
            ]);

            // 2. Efficiency Score (Fuel) - 30% Weight
            const totalFuelLiters = fuelEntries.reduce((acc, f) => acc + f.liters, 0);
            const totalKm = journeys.reduce((acc, j) => acc + ((j.endKm || 0) - j.startKm), 0);
            const kmPerLiter = totalFuelLiters > 0 ? totalKm / totalFuelLiters : 0;
            // Target: 10 km/l = 100 points (Simple baseline, can be dynamic later)
            const efficiencyScore = Math.min((kmPerLiter / 10) * 100, 100);

            // 3. Safety Score (Incidents) - 40% Weight
            let safetyScore = 100;
            incidents.forEach(inc => {
                // @ts-ignore - Field exists in DB
                if (inc.isDriverAtFault) safetyScore -= 30;
                else if (inc.severity === 'HIGH') safetyScore -= 20;
                else if (inc.severity === 'MEDIUM') safetyScore -= 10;
                else safetyScore -= 5;
            });
            if (safetyScore < 0) safetyScore = 0;

            // 4. Compliance Score (Checklists/App Usage) - 30% Weight
            // Ideal: 2 checklists per journey (Start/End)
            const expectedChecklists = journeys.length * 2;
            const complianceScore = expectedChecklists > 0
                ? Math.min((checklists / expectedChecklists) * 100, 100)
                : 100; // No journeys = Neutral compliance


            // 5. Overall Weighted Score
            const overallScore = Math.round(
                (efficiencyScore * 0.3) +
                (safetyScore * 0.4) +
                (complianceScore * 0.3)
            );

            ranking.push({
                driverId: driver.id,
                name: driver.name,
                totalKm,
                kmPerLiter: Number(kmPerLiter.toFixed(2)),
                incidentCount: incidents.length,
                // @ts-ignore
                atFaultCount: incidents.filter(i => i.isDriverAtFault).length,
                safetyScore: Math.round(safetyScore),
                efficiencyScore: Math.round(efficiencyScore),
                complianceScore: Math.round(complianceScore),
                overallScore
            });
        }

        return ranking.sort((a, b) => b.overallScore - a.overallScore);
    }
}
