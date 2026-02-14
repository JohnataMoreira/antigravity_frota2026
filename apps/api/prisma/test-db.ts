import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
});

async function main() {
    console.log('Testing connection to:', process.env.DATABASE_URL);
    try {
        await prisma.$connect();
        console.log('Successfully connected to the database!');
        const orgCount = await prisma.organization.count();
        console.log('Organization count:', orgCount);
    } catch (error) {
        console.error('Connection failed:');
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
