import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant.context';
import { v4 as uuidv4 } from 'uuid';
import { Role } from '@prisma/client';

@Injectable()
export class InviteService {
    constructor(private prisma: PrismaService) { }

    async createInvite(email: string, role: Role = Role.DRIVER) {
        const organizationId = TenantContext.get();
        if (!organizationId) {
            throw new BadRequestException('Organization context missing');
        }

        // Check if user already exists
        const existingUser = await this.prisma.user.findFirst({
            where: { email, organizationId }
        });

        if (existingUser) {
            throw new BadRequestException('User already belongs to this organization');
        }

        // Token expires in 7 days
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        return this.prisma.invite.create({
            data: {
                email,
                role,
                token: uuidv4(),
                organizationId,
                expiresAt,
                status: 'PENDING'
            }
        });
    }

    async validateToken(token: string) {
        const invite = await this.prisma.invite.findUnique({
            where: { token },
            include: { organization: true }
        });

        if (!invite) {
            throw new NotFoundException('Invite not found');
        }

        if (invite.status !== 'PENDING') {
            throw new BadRequestException('Invite already used or canceled');
        }

        if (new Date() > invite.expiresAt) {
            await this.prisma.invite.update({
                where: { id: invite.id },
                data: { status: 'EXPIRED' }
            });
            throw new BadRequestException('Invite expired');
        }

        return invite;
    }

    async cancelInvite(id: string) {
        return this.prisma.invite.update({
            where: { id },
            data: { status: 'CANCELED' }
        });
    }

    async findAll() {
        const organizationId = TenantContext.get();
        return this.prisma.invite.findMany({
            where: { organizationId },
            orderBy: { createdAt: 'desc' }
        });
    }
}
