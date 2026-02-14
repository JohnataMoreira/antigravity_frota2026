import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
    constructor(private auditService: AuditService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const { method, url, user, body } = request;

        // Only log mutations
        if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
            return next.handle();
        }

        return next.handle().pipe(
            tap({
                next: (data) => {
                    if (!user || !user.organizationId) return;

                    const entity = this.extractEntity(url);
                    const action = this.mapMethodToAction(method);
                    const entityId = data?.id || body?.id || this.extractId(url);

                    this.auditService.log({
                        organizationId: user.organizationId,
                        userId: user.id || user.userId,
                        action,
                        entity,
                        entityId: entityId?.toString(),
                        metadata: {
                            path: url,
                            method,
                            body: this.sanitize(body),
                            ip: request.ip,
                            userAgent: request.headers['user-agent'],
                        },
                    }).catch(err => console.error('Audit Log Async failed', err));
                },
            }),
        );
    }

    private extractEntity(url: string): string {
        const parts = url.split('/').filter(p => p && p !== 'api');
        return parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'Unknown';
    }

    private mapMethodToAction(method: string): string {
        const map: Record<string, string> = {
            POST: 'CREATE',
            PATCH: 'UPDATE',
            PUT: 'UPDATE',
            DELETE: 'DELETE',
        };
        return map[method] || method;
    }

    private extractId(url: string): string | undefined {
        const parts = url.split('/');
        // Capture the last part if it looks like a ID (uuid pattern or similar)
        const last = parts[parts.length - 1];
        return last && last.length > 5 ? last : undefined;
    }

    private sanitize(obj: any) {
        if (!obj) return obj;
        const sanitized = { ...obj };
        const sensitiveFields = ['password', 'passwordHash', 'token', 'secret'];
        sensitiveFields.forEach(field => delete sanitized[field]);
        return sanitized;
    }
}
