import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
    try {
        const app = await NestFactory.create(AppModule);

        app.enableCors({
            origin: [
                'https://frota.johnatamoreira.com.br',
                'http://localhost:5173',
                'http://localhost:4173'
            ],
            methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
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
