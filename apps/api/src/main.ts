import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { SentryInterceptor } from './common/interceptors/sentry.interceptor';

async function bootstrap() {
    // Sentry Early Initialization
    if (process.env.SENTRY_DSN) {
        Sentry.init({
            dsn: process.env.SENTRY_DSN,
            environment: process.env.NODE_ENV || 'development',
            integrations: [
                nodeProfilingIntegration(),
            ],
            // Performance Monitoring
            tracesSampleRate: 1.0,
            // Set sampling rate for profiling - this is relative to tracesSampleRate
            profilesSampleRate: 1.0,
        });
        console.log('[Sentry] Initialized');
    }

    try {
        const app = await NestFactory.create(AppModule);

        if (process.env.SENTRY_DSN) {
            app.useGlobalInterceptors(new SentryInterceptor());
        }

        // CORS Configuration - Must come before Helmet for proper Preflight handling
        app.enableCors({
            origin: (origin, callback) => {
                const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [];
                if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production' || allowedOrigins.length === 0) {
                    callback(null, true);
                } else {
                    console.warn(`[CORS] Origin ${origin} blocked`);
                    callback(new Error('Not allowed by CORS'));
                }
            },
            methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
            credentials: true,
            preflightContinue: false,
            optionsSuccessStatus: 204,
        });

        // Security Headers
        app.use(helmet({
            crossOriginEmbedderPolicy: false,
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                    fontSrc: ["'self'", "https://fonts.gstatic.com"],
                    imgSrc: ["'self'", "data:", "https://*"],
                    connectSrc: ["'self'", "https://*", "http://*"], // Support local network for mobile debugging
                },
            },
        }));

        // Swagger Configuration
        const config = new DocumentBuilder()
            .setTitle('Frota2026 API')
            .setDescription('Documentação das rotas do sistema de Gestão de Frotas')
            .setVersion('1.0')
            .addBearerAuth()
            .build();
        const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup('api/docs', app, document);

        app.enableShutdownHooks();
        app.setGlobalPrefix('api');
        app.enableVersioning({
            type: VersioningType.URI,
            defaultVersion: '1',
        });
        app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

        const port = process.env.PORT || 3000;
        await app.listen(port, '0.0.0.0');
        console.log(`API running on port ${port}`);
    } catch (error) {
        console.error('CRITICAL ERROR DURING BOOTSTRAP:');
        console.error(error);
        process.exit(1);
    }
}
bootstrap();
