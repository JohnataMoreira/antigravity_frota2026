import {
    PrismaClient,
    VehicleType,
    VehicleStatus,
    JourneyStatus,
    Role,
    FuelType,
    TransactionType,
    TransactionStatus,
    MaintenanceType,
    MaintenanceStatus,
    ChecklistType,
    TyreStatus,
    DocumentType,
    PurchaseOrderStatus
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const firstNames = ['João', 'Maria', 'José', 'Ana', 'Carlos', 'Paulo', 'Antônio', 'Marcos', 'Luiz', 'Gabriel', 'Rafael', 'Daniel', 'Marcelo', 'Fernando', 'Ricardo', 'Lucas', 'André', 'Roberto', 'Bruno', 'Tiago', 'Rodrigo', 'Sandro', 'Fabiano', 'Renato', 'Juliana', 'Camila', 'Fernanda', 'Patrícia', 'Aline', 'Sandra'];
const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa'];

const carModels = [
    { brand: 'Fiat', model: 'Strada' }, { brand: 'Fiat', model: 'Toro' }, { brand: 'VW', model: 'Saveiro' },
    { brand: 'GM', model: 'S10' }, { brand: 'Toyota', model: 'Hilux' }, { brand: 'Ford', model: 'Ranger' }
];
const truckModels = [
    { brand: 'Scania', model: 'R450' }, { brand: 'Volvo', model: 'FH540' },
    { brand: 'Mercedes', model: 'Actros 2651' }, { brand: 'Iveco', model: 'S-Way' }
];

function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number, dec = 2): number {
    return parseFloat((Math.random() * (max - min) + min).toFixed(dec));
}

function generatePlate(): string {
    const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const N = '0123456789';
    let p = '';
    for (let i = 0; i < 3; i++) p += L[randInt(0, 25)];
    p += '-';
    for (let i = 0; i < 4; i++) p += N[randInt(0, 9)];
    return p;
}

function randomDateInRange(start: Date, end: Date): Date {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seedOrganization(config: {
    name: string,
    document: string,
    emailPrefix: string,
    focus: 'TRUCKS' | 'LIGHT'
}) {
    console.log(`\n🏢 Povoando Organização: ${config.name}...`);
    const passwordHash = await bcrypt.hash('123456', 10);
    const now = new Date();
    const historyStart = new Date();
    historyStart.setMonth(now.getMonth() - 5); // 6 meses de histórico

    // 1. Organization
    const org = await prisma.organization.upsert({
        where: { document: config.document },
        update: {},
        create: { name: config.name, document: config.document },
    });

    // 2. Users
    const admin = await prisma.user.upsert({
        where: { email: `admin@${config.emailPrefix}.com.br` },
        update: { organizationId: org.id },
        create: {
            name: `Admin ${config.name}`,
            email: `admin@${config.emailPrefix}.com.br`,
            passwordHash,
            role: Role.ADMIN,
            organizationId: org.id,
        },
    });

    const drivers = [];
    for (let i = 1; i <= 10; i++) {
        const u = await prisma.user.upsert({
            where: { email: `driver${i}@${config.emailPrefix}.com.br` },
            update: { organizationId: org.id },
            create: {
                name: `${pick(firstNames)} ${pick(lastNames)}`,
                email: `driver${i}@${config.emailPrefix}.com.br`,
                passwordHash,
                role: Role.DRIVER,
                organizationId: org.id,
            },
        });
        drivers.push(u);
    }

    // 3. Vehicles
    const vehicles: any[] = [];
    for (let i = 0; i < 15; i++) {
        let type: VehicleType = VehicleType.CAR;
        if (config.focus === 'TRUCKS') {
            type = i < 12 ? VehicleType.TRUCK : VehicleType.CAR;
        } else {
            type = i < 3 ? VehicleType.TRUCK : VehicleType.CAR;
        }

        const models = type === VehicleType.TRUCK ? truckModels : carModels;
        const m = pick(models);
        const plate = generatePlate();

        const v = await prisma.vehicle.create({
            data: {
                plate,
                model: m.model,
                brand: m.brand,
                type,
                currentKm: randInt(5000, 150000),
                status: VehicleStatus.AVAILABLE,
                organizationId: org.id,
            }
        });
        vehicles.push(v);
    }

    // 4. Inventory & Suppliers
    const suppliers = [];
    for (let i = 1; i <= 3; i++) {
        suppliers.push(await prisma.supplier.create({
            data: { organizationId: org.id, name: `Fornecedor ${i} - ${config.name}`, category: 'PEÇAS' }
        }));
    }

    // 5. Historical Data (6 Months)
    for (let month = 0; month < 6; month++) {
        const monthDate = new Date(historyStart);
        monthDate.setMonth(monthDate.getMonth() + month);

        // Journeys (20 per month)
        for (let j = 0; j < 20; j++) {
            const v = pick(vehicles);
            const d = pick(drivers);
            const startTime = randomDateInRange(monthDate, new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0));
            if (startTime > now) continue;

            const journey = await prisma.journey.create({
                data: {
                    organizationId: org.id,
                    vehicleId: v.id,
                    driverId: d.id,
                    startKm: v.currentKm - randInt(500, 1000),
                    endKm: v.currentKm - randInt(0, 400),
                    startTime,
                    endTime: new Date(startTime.getTime() + randInt(1, 8) * 3600000),
                    status: JourneyStatus.COMPLETED
                }
            });

            // Random fuel entries
            if (Math.random() > 0.4) {
                const liters = randFloat(20, 80);
                const val = liters * 5.8;
                await prisma.fuelEntry.create({
                    data: {
                        organizationId: org.id,
                        vehicleId: v.id,
                        driverId: d.id,
                        journeyId: journey.id,
                        liters,
                        pricePerLiter: 5.8,
                        totalValue: val,
                        date: startTime,
                        km: journey.startKm,
                        fuelType: v.type === VehicleType.TRUCK ? FuelType.DIESEL : FuelType.GASOLINE
                    }
                });
            }
        }
    }

    console.log(`✅ ${config.name} povoada com sucesso!`);
}

async function main() {
    console.log('🚀 Iniciando Seeding Multi-tenant...');

    // Empresa 1: Foco Logístico (Caminhões)
    await seedOrganization({
        name: 'TransBrasil Logística Ltda',
        document: '22.333.444/0001-55',
        emailPrefix: 'transbrasil',
        focus: 'TRUCKS'
    });

    // Empresa 2: Mineração (Misto com máquinas/leves)
    await seedOrganization({
        name: 'Vale do Ouro Mineração S.A.',
        document: '55.666.777/0001-88',
        emailPrefix: 'valedoouro',
        focus: 'LIGHT'
    });

    console.log('\n✨ Seeding finalizado para todas as organizações!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
