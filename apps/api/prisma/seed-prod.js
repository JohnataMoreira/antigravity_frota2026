const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    console.log('🏁 Iniciando Seed de Produção (Simplificado)...');

    const passwordHash = await bcrypt.hash('123456', 10);

    // 1. Organization
    const org = await prisma.organization.upsert({
        where: { document: '12.345.678/0001-90' },
        update: {},
        create: { name: 'Grupo Paraopeba S.A.', document: '12.345.678/0001-90' },
    });

    // 2. Admin User
    await prisma.user.upsert({
        where: { email: 'admin@paraopeba.com.br' },
        update: { organizationId: org.id },
        create: {
            name: 'Administrador Paraopeba',
            email: 'admin@paraopeba.com.br',
            passwordHash,
            role: 'ADMIN',
            organizationId: org.id,
        },
    });

    console.log('✅ Seed finalizado com sucesso!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
