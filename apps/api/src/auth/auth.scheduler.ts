import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthScheduler {
    private readonly logger = new Logger(AuthScheduler.name);

    constructor(private readonly usersService: UsersService) { }

    /**
     * Limpa dados de bloqueio expirados a cada hora.
     * Isso desbloqueia contas cujo 'lockedUntil' já passou.
     */
    @Cron(CronExpression.EVERY_HOUR)
    async handleMaintenance() {
        this.logger.log('Iniciando manutenção de segurança: limpeza de bloqueios expirados...');
        try {
            await this.usersService.cleanExpiredData();
            this.logger.log('Manutenção de segurança concluída com sucesso.');
        } catch (error: any) {
            this.logger.error('Erro durante a manutenção de segurança:', error.message);
        }
    }
}
