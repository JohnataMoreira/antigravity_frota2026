import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { TenantContext } from './tenant.context';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
    private readonly logger = new Logger('HTTP');

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const { method, url } = request;
        const startTime = Date.now();

        return next.handle().pipe(
            tap(() => {
                const response = context.switchToHttp().getResponse();
                const duration = Date.now() - startTime;
                const statusCode = response.statusCode;
                const organizationId = TenantContext.get();
                const userId = request.user?.userId || 'anonymous';

                const logData = {
                    timestamp: new Date().toISOString(),
                    method,
                    url,
                    statusCode,
                    duration: `${duration}ms`,
                    organizationId,
                    userId,
                };

                // Output as JSON for log collectors
                console.log(JSON.stringify(logData));
            }),
        );
    }
}
