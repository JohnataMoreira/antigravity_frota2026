import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';
import { AuditAction, AuditEntity } from './audit.types';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
    constructor(
        private auditService: AuditService,
        private prisma: PrismaService
    ) { }

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest();
        const { method, url, user, body } = request;

        // Only log mutations
        if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
            return next.handle();
        }

        // Pre-fetch old data for Diff if it's an update (PATCH/PUT)
        let oldValues: any = null;
        const entityId = this.extractId(url) || body?.id;
        const entityName = this.extractEntity(url);

        if (['PATCH', 'PUT', 'DELETE'].includes(method) && entityId && entityName) {
            try {
                const modelName = entityName.toLowerCase();
                // Safe access to prisma models
                if ((this.prisma as any)[modelName]) {
                    oldValues = await (this.prisma as any)[modelName].findUnique({ where: { id: entityId } });
                }
            } catch (e) {
                // Silently skip if model not found or error
            }
        }

        return next.handle().pipe(
            tap({
                next: (data) => {
                    if (!user || !user.organizationId) return;

                    const action = this.mapMethodToAction(method);
                    const finalEntityId = data?.id || body?.id || entityId;

                    this.auditService.log({
                        organizationId: user.organizationId,
                        userId: user.userId || user.id,
                        action,
                        entity: entityName,
                        entityId: finalEntityId?.toString(),
                        metadata: {
                            path: url,
                            method,
                            body: this.sanitize(body),
                            oldValues: this.sanitize(oldValues),
                            newValues: method === 'DELETE' ? null : this.sanitize(data),
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
        const entity = parts[0] || 'Unknown';
        // Map common paths to AuditEntity names
        const map: Record<string, string> = {
            vehicles: AuditEntity.VEHICLE,
            users: AuditEntity.USER,
            drivers: AuditEntity.USER,
            journeys: AuditEntity.JOURNEY,
            maintenance: AuditEntity.MAINTENANCE,
            fuel: AuditEntity.FUEL_ENTRY,
            incidents: AuditEntity.INCIDENT,
            stock: AuditEntity.STOCK,
        };
        return map[entity] || entity.charAt(0).toUpperCase() + entity.slice(1);
    }

    private mapMethodToAction(method: string): AuditAction {
        const map: Record<string, AuditAction> = {
            POST: AuditAction.CREATE,
            PATCH: AuditAction.UPDATE,
            PUT: AuditAction.UPDATE,
            DELETE: AuditAction.DELETE,
        };
        return map[method] || AuditAction.ACCESS;
    }

    private extractId(url: string): string | undefined {
        const parts = url.split('/');
        const last = parts[parts.length - 1];
        return last && last.length > 5 ? last : undefined;
    }

    private sanitize(obj: any) {
        if (!obj) return obj;
        if (typeof obj !== 'object') return obj;

        const sanitized = Array.isArray(obj) ? [...obj] : { ...obj };
        const sensitiveFields = ['password', 'passwordHash', 'token', 'secret', 'jwt'];

        if (!Array.isArray(sanitized)) {
            sensitiveFields.forEach(field => {
                if (field in sanitized) delete sanitized[field];
            });
        }

        return sanitized;
    }
}
