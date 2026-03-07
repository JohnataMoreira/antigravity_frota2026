import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class InviteService {
    constructor(private prisma: PrismaService) { }

    async create(organizationId: string, email: string, role: string) {
        const existing = await (this.prisma as any).invite.findFirst({
            where: { email, organizationId, usedAt: null },
        });
        if (existing) {
            throw new BadRequestException('Já existe um convite pendente para este e-mail.');
        }
        const token = uuidv4();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        return (this.prisma as any).invite.create({
            data: { token, email, role, organizationId, expiresAt },
        });
    }

    async findByToken(token: string) {
        const invite = await (this.prisma as any).invite.findUnique({ where: { token } });
        if (!invite) throw new NotFoundException('Convite não encontrado.');
        if (invite.usedAt) throw new BadRequestException('Este convite já foi utilizado.');
        if (new Date() > invite.expiresAt) throw new BadRequestException('Este convite expirou.');
        return invite;
    }

    async markUsed(token: string) {
        return (this.prisma as any).invite.update({
            where: { token },
            data: { usedAt: new Date() },
        });
    }

    async findAll(organizationId: string) {
        return (this.prisma as any).invite.findMany({
            where: { organizationId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async remove(id: string) {
        return (this.prisma as any).invite.delete({ where: { id } });
    }
}
