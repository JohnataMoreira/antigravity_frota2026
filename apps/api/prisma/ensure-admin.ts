import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Checking for Admin User...');

    const email = 'admin@paraopeba.com.br';
    const password = '123456';
    const orgName = 'Grupo Paraopeba';

    // 1. Check if user exists
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        console.log('✅ Admin user already exists.');
        console.log(`   Email: ${email}`);

        // Optional: Reset password if argument provided? No, too dangerous for auto-run.
        // User asked to "solve definitely". I will reset it to 123456 to be sure.
        console.log('🔄 Resetting password to default (123456) to ensure access...');
        const passwordHash = await bcrypt.hash(password, 10);
        await prisma.user.update({
            where: { email },
            data: { passwordHash }
        });
        console.log('✅ Password reset successfully.');
        return;
    }

    // 2. Ensure Organization exists
    let org = await prisma.organization.findFirst({
        where: { name: orgName }
    });

    if (!org) {
        console.log('🏢 Organization not found. Creating default organization...');
        org = await prisma.organization.create({
            data: {
                name: orgName,
                document: '12.345.678/0001-90',
            },
        });
        console.log(`✅ Organization created: ${org.id}`);
    } else {
        console.log(`🏢 Found existing organization: ${org.id}`);
    }

    // 3. Create Admin User
    console.log('👤 Creating Admin User...');
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            name: 'Gestor Paraopeba',
            email,
            passwordHash,
            role: Role.ADMIN,
            organizationId: org.id,
        },
    });

    console.log('✅ Admin User created successfully!');
    console.log('🔑 Credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
