import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditService {
    constructor(private prisma: PrismaService) { }

    async log(data: {
        organizationId: string;
        userId?: string;
        action: string;
        entity: string;
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
}
