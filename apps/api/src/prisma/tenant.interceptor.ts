/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenantContext } from './tenant.context';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest<any>();
        const user = req.user;

        if (!user || !user.organizationId) {
            // Allow public routes if they don't have user context
            return next.handle();
        }

        // Set organizationId for all subsequent operations in this request
        return TenantContext.run(user.organizationId, () => next.handle());
    }
}
