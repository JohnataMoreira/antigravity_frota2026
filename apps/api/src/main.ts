import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
    try {
        const app = await NestFactory.create(AppModule);

        // Swagger Configuration
        const config = new DocumentBuilder()
            .setTitle('Frota2026 API')
            .setDescription('Documentação das rotas do sistema de Gestão de Frotas')
            .setVersion('1.0')
            .addBearerAuth()
            .build();
        const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup('api/docs', app, document);

        app.enableCors({
            origin: true, // Allow all temporarily for debugging
            methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
            credentials: true,
        });
        app.setGlobalPrefix('api');
        app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

        const port = process.env.PORT || 3000;
        await app.listen(port);
        console.log(`API running on port ${port}`);
    } catch (error) {
        console.error('CRITICAL ERROR DURING BOOTSTRAP:');
        console.error(error);
        process.exit(1);
    }
}
bootstrap();
