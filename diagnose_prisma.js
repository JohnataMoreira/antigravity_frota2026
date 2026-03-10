const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function run() {
    console.log('--- DIAGNOSTIC START ---');
    try {
        const email = 'admin@paraopeba.com.br';
        console.log(`1. Testing findUnique WITHOUT include for: ${email}`);
        const user = await p.user.findUnique({ where: { email } });
        console.log('USER_SIMPLE_OK:', user ? user.id : 'NOT_FOUND');

        console.log('2. Testing organization.findMany()');
        const orgs = await p.organization.findMany({ take: 1 });
        console.log('ORGS_OK:', orgs.length);

        if (user) {
            console.log('3. Testing findUnique WITH include');
            const userFull = await p.user.findUnique({
                where: { id: user.id },
                include: { organization: true }
            });
            console.log('USER_FULL_OK:', userFull.organization ? userFull.organization.name : 'NO_ORG');
        }
    } catch (e) {
        console.error('DIAGNOSTIC_ERROR:', e.message);
        console.error('STACK:', e.stack);
    } finally {
        await p.$disconnect();
    }
}

run();
