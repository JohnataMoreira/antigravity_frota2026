import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import * as compression from 'compression';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
    // Não expor detalhes do framework em erros
    abortOnError: false,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const isProd = nodeEnv === 'production';

  // ─────────────────────────────────────────────
  // SEGURANÇA: Headers HTTP via Helmet
  // ─────────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
          upgradeInsecureRequests: isProd ? [] : null,
        },
      },
      // Força HTTPS por 1 ano em produção
      hsts: isProd
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : false,
      // Impede clickjacking
      frameguard: { action: 'deny' },
      // Evita MIME sniffing
      noSniff: true,
      // Remove header X-Powered-By
      hidePoweredBy: true,
      // Política de referência segura
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      // Previne abertura de downloads como HTML
      ieNoOpen: true,
      // Habilita proteção XSS do browser
      xssFilter: true,
    }),
  );

  // ─────────────────────────────────────────────
  // CORS — Whitelist de origens
  // ─────────────────────────────────────────────
  const allowedOrigins = configService
    .get<string>('ALLOWED_ORIGINS', 'http://localhost:3001')
    .split(',')
    .map((o) => o.trim());

  app.enableCors({
    origin: (origin, callback) => {
      // Permitir requisições sem origin (ex: Postman em dev) apenas fora de prod
      if (!origin && !isProd) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`Origin ${origin} não permitida pelo CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  });

  // ─────────────────────────────────────────────
  // COOKIES, COMPRESSÃO, VERSIONAMENTO
  // ─────────────────────────────────────────────
  app.use(cookieParser(configService.get<string>('COOKIE_SECRET')));
  app.use(compression());

  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // ─────────────────────────────────────────────
  // VALIDAÇÃO GLOBAL — Bloqueia payloads inválidos
  // ─────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // Remove campos não declarados no DTO
      forbidNonWhitelisted: true, // Rejeita requisição se houver campos extras
      transform: true,           // Converte tipos automaticamente
      transformOptions: { enableImplicitConversion: true },
      disableErrorMessages: isProd, // Oculta detalhes de validação em produção
      stopAtFirstError: false,
    }),
  );

  // ─────────────────────────────────────────────
  // FILTROS E INTERCEPTORS GLOBAIS
  // ─────────────────────────────────────────────
  app.useGlobalFilters(new AllExceptionsFilter(configService));
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TimeoutInterceptor(30000), // Timeout de 30s em qualquer requisição
  );

  // ─────────────────────────────────────────────
  // SWAGGER (apenas em não-produção)
  // ─────────────────────────────────────────────
  if (!isProd) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Auth System API')
      .setDescription('Sistema de autenticação robusto — NestJS + JWT + Google OAuth')
      .setVersion('1.0')
      .addBearerAuth()
      .addCookieAuth('refresh_token')
      .build();

    SwaggerModule.setup(
      'api/docs',
      app,
      SwaggerModule.createDocument(app, swaggerConfig),
    );
  }

  // ─────────────────────────────────────────────
  // GRACEFUL SHUTDOWN — Fecha conexões com segurança
  // ─────────────────────────────────────────────
  app.enableShutdownHooks();

  process.on('uncaughtException', (error) => {
    logger.error(`[UNCAUGHT EXCEPTION] ${error.message}`, error.stack);
    // Não mata o processo abruptamente — permite finalizar requests em andamento
  });

  process.on('unhandledRejection', (reason) => {
    logger.error(`[UNHANDLED REJECTION] ${reason}`);
  });

  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 Servidor rodando na porta ${port} [${nodeEnv}]`);
  logger.log(`🔒 Modo seguro: ${isProd ? 'PRODUÇÃO' : 'DESENVOLVIMENTO'}`);
}

bootstrap().catch((err) => {
  console.error('Falha crítica ao iniciar a aplicação:', err);
  process.exit(1);
});
