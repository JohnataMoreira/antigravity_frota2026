import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReportsService } from './reports.service';
import { MailService } from '../common/mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsCronService {
    private readonly logger = new Logger(ReportsCronService.name);

    constructor(
        private reportsService: ReportsService,
        private mailService: MailService,
        private prisma: PrismaService,
    ) { }

    @Cron('0 0 7 * * 1') // Toda segunda-feira às 07:00 AM
    async sendWeeklyFleetSummary() {
        this.logger.log('Iniciando geração de resumos semanais da frota...');

        try {
            // Busca todas as organizações que têm usuários ADMIN ativos
            const orgs = await this.prisma.organization.findMany({
                include: {
                    users: {
                        where: { role: 'ADMIN', active: true }
                    }
                }
            });

            for (const org of orgs) {
                if (!org.users.length) continue;

                const stats = await this.reportsService.getOverview(org.id);

                const html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #fff;">
            <div style="background-color: #2563eb; color: white; padding: 32px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; letter-spacing: -0.025em;">GRUPO PARAOPEBA</h1>
              <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">Relatório Semanal de Desempenho - ${org.name}</p>
            </div>
            
            <div style="padding: 32px;">
              <p style="font-size: 16px; color: #334155;">Olá, <strong>Gestor</strong>.</p>
              <p style="font-size: 14px; color: #64748b; line-height: 1.5;">Aqui estão os indicadores consolidados da sua operação na última semana:</p>
              
              <div style="margin: 32px 0;">
                <table width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #f1f5f9;">
                      <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: bold;">Investimento em Manutenção</p>
                      <p style="margin: 4px 0 0; font-size: 20px; font-weight: 800; color: #1e293b;">R$ ${stats.stats.monthlyCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </td>
                    <td width="16"></td>
                    <td style="padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #f1f5f9;">
                      <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: bold;">Distância Percorrida</p>
                      <p style="margin: 4px 0 0; font-size: 20px; font-weight: 800; color: #1e293b;">${stats.stats.totalKm.toLocaleString('pt-BR')} KM</p>
                    </td>
                  </tr>
                </table>
              </div>

              <div style="padding: 24px; background: #eff6ff; border-radius: 8px; border-left: 4px solid #2563eb; margin-bottom: 32px;">
                <p style="margin: 0; font-size: 13px; color: #1d4ed8;"><strong>Destaque:</strong> Sua frota relatou ${stats.stats.issuesReported} novos incidentes que requerem atenção.</p>
              </div>

              <a href="https://frota2026.com.br" style="display: block; text-align: center; background: #2563eb; color: white; padding: 16px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Acessar Painel de Controle</a>
            </div>

            <div style="padding: 24px; background: #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
              Você está recebendo este e-mail pois é um administrador da plataforma Frota2026.<br>
              © 2026 Frota2026 - Gestão Inteligente - Grupo Paraopeba
            </div>
          </div>
        `;

                for (const user of org.users) {
                    await this.mailService.sendMail(
                        user.email,
                        `📊 Resumo Semanal da Frota - ${org.name}`,
                        html
                    );
                }
            }
            this.logger.log('Resumos semanais enviados com sucesso.');
        } catch (error) {
            this.logger.error('Erro ao processar cron de relatórios', error);
        }
    }
}
