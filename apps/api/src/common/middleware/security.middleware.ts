import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        // 1. Injeta Request ID para rastreabilidade
        const requestId = req.headers['x-request-id'] || uuidv4();
        (req as any)['requestId'] = requestId;
        res.setHeader('X-Request-ID', requestId as string);

        // 2. Proteção contra payloads gigantes (DoS)
        const contentLength = parseInt(req.headers['content-length'] || '0', 10);
        if (contentLength > 1024 * 1024) { // 1MB limit
            throw new BadRequestException('Payload too large');
        }

        // 3. Detecção básica de injeção (SQL/NoSQL/XSS)
        const bodyStr = JSON.stringify(req.body);
        const suspiciousPatterns = [
            /\$where/i, /\$ne/i, /\$gt/i,           // NoSQL Injection
            /UNION\s+SELECT/i, /DROP\s+TABLE/i,    // SQL Injection
            /<script\b[^>]*>([\s\S]*?)<\/script>/i // XSS básico
        ];

        for (const pattern of suspiciousPatterns) {
            if (pattern.test(bodyStr) || pattern.test(req.url)) {
                throw new BadRequestException('Potential security threat detected');
            }
        }

        next();
    }
}
