import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  RequestTimeoutException,
  Logger,
} from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

/**
 * TIMEOUT INTERCEPTOR
 *
 * Garante que NENHUMA requisição fique presa indefinidamente.
 * Se o handler demorar mais que o limite, retorna 503 automaticamente.
 * Essencial para:
 * - Banco de dados lento ou travado
 * - Serviços externos que não respondem (Google OAuth, etc.)
 * - Deadlocks
 * - Oscilações de rede
 */
@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TimeoutInterceptor.name);

  constructor(private readonly timeoutMs: number = 30000) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      timeout(this.timeoutMs),
      catchError((err) => {
        if (err instanceof TimeoutError) {
          this.logger.warn(
            `Timeout em ${request.method} ${request.url} após ${this.timeoutMs}ms`,
          );
          return throwError(
            () => new RequestTimeoutException('Requisição expirou. Tente novamente.'),
          );
        }
        return throwError(() => err);
      }),
    );
  }
}
