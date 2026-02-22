import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger('HTTP');

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const { method, url, ip, body } = request;
        const user = request.user?.id || 'anonymous';
        const requestId = request['requestId'] || 'N/A';
        const startTime = Date.now();

        return next.handle().pipe(
            tap((responseBody) => {
                const duration = Date.now() - startTime;
                const statusCode = context.switchToHttp().getResponse().statusCode;

                // Sanitização básica do log
                const sanitizedBody = this.sanitize(body);

                this.logger.log(
                    `[${requestId}] ${method} ${url} ${statusCode} - User: ${user} - IP: ${ip} - Duration: ${duration}ms`,
                );

                if (duration > 5000) {
                    this.logger.warn(`[PERFS] Requisição LENTA detectada: ${method} ${url} (${duration}ms)`);
                }
            }),
        );
    }

    private sanitize(data: any): any {
        if (!data || typeof data !== 'object') return data;
        const sanitized = { ...data };
        const sensitiveFields = [
            'password', 'token', 'refreshToken', 'accessToken', 'secret', 'passwordHash', 'hashedRefreshToken'
        ];

        for (const key of Object.keys(sanitized)) {
            if (sensitiveFields.includes(key)) {
                sanitized[key] = '[REDACTED]';
            } else if (typeof sanitized[key] === 'object') {
                sanitized[key] = this.sanitize(sanitized[key]);
            }
        }
        return sanitized;
    }
}
