import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChecklistTemplateDto, UpdateChecklistTemplateDto } from './dto';

@Injectable()
export class ChecklistTemplatesService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateChecklistTemplateDto) {
        // organizationId is handled by Prisma extension in PrismaService
        return this.prisma.checklistTemplate.create({
            data: {
                name: dto.name,
                description: dto.description,
                items: dto.items,
                isActive: dto.isActive,
            } as any,
        });
    }

    async findAll() {
        // organizationId is handled by Prisma extension in PrismaService
        return this.prisma.checklistTemplate.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        // organizationId is handled by Prisma extension in PrismaService
        const template = await this.prisma.checklistTemplate.findUnique({
            where: { id },
        });

        if (!template) {
            throw new NotFoundException('Template not found');
        }

        return template;
    }

    async update(id: string, dto: UpdateChecklistTemplateDto) {
        // Verify it exists first (Prisma extension handles orgId check)
        await this.findOne(id);

        return this.prisma.checklistTemplate.update({
            where: { id },
            data: dto,
        });
    }

    async remove(id: string) {
        // Verify it exists first
        await this.findOne(id);

        return this.prisma.checklistTemplate.delete({
            where: { id },
        });
    }
}
