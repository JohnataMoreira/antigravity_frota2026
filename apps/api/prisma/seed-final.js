const { PrismaClient, Role, VehicleType, VehicleStatus, JourneyStatus, ChecklistType, MaintenanceType, MaintenanceStatus } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Iniciando Seed Final (20 Func, 50 Veic, 30 Jorn)...');
    const t0 = Date.now();
    const hash = await bcrypt.hash('123456', 10);
    const now = new Date();

    const org = await prisma.organization.upsert({
        where: { document: '12.345.678/0001-90' },
        update: {},
        create: { name: 'Grupo Paraopeba S.A.', document: '12.345.678/0001-90' }
    });

    console.log('🧹 Limpando dados antigos...');
    await prisma.journey.deleteMany({ where: { organizationId: org.id } });
    await prisma.vehicle.deleteMany({ where: { organizationId: org.id } });
    await prisma.maintenance.deleteMany({ where: { organizationId: org.id } });
    await prisma.user.deleteMany({ where: { organizationId: org.id, role: Role.DRIVER } });

    console.log('👥 Criando 20 usuários...');
    await prisma.user.upsert({
        where: { email: 'admin@paraopeba.com.br' },
        update: { organizationId: org.id },
        create: { name: 'Admin Paraopeba', email: 'admin@paraopeba.com.br', passwordHash: hash, role: Role.ADMIN, organizationId: org.id }
    });

    const drivers = [];
    for (let i = 1; i <= 19; i++) {
        drivers.push({
            name: 'Motorista ' + i,
            email: 'motorista' + i + '@paraopeba.com.br',
            passwordHash: hash,
            role: Role.DRIVER,
            organizationId: org.id
        });
    }
    await prisma.user.createMany({ data: drivers });
    const dbDrivers = await prisma.user.findMany({ where: { organizationId: org.id, role: Role.DRIVER } });

    console.log('🚗 Criando 50 veículos...');
    const vehiclesData = [];
    for (let i = 1; i <= 50; i++) {
        vehiclesData.push({
            plate: 'ABC' + (1000 + i),
            model: i % 2 === 0 ? 'Scania R450' : 'Fiat Strada',
            brand: i % 2 === 0 ? 'Scania' : 'Fiat',
            type: i % 2 === 0 ? VehicleType.TRUCK : VehicleType.CAR,
            currentKm: 50000 + (i * 100),
            status: VehicleStatus.AVAILABLE,
            organizationId: org.id
        });
    }
    await prisma.vehicle.createMany({ data: vehiclesData });
    const dbVehicles = await prisma.vehicle.findMany({ where: { organizationId: org.id } });

    console.log('🛣️ Criando 30 jornadas...');
    for (let i = 1; i <= 30; i++) {
        const v = dbVehicles[i % dbVehicles.length];
        const d = dbDrivers[i % dbDrivers.length];
        const start = new Date(now.getTime() - (i * 24 * 3600000));
        await prisma.journey.create({
            data: {
                organizationId: org.id,
                driverId: d.id,
                vehicleId: v.id,
                status: JourneyStatus.COMPLETED,
                startKm: v.currentKm - 500,
                endKm: v.currentKm - 100,
                startTime: start,
                endTime: new Date(start.getTime() + 8 * 3600000),
                checklists: {
                    create: [{
                        type: ChecklistType.CHECKOUT,
                        items: [{ itemId: 'pneus', status: 'OK' }],
                        rating: 5,
                        createdAt: start
                    }]
                }
            }
        });
    }

    console.log('\n✨ Seed finalizado com sucesso em ' + ((Date.now() - t0) / 1000).toFixed(1) + 's');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
