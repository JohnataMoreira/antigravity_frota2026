import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { MailService } from '../common/mail/mail.service';

@Injectable()
export class InviteService {
    constructor(
        private prisma: PrismaService,
        private mail: MailService,
    ) { }

    async create(organizationId: string, email: string, role: string) {
        const existing = await (this.prisma as any).invite.findFirst({
            where: { email, organizationId, usedAt: null },
        });
        if (existing) {
            throw new BadRequestException('Já existe um convite pendente para este e-mail.');
        }
        const token = uuidv4();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const invite = await (this.prisma as any).invite.create({
            data: { token, email, role, organizationId, expiresAt },
        });

        // Trigger notification hook (Email/SMS placeholder)
        this.triggerNotification(email, token);

        return invite;
    }

    private async triggerNotification(email: string, token: string) {
        const registrationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/register-invite?token=${token}`;

        await this.mail.sendMail(
            email,
            'Bem-vindo ao Frota2026 - Seu convite chegou!',
            `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Você foi convidado!</h2>
                <p>Olá! Você foi convidado para participar da plataforma Frota2026.</p>
                <p>Para concluir seu cadastro e acessar sua conta, clique no botão abaixo:</p>
                <div style="margin: 30px 0;">
                    <a href="${registrationUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                        Completar meu Cadastro
                    </a>
                </div>
                <p style="color: #666; font-size: 14px;">Se o botão não funcionar, copie e cole este link no seu navegador:</p>
                <p style="color: #666; font-size: 14px;">${registrationUrl}</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #999;">Esta é uma mensagem automática, por favor não responda.</p>
            </div>
            `
        );
        console.log(`[Invite] Invitation sent to ${email} via MailService.`);
    }

    async findByToken(token: string) {
        const invite = await (this.prisma as any).invite.findUnique({
            where: { token },
            include: { organization: true }
        });
        if (!invite) throw new NotFoundException('Convite não encontrado ou link inválido.');
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
