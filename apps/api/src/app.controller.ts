import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/public.decorator';

@Controller()
export class AppController {
    @Public()
    @Get('health')
    healthCheck() {
        return { status: 'ok', timestamp: new Date().toISOString() };
    }

    @Public()
    @Get()
    root() {
        return {
            message: 'Frota2026 API is running',
            health: '/api/health',
            timestamp: new Date().toISOString()
        };
    }
}
