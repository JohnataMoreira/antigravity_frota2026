import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator, MemoryHealthIndicator } from '@nestjs/terminus';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../auth/decorators/index';
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

/**
 * HEALTH CHECK — Monitoramento de saúde do sistema
 *
 * Expõe endpoint /health que verifica:
 * - Banco de dados (conexão ativa?)
 * - Uso de memória (está consumindo demais?)
 * - Sistema em geral
 *
 * Permite que:
 * - Load balancers removam instâncias doentes
 * - Kubernetes reinicie pods com problemas
 * - Alertas sejam disparados por ferramentas de monitoramento
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  @Public()
  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Verificar saúde do sistema' })
  check() {
    return this.health.check([
      // Banco de dados
      () => this.db.pingCheck('database', { timeout: 3000 }),

      // Memória heap — alerta se > 250MB
      () => this.memory.checkHeap('memory_heap', 250 * 1024 * 1024),

      // Memória RSS — alerta se > 512MB
      () => this.memory.checkRSS('memory_rss', 512 * 1024 * 1024),
    ]);
  }

  @Public()
  @Get('ready')
  @ApiOperation({ summary: 'Verificar se sistema está pronto para receber tráfego' })
  async readiness() {
    const dbReady = this.dataSource.isInitialized;
    if (!dbReady) {
      return { status: 'not_ready', reason: 'database_not_initialized' };
    }
    return { status: 'ready', timestamp: new Date().toISOString() };
  }

  @Public()
  @Get('live')
  @ApiOperation({ summary: 'Verificar se processo está vivo (liveness probe)' })
  liveness() {
    return { status: 'alive', timestamp: new Date().toISOString() };
  }
}

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
})
export class HealthModule {}
