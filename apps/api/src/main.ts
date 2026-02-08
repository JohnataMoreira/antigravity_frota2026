import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
    try {
        const app = await NestFactory.create(AppModule);

        app.enableCors();
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
