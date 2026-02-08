import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/public.decorator';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
    constructor(private prisma: PrismaService) { }

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

        // Test DB
        let dbOk = false;
        try {
            await this.prisma.$queryRaw`SELECT 1`;
            dbOk = true;
        } catch (e) {
            console.error('DB Debug Error', e);
        }

        return {
            status: 'ok',
            bcrypt: !!hash,
            database: dbOk,
            timestamp: new Date().toISOString()
        };
    }
}
