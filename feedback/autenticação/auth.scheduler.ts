import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';

/**
 * TAREFAS AGENDADAS — Manutenção automática do sistema
 *
 * Garante que o sistema se auto-mantenha sem intervenção manual:
 * - Limpa dados expirados periodicamente
 * - Desbloqueia contas após período de penalidade
 * - Invalida tokens órfãos
 * - Loga métricas de saúde
 *
 * Isso previne acúmulo de dados obsoletos que podem:
 * 1. Degradar performance do banco
 * 2. Manter contas bloqueadas erroneamente após reinício
 * 3. Vazar informações em consultas futuras
 */
@Injectable()
export class AuthScheduler {
  private readonly logger = new Logger(AuthScheduler.name);

  constructor(
    private readonly usersService: UsersService,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  // ─── A cada 5 minutos: desbloqueia contas ────────────────────
  @Cron(CronExpression.EVERY_5_MINUTES)
  async unlockExpiredAccounts(): Promise<void> {
    try {
      const result = await this.userRepo
        .createQueryBuilder()
        .update(User)
        .set({ lockedUntil: null, failedLoginAttempts: 0 })
        .where('lockedUntil IS NOT NULL AND lockedUntil < :now', { now: new Date() })
        .execute();

      if (result.affected > 0) {
        this.logger.log(`${result.affected} conta(s) desbloqueada(s) automaticamente`);
      }
    } catch (error) {
      this.logger.error('Erro ao desbloquear contas expiradas', error.stack);
      // Não relança o erro — falha na tarefa não deve derrubar o sistema
    }
  }

  // ─── A cada hora: limpa tokens de verificação expirados ──────
  @Cron(CronExpression.EVERY_HOUR)
  async cleanExpiredVerificationTokens(): Promise<void> {
    try {
      await this.userRepo
        .createQueryBuilder()
        .update(User)
        .set({ emailVerificationToken: null, emailVerificationExpires: null })
        .where(
          'emailVerificationExpires IS NOT NULL AND emailVerificationExpires < :now',
          { now: new Date() },
        )
        .execute();
    } catch (error) {
      this.logger.error('Erro ao limpar tokens de verificação', error.stack);
    }
  }

  // ─── Toda meia-noite: limpeza profunda e métricas ────────────
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async dailyMaintenance(): Promise<void> {
    this.logger.log('Iniciando manutenção diária...');

    try {
      // Limpa refresh tokens de usuários inativos há mais de 90 dias
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const result = await this.userRepo
        .createQueryBuilder()
        .update(User)
        .set({ hashedRefreshToken: null })
        .where(
          'hashedRefreshToken IS NOT NULL AND (lastLoginAt IS NULL OR lastLoginAt < :date)',
          { date: ninetyDaysAgo },
        )
        .execute();

      this.logger.log(`Manutenção diária concluída. Sessões limpas: ${result.affected}`);
    } catch (error) {
      this.logger.error('Erro na manutenção diária', error.stack);
    }
  }

  // ─── A cada 30 minutos: reporta métricas de segurança ────────
  @Cron('*/30 * * * *')
  async reportSecurityMetrics(): Promise<void> {
    try {
      const [lockedAccounts, inactiveUsers] = await Promise.all([
        this.userRepo.count({ where: { lockedUntil: LessThan(new Date()) } }),
        this.userRepo.count({ where: { isActive: false } }),
      ]);

      this.logger.log(
        `[Métricas] Contas bloqueadas: ${lockedAccounts} | Usuários inativos: ${inactiveUsers}`,
      );
    } catch (error) {
      // Métricas não críticas — apenas loga
      this.logger.warn('Aviso: erro ao coletar métricas de segurança');
    }
  }
}
