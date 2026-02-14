import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
    constructor(private prisma: PrismaService) { }

    @Get('overview')
    async getOverview() {
        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

        const [
            totalVehicles,
            availableVehicles,
            activeJourneys,
            totalDrivers,
            recentJourneys,
            maintenanceCosts,
            journeysWithKm,
            checklistsWithIssues
        ] = await Promise.all([
            this.prisma.vehicle.count(),
            this.prisma.vehicle.count({ where: { status: 'AVAILABLE' } }),
            this.prisma.journey.count({ where: { status: 'IN_PROGRESS' } }),
            this.prisma.user.count(),
            this.prisma.journey.findMany({
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: { driver: { select: { name: true } }, vehicle: { select: { plate: true } } }
            }),
            // Total costs this month
            this.prisma.maintenance.aggregate({
                where: {
                    status: 'COMPLETED',
                    performedAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) }
                },
                _sum: { cost: true }
            }),
            // Total Km from completed journeys
            this.prisma.journey.findMany({
                where: { status: 'COMPLETED' },
                select: { startKm: true, endKm: true }
            }),
            // Health: issues in checklists
            this.prisma.checklist.count({
                where: {
                    items: { path: ['$'], array_contains: { status: 'ISSUE' } }
                }
            })
        ]);

        // Calculate total distance
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const totalKm = journeysWithKm.reduce((acc: number, j: any) => acc + ((j.endKm || 0) - j.startKm), 0);
        /* eslint-enable @typescript-eslint/no-explicit-any */

        // Generate history for charts
        const history = await this.getMonthlyHistory(sixMonthsAgo);

        return {
            stats: {
                totalVehicles,
                availableVehicles,
                activeJourneys,
                totalEmployees: totalDrivers,
                monthlyCosts: maintenanceCosts._sum?.cost || 0,
                totalKm,
                issuesReported: checklistsWithIssues
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

            /* eslint-disable @typescript-eslint/no-explicit-any */
            const monthlyKm = journeyList.reduce((acc: number, j: any) => acc + ((j.endKm || 0) - j.startKm), 0);
            /* eslint-enable @typescript-eslint/no-explicit-any */

            results.push({
                name: months[d.getMonth()],
                costs: costAgg._sum?.cost || 0,
                km: monthlyKm
            });
        }

        return results;
    }
}
