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
        let dbError = null;
        try {
            await this.prisma.$queryRaw`SELECT 1`;
            dbOk = true;
        } catch (e: any) {
            dbError = e.message;
        }

        // Test Registration Logic Simulation (Transaction)
        let regStep = 'start';
        let regError = null;
        try {
            await this.prisma.$transaction(async (tx) => {
                regStep = 'org-create';
                const tempDoc = 'test-' + Date.now();
                const org = await tx.organization.create({
                    data: { name: 'Test Org', document: tempDoc }
                });
                regStep = 'user-create';
                await tx.user.create({
                    data: {
                        organizationId: org.id,
                        email: 'test-' + Date.now() + '@test.ia',
                        name: 'Test Admin',
                        passwordHash: hash,
                        role: 'ADMIN'
                    }
                });
                regStep = 'rolling-back';
                throw new Error('ROLLBACK_FOR_TEST');
            });
        } catch (e: any) {
            if (e.message !== 'ROLLBACK_FOR_TEST') {
                regError = `Step: ${regStep}, Error: ${e.message}`;
            }
        }

        return {
            status: 'ok',
            bcrypt: !!hash,
            database: dbOk,
            dbError,
            regSimError: regError,
            timestamp: new Date().toISOString()
        };
    }
}
