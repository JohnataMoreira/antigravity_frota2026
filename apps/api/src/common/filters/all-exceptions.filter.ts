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

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger('ExceptionFilter');

    constructor(private configService: ConfigService) { }

    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const isProd = this.configService.get('NODE_ENV') === 'production';

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const requestId = (request as any)['requestId'] || 'N/A';

        // Log detalhado do erro (sempre feito no servidor)
        this.logger.error(
            `[${requestId}] ${request.method} ${request.url} - Status: ${status} - Error: ${exception.message}`,
            exception.stack,
        );

        let message = exception.message || 'Internal server error';
        let errorResponse: any = {
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            requestId,
        };

        // Em produção, mascare erros 5xx
        if (isProd && status >= 500) {
            message = 'Ocorreu um erro interno. Por favor, tente novamente mais tarde.';
            errorResponse.message = message;
        } else {
            // Detalhes extras em dev
            errorResponse.message = message;
            if (!isProd) {
                errorResponse.stack = exception.stack;
                errorResponse.detail = exception.response || null;
            }
        }

        // Mapeamento de erros específicos do Prisma
        if (exception.code === 'P2002') {
            errorResponse.statusCode = HttpStatus.CONFLICT;
            errorResponse.message = 'Recurso já existe (violação de unicidade)';
        }

        response.status(errorResponse.statusCode).json(errorResponse);
    }
}
