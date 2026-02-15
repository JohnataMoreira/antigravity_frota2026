import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction, AuditEntity } from './audit.types';

@Injectable()
export class AuditService {
    constructor(private prisma: PrismaService) { }

    async log(data: {
        organizationId: string;
        userId?: string;
        action: AuditAction | string;
        entity: AuditEntity | string;
        entityId?: string;
        metadata?: any;
    }) {
        try {
            return await this.prisma.auditLog.create({
                data,
            });
        } catch (error) {
            console.error('Failed to save audit log:', error);
        }
    }

    async findAll(organizationId: string, filters: { entity?: string; action?: string; userId?: string; page?: number; limit?: number }) {
        const { entity, action, userId, page = 1, limit = 20 } = filters;
        const skip = (page - 1) * limit;

        const where: any = { organizationId };
        if (entity) where.entity = entity;
        if (action) where.action = action;
        if (userId) where.userId = userId;

        const [items, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                include: { organization: { select: { name: true } } },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.auditLog.count({ where }),
        ]);

        return { items, total, page, limit };
    }
}
