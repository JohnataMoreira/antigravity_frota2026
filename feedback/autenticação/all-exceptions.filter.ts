import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { QueryFailedError, EntityNotFoundError } from 'typeorm';

/**
 * FILTRO GLOBAL DE EXCEÇÕES
 *
 * Responsabilidades:
 * 1. Nunca vazar stack traces ou detalhes técnicos em produção
 * 2. Mapear erros de banco de dados para respostas HTTP seguras
 * 3. Logar TUDO internamente para auditoria
 * 4. Retornar respostas padronizadas e previsíveis
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);
  private readonly isProd: boolean;

  constructor(private readonly configService: ConfigService) {
    this.isProd = configService.get('NODE_ENV') === 'production';
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message } = this.resolveException(exception);
    const requestId = request.headers['x-request-id'] || this.generateRequestId();

    // Log COMPLETO internamente (para debug e auditoria)
    const logPayload = {
      requestId,
      method: request.method,
      url: request.url,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      userId: (request as any).user?.id,
      statusCode: status,
      error: exception instanceof Error ? exception.message : String(exception),
      stack: exception instanceof Error ? exception.stack : undefined,
    };

    if (status >= 500) {
      this.logger.error('Erro interno do servidor', JSON.stringify(logPayload));
    } else if (status >= 400) {
      this.logger.warn('Erro de cliente', JSON.stringify(logPayload));
    }

    // Resposta ao cliente — SANITIZADA em produção
    response.status(status).json({
      statusCode: status,
      // Em produção, erros 5xx sempre mostram mensagem genérica
      message: this.isProd && status >= 500 ? 'Erro interno do servidor' : message,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId, // Permite rastrear o erro nos logs sem expor detalhes
    });
  }

  private resolveException(exception: unknown): { status: number; message: string | object } {
    // Exceções HTTP do NestJS (HttpException e filhos)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      const message =
        typeof response === 'object'
          ? (response as any).message || exception.message
          : response;
      return { status, message };
    }

    // Erros do TypeORM
    if (exception instanceof QueryFailedError) {
      const dbError = exception as any;

      // Violação de unique constraint (email duplicado, etc.)
      if (dbError.code === '23505') {
        return { status: HttpStatus.CONFLICT, message: 'Recurso já existe' };
      }

      // Violação de foreign key
      if (dbError.code === '23503') {
        return { status: HttpStatus.BAD_REQUEST, message: 'Referência inválida' };
      }

      // Query cancelada (timeout)
      if (dbError.code === '57014') {
        return {
          status: HttpStatus.SERVICE_UNAVAILABLE,
          message: 'Serviço temporariamente indisponível',
        };
      }

      // Erro genérico de banco
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Erro ao processar a operação',
      };
    }

    if (exception instanceof EntityNotFoundError) {
      return { status: HttpStatus.NOT_FOUND, message: 'Recurso não encontrado' };
    }

    // Qualquer outro erro não tratado
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Erro interno do servidor',
    };
  }

  private generateRequestId(): string {
    return require('crypto').randomBytes(8).toString('hex');
  }
}
