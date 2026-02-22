import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';

async function bootstrap() {
    const logger = new Logger('Bootstrap');

    try {
        const app = await NestFactory.create(AppModule, {
            abortOnError: false,
        });

        const configService = app.get(ConfigService);
        const isProd = configService.get('NODE_ENV') === 'production';

        // ─────────────────────────────────────────────
        // SEGURANÇA: Headers HTTP via Helmet
        // ─────────────────────────────────────────────
        app.use(helmet());

        // ─────────────────────────────────────────────
        // CORS — Whitelist de origens
        // ─────────────────────────────────────────────
        const allowedOrigins = configService.get<string>('ALLOWED_ORIGINS', 'http://localhost:3001')
            .split(',')
            .map(o => o.trim());

        app.enableCors({
            origin: (origin, callback) => {
                if (!origin || allowedOrigins.includes(origin) || !isProd) {
                    callback(null, true);
                } else {
                    callback(new Error(`Origin ${origin} not allowed by CORS`));
                }
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
        });

        // ─────────────────────────────────────────────
        // COOKIES, COMPRESSÃO, VERSIONAMENTO
        // ─────────────────────────────────────────────
        app.use(cookieParser(configService.get('COOKIE_SECRET')));
        app.use(compression());
        app.setGlobalPrefix('api');
        app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

        // ─────────────────────────────────────────────
        // VALIDAÇÃO GLOBAL
        // ─────────────────────────────────────────────
        app.useGlobalPipes(new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: { enableImplicitConversion: true },
            disableErrorMessages: isProd,
        }));

        // ─────────────────────────────────────────────
        // FILTROS E INTERCEPTORS GLOBAIS
        // ─────────────────────────────────────────────
        app.useGlobalFilters(new AllExceptionsFilter(configService));
        app.useGlobalInterceptors(
            new LoggingInterceptor(),
            new TimeoutInterceptor(30000),
        );

        // Swagger Configuration
        const config = new DocumentBuilder()
            .setTitle('Frota2026 API')
            .setDescription('Documentação das rotas do sistema de Gestão de Frotas')
            .setVersion('1.0')
            .addBearerAuth()
            .addCookieAuth('refresh_token')
            .build();
        const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup('api/docs', app, document);

        app.enableShutdownHooks();

        const port = configService.get('PORT') || 3000;
        await app.listen(port);
        logger.log(`API running on port ${port} [${configService.get('NODE_ENV')}]`);
    } catch (error) {
        logger.error('CRITICAL ERROR DURING BOOTSTRAP:', error);
        process.exit(1);
    }
}
bootstrap();
