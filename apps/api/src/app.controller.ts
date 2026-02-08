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
    @Get('health/debug')
    async debugCheck() {
        // Test bcrypt
        const bcrypt = require('bcrypt');
        const hash = await bcrypt.hash('test', 10);

        return {
            status: 'ok',
            bcrypt: !!hash,
            timestamp: new Date().toISOString()
        };
    }
}
