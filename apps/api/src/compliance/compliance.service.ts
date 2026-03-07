import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ComplianceService {
    constructor(private prisma: PrismaService) { }

    async createTemplate(organizationId: string, data: any) {
        return (this.prisma as any).checklistTemplate.create({
            data: {
                ...data,
                organizationId
            }
        });
    }

    async findAllTemplates(organizationId: string) {
        return (this.prisma as any).checklistTemplate.findMany({
            where: { organizationId, isActive: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    async updateTemplate(id: string, organizationId: string, data: any) {
        return (this.prisma as any).checklistTemplate.updateMany({
            where: { id, organizationId },
            data
        });
    }

    async deleteTemplate(id: string, organizationId: string) {
        return (this.prisma as any).checklistTemplate.updateMany({
            where: { id, organizationId },
            data: { isActive: false }
        });
    }
}
