import { Controller, Get, Request } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('reports')
export class ReportsController {
    constructor(private prisma: PrismaService) { }

    @Get('overview')
    async getOverview(@Request() req: any) {
        const orgId = req.user.organizationId;

        const [
            totalVehicles,
            availableVehicles,
            activeJourneys,
            totalDrivers,
            recentJourneys
        ] = await Promise.all([
            this.prisma.vehicle.count({ where: { organizationId: orgId } }),
            this.prisma.vehicle.count({ where: { organizationId: orgId, status: 'AVAILABLE' } }),
            this.prisma.journey.count({ where: { organizationId: orgId, status: 'IN_PROGRESS' } }),
            this.prisma.user.count({ where: { organizationId: orgId, role: 'DRIVER' } }),
            this.prisma.journey.findMany({
                where: { organizationId: orgId },
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: { driver: { select: { name: true } }, vehicle: { select: { plate: true } } }
            })
        ]);

        return {
            stats: {
                totalVehicles,
                availableVehicles,
                activeJourneys,
                totalDrivers,
                issuesReported: 0 // TODO: Count from checklists
            },
            recentActivity: recentJourneys
        };
    }
}
