import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * MIDDLEWARE DE SEGURANÇA
 *
 * Executado em TODA requisição antes dos guards e handlers.
 * Responsabilidades:
 * - Adicionar Request ID único para rastreabilidade
 * - Detectar e bloquear payloads suspeitos
 * - Limitar tamanho de payload
 * - Logar IPs suspeitos
 */
@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SecurityMiddleware.name);

  // Padrões de injeção para detectar ataques básicos
  private readonly INJECTION_PATTERNS = [
    /(\$where|\$ne|\$gt|\$lt|\$regex)/i, // NoSQL injection
    /(UNION\s+SELECT|DROP\s+TABLE|INSERT\s+INTO|DELETE\s+FROM)/i, // SQL injection
    /(<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>)/i, // XSS básico
    /(javascript:|data:text\/html)/i, // XSS via protocolo
  ];

  use(req: Request, res: Response, next: NextFunction): void {
    // ─── Request ID para rastreabilidade ───────────────────────
    const requestId =
      (req.headers['x-request-id'] as string) ||
      require('crypto').randomBytes(8).toString('hex');

    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-ID', requestId);

    // ─── Headers de segurança adicionais ───────────────────────
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // ─── Verificação de tamanho do payload ─────────────────────
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    if (contentLength > 1024 * 1024) { // Máx 1MB
      this.logger.warn(`Payload muito grande: ${contentLength} bytes | IP: ${req.ip}`);
      res.status(413).json({ message: 'Payload muito grande', statusCode: 413 });
      return;
    }

    // ─── Detecção de padrões de injeção no body ─────────────────
    if (req.body) {
      const bodyStr = JSON.stringify(req.body);
      const suspiciousPattern = this.INJECTION_PATTERNS.find((p) => p.test(bodyStr));

      if (suspiciousPattern) {
        this.logger.warn(
          `Padrão de injeção detectado! IP: ${req.ip} | URL: ${req.url} | Pattern: ${suspiciousPattern}`,
        );
        res.status(400).json({
          message: 'Requisição inválida',
          statusCode: 400,
        });
        return;
      }
    }

    next();
  }
}
