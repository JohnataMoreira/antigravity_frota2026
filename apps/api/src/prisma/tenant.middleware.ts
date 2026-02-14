import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantContext } from './tenant.context';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return next();
        }

        try {
            const token = authHeader.split(' ')[1];
            // Secret must match AuthModule. We use the same env var.
            const secret = process.env.JWT_SECRET || 'super-secret-key-change-in-prod';
            const decoded = jwt.verify(token, secret) as any;

            const organizationId = decoded.orgId || decoded.organizationId;

            if (decoded && organizationId) {
                return TenantContext.run(organizationId, () => next());
            }
        } catch (e) {
            // Invalid token, ignore and proceed (Guards will handle auth)
        }

        next();
    }
}
