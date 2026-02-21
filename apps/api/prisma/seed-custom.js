const {
    PrismaClient,
    VehicleType,
    VehicleStatus,
    JourneyStatus,
    Role,
    FuelType,
    MaintenanceType,
    MaintenanceStatus,
    ChecklistType,
} = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const firstNames = ['João', 'Maria', 'José', 'Ana', 'Carlos', 'Paulo', 'Antônio', 'Marcos', 'Luiz', 'Gabriel', 'Rafael', 'Daniel', 'Marcelo', 'Fernando', 'Ricardo', 'Lucas', 'André', 'Roberto', 'Bruno', 'Tiago', 'Rodrigo', 'Sandro', 'Fabiano', 'Renato', 'Juliana', 'Camila', 'Fernanda', 'Patrícia', 'Aline', 'Sandra', 'Regina', 'Sônia', 'Marcia', 'Cláudia', 'Letícia', 'Tatiana', 'Vanessa', 'Beatriz', 'Bárbara', 'Priscila'];
const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa', 'Rocha', 'Dias', 'Nascimento', 'Andrade', 'Moreira', 'Nunes', 'Marques', 'Machado', 'Mendes', 'Freitas'];

const carModels = [
    { brand: 'Fiat', model: 'Strada' }, { brand: 'Fiat', model: 'Toro' }, { brand: 'VW', model: 'Saveiro' },
    { brand: 'GM', model: 'S10' }, { brand: 'Toyota', model: 'Hilux' }, { brand: 'Ford', model: 'Ranger' }
];
const truckModels = [
    { brand: 'Scania', model: 'R450' }, { brand: 'Volvo', model: 'FH540' },
    { brand: 'Mercedes', model: 'Actros 2651' }, { brand: 'Iveco', model: 'S-Way' }
];

function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePlate() {
    const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const N = '0123456789';
    let p = '';
    for (let i = 0; i < 3; i++) p += L[randInt(0, 25)];
    p += '-';
    for (let i = 0; i < 4; i++) p += N[randInt(0, 9)];
    return p;
}

async function main() {
    console.log('🏁 Iniciando Seed Customizado (20 funcionários, 50 veículos, 30 jornadas)...');
    const t0 = Date.now();

    const passwordHash = await bcrypt.hash('123456', 10);
    const now = new Date();

    const org = await prisma.organization.upsert({
        where: { document: '12.345.678/0001-90' },
        update: {},
        create: { name: 'Grupo Paraopeba S.A.', document: '12.345.678/0001-90' },
    });

    console.log('👥 Gerando 20 usuários...');
    await prisma.user.upsert({
        where: { email: 'admin@paraopeba.com.br' },
        update: { organizationId: org.id },
        create: {
            name: 'Administrador Paraopeba',
            email: 'admin@paraopeba.com.br',
            passwordHash,
            role: Role.ADMIN,
            organizationId: org.id,
        },
    });

    const drivers = [];
    for (let i = 0; i < 19; i++) {
        const email = `motorista${i}@paraopeba.com.br`;
        const u = await prisma.user.upsert({
            where: { email: email },
            update: { organizationId: org.id },
            create: {
                name: `${pick(firstNames)} ${pick(lastNames)}`,
                email: email,
                passwordHash,
                role: Role.DRIVER,
                organizationId: org.id,
            },
        });
        drivers.push(u);
    }

    console.log('🚗 Gerando 50 veículos...');
    const vehicles = [];
    for (let i = 0; i < 50; i++) {
        const type = i < 25 ? VehicleType.TRUCK : VehicleType.CAR;
        const models = type === VehicleType.TRUCK ? truckModels : carModels;
        const m = pick(models);
        const plate = generatePlate();
        const v = await prisma.vehicle.upsert({
            where: { organizationId_plate: { organizationId: org.id, plate } },
            update: {},
            create: {
                plate,
                model: m.model,
                brand: m.brand,
                type,
                currentKm: randInt(10000, 150000),
                status: VehicleStatus.AVAILABLE,
                organizationId: org.id,
            }
        });
        vehicles.push(v);
    }

    console.log('🛣️ Gerando 30 jornadas...');
    for (let i = 0; i < 30; i++) {
        const vehicle = pick(vehicles);
        const driver = pick(drivers);
        const startTime = new Date(now.getTime() - randInt(1, 30) * 24 * 3600000);
        const durationMs = randInt(2, 8) * 3600000;
        const endTime = new Date(startTime.getTime() + durationMs);

        await prisma.journey.create({
            data: {
                organizationId: org.id,
                driverId: driver.id,
                vehicleId: vehicle.id,
                status: JourneyStatus.COMPLETED,
                startKm: vehicle.currentKm - randInt(500, 1000),
                endKm: vehicle.currentKm - randInt(100, 400),
                startTime,
                endTime,
                checklists: {
                    create: [
                        {
                            type: ChecklistType.CHECKOUT,
                            items: [
                                { itemId: 'pneus', status: 'OK' },
                                { itemId: 'oleo', status: 'OK' }
                            ],
                            rating: 5,
                            createdAt: startTime
                        }
                    ]
                }
            }
        });
    }

    console.log('🔧 Gerando algumas manutenções...');
    for (let i = 0; i < 10; i++) {
        const vehicle = pick(vehicles);
        const date = new Date(now.getTime() - randInt(5, 60) * 24 * 3600000);
        await prisma.maintenance.create({
            data: {
                organizationId: org.id,
                vehicleId: vehicle.id,
                type: pick([MaintenanceType.OIL, MaintenanceType.INSPECTION]),
                status: MaintenanceStatus.COMPLETED,
                cost: randInt(200, 1500),
                performedAt: date,
            }
        });
    }

    console.log(`\n✨ Seed concluído em ${((Date.now() - t0) / 1000).toFixed(1)}s!`);
}

main()
    .catch((e) => {
        console.error('❌ Erro no seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
