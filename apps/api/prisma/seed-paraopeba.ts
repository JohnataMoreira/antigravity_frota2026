import {
    PrismaClient,
    VehicleType,
    VehicleStatus,
    JourneyStatus,
    Role,
    FuelType,
    PaymentMethod,
    MaintenanceType,
    MaintenanceStatus,
    ChecklistType,
    TyreStatus,
    AttachmentType,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ─── Helpers ───────────────────────────────────────────────

const firstNames = ['João', 'Maria', 'José', 'Ana', 'Carlos', 'Paulo', 'Antônio', 'Marcos', 'Luiz', 'Gabriel', 'Rafael', 'Daniel', 'Marcelo', 'Fernando', 'Ricardo', 'Lucas', 'André', 'Roberto', 'Bruno', 'Tiago', 'Rodrigo', 'Sandro', 'Fabiano', 'Renato', 'Juliana', 'Camila', 'Fernanda', 'Patrícia', 'Aline', 'Sandra', 'Regina', 'Sônia', 'Marcia', 'Cláudia', 'Letícia', 'Tatiana', 'Vanessa', 'Beatriz', 'Bárbara', 'Priscila'];
const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa', 'Rocha', 'Dias', 'Nascimento', 'Andrade', 'Moreira', 'Nunes', 'Marques', 'Machado', 'Mendes', 'Freitas'];

const carModels = [
    { brand: 'Fiat', model: 'Strada' }, { brand: 'Fiat', model: 'Toro' }, { brand: 'Fiat', model: 'Argo' },
    { brand: 'VW', model: 'Gol' }, { brand: 'VW', model: 'Saveiro' }, { brand: 'VW', model: 'Amarok' },
    { brand: 'GM', model: 'Onix' }, { brand: 'GM', model: 'S10' }, { brand: 'Toyota', model: 'Hilux' },
    { brand: 'Ford', model: 'Ranger' }, { brand: 'Hyundai', model: 'HB20' }, { brand: 'Jeep', model: 'Renegade' },
];
const truckModels = [
    { brand: 'Scania', model: 'R450' }, { brand: 'Scania', model: 'G440' },
    { brand: 'Volvo', model: 'FH540' }, { brand: 'Volvo', model: 'VM270' },
    { brand: 'Mercedes', model: 'Actros 2651' }, { brand: 'Mercedes', model: 'Axor 2544' },
    { brand: 'Iveco', model: 'S-Way' }, { brand: 'Volkswagen', model: 'Meteor' },
];
const machineModels = [
    { brand: 'Caterpillar', model: '320 Next Gen' }, { brand: 'Caterpillar', model: '924K' },
    { brand: 'Komatsu', model: 'PC200' }, { brand: 'John Deere', model: '620G' },
    { brand: 'New Holland', model: 'B95B' }, { brand: 'Case', model: '580N' },
];
const bikeModels = [
    { brand: 'Honda', model: 'Bros 160' }, { brand: 'Honda', model: 'XRE 300' },
    { brand: 'Yamaha', model: 'Lander 250' }, { brand: 'Yamaha', model: 'Ténéré 250' },
];

const tyreBrands = ['Michelin', 'Pirelli', 'Goodyear', 'Bridgestone', 'Continental', 'Firestone'];
const tyreSizes = {
    CAR: ['205/55R16', '185/65R15', '195/55R15', '225/45R17'],
    TRUCK: ['295/80R22.5', '275/80R22.5', '315/80R22.5', '12.00R20'],
    MOTORCYCLE: ['100/90-17', '120/80-18', '90/90-21'],
    MACHINE: ['17.5-25', '23.5-25', '20.5-25'],
};

const incidentDescriptions = [
    'Pneu furado na rodovia BR-381',
    'Superaquecimento do motor na via de acesso',
    'Farol dianteiro queimado',
    'Problema no sistema de freios',
    'Vazamento de óleo identificado',
    'Colisão leve em manobra de estacionamento',
    'Vidro trincado por pedra na estrada',
    'Desgaste excessivo no sistema de embreagem',
    'Falha no sistema elétrico',
    'Vazamento no sistema de arrefecimento',
    'Excesso de velocidade detectado pelo rastreador',
    'Desvio de rota não autorizado',
];

const locations: { lat: number; lng: number; name: string }[] = [
    { lat: -19.9208, lng: -43.9378, name: 'Belo Horizonte, MG' },
    { lat: -23.5505, lng: -46.6333, name: 'São Paulo, SP' },
    { lat: -22.9068, lng: -43.1729, name: 'Rio de Janeiro, RJ' },
    { lat: -19.7616, lng: -43.8572, name: 'Contagem, MG' },
    { lat: -19.8886, lng: -44.1014, name: 'Betim, MG' },
    { lat: -20.3894, lng: -43.5037, name: 'Ouro Preto, MG' },
    { lat: -18.7264, lng: -44.4235, name: 'Sete Lagoas, MG' },
    { lat: -18.8508, lng: -41.9451, name: 'Governador Valadares, MG' },
    { lat: -16.6869, lng: -43.8366, name: 'Montes Claros, MG' },
    { lat: -20.7546, lng: -42.8825, name: 'Viçosa, MG' },
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

function daysAgo(days: number): Date {
    const d = new Date();
    d.setDate(d.getDate() - days);
    d.setHours(randInt(6, 22), randInt(0, 59));
    return d;
}

function randomDateInRange(start: Date, end: Date): Date {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// ─── Main Seed ─────────────────────────────────────────────

async function main() {
    console.log('🏁 Iniciando Grande Simulação: Grupo Paraopeba');
    console.log('📅 Gerando 12 meses de histórico (mar/2025 — fev/2026)');
    const t0 = Date.now();

    const passwordHash = await bcrypt.hash('123456', 10);
    const historyStart = new Date('2025-03-01');
    const now = new Date('2026-02-19');

    // ────────────────────────────────────────
    // 1. ORGANIZAÇÃO
    // ────────────────────────────────────────
    const org = await prisma.organization.upsert({
        where: { document: '12.345.678/0001-90' },
        update: {},
        create: { name: 'Grupo Paraopeba S.A.', document: '12.345.678/0001-90' },
    });

    // ────────────────────────────────────────
    // 2. USUÁRIOS (350)
    // ────────────────────────────────────────
    console.log('👥 Gerando 350 usuários...');
    const users: { id: string; role: string }[] = [];

    // Admin + 10 Gestores
    for (let i = 0; i < 11; i++) {
        const u = await prisma.user.upsert({
            where: { email: i === 0 ? 'admin@paraopeba.com.br' : `gestor${i}@paraopeba.com.br` },
            update: { organizationId: org.id },
            create: {
                name: `${pick(firstNames)} ${pick(lastNames)}`,
                email: i === 0 ? 'admin@paraopeba.com.br' : `gestor${i}@paraopeba.com.br`,
                passwordHash,
                role: Role.ADMIN,
                organizationId: org.id,
            },
        });
        users.push({ id: u.id, role: u.role });
    }

    // 339 Motoristas
    for (let i = 0; i < 339; i++) {
        const u = await prisma.user.upsert({
            where: { email: `motorista${i}@paraopeba.com.br` },
            update: { organizationId: org.id },
            create: {
                name: `${pick(firstNames)} ${pick(lastNames)}`,
                email: `motorista${i}@paraopeba.com.br`,
                passwordHash,
                role: Role.DRIVER,
                organizationId: org.id,
                licenseNumber: `${randInt(1, 9)}00${randInt(1000000, 9999999)}`,
                phone: `(31) 9${randInt(1000, 9999)}-${randInt(1000, 9999)}`,
            },
        });
        users.push({ id: u.id, role: u.role });
        if (i % 100 === 0) console.log(`   > ${i} motoristas...`);
    }

    const drivers = users.filter(u => u.role === 'DRIVER');

    // ────────────────────────────────────────
    // 3. VEÍCULOS (200)
    // ────────────────────────────────────────
    console.log('🚗 Gerando 200 veículos...');
    const vehicles: { id: string; type: string; currentKm: number }[] = [];
    const typeDistribution: [VehicleType, number, typeof carModels][] = [
        [VehicleType.CAR, 80, carModels],
        [VehicleType.TRUCK, 80, truckModels],
        [VehicleType.MOTORCYCLE, 20, bikeModels],
        [VehicleType.MACHINE, 20, machineModels],
    ];

    for (const [type, count, models] of typeDistribution) {
        for (let i = 0; i < count; i++) {
            const m = pick(models);
            const plate = generatePlate();
            const currentKm = type === VehicleType.MACHINE ? randInt(500, 8000) : randInt(5000, 300000);

            const v = await prisma.vehicle.upsert({
                where: { organizationId_plate: { organizationId: org.id, plate } },
                update: {},
                create: {
                    plate,
                    model: m.model,
                    brand: m.brand,
                    type,
                    currentKm,
                    status: VehicleStatus.AVAILABLE,
                    fuelLevel: randFloat(15, 100),
                    year: randInt(2018, 2026),
                    organizationId: org.id,
                },
            });
            vehicles.push({ id: v.id, type: v.type, currentKm: v.currentKm });
        }
    }

    // ────────────────────────────────────────
    // 4. JORNADAS (500 — 12 meses de histórico)
    // ────────────────────────────────────────
    console.log('🛣️ Simulando 500 jornadas (12 meses)...');
    const journeys: { id: string; vehicleId: string; driverId: string; startTime: Date; endTime: Date | null; status: string; startKm: number }[] = [];

    for (let i = 0; i < 500; i++) {
        const vehicle = pick(vehicles);
        const driver = pick(drivers);
        const isCompleted = i < 440;
        const isActive = i >= 440 && i < 480;
        // Rest are CANCELED

        const startTime = isActive
            ? daysAgo(randInt(0, 1))
            : randomDateInRange(historyStart, now);

        const durationMs = randInt(1, 12) * 3600000;
        const endTime = isCompleted ? new Date(startTime.getTime() + durationMs) : null;
        const startKm = Math.max(vehicle.currentKm - randInt(50, 800), 0);
        const endKm = isCompleted ? startKm + randInt(30, 500) : null;

        const status = isCompleted
            ? JourneyStatus.COMPLETED
            : isActive
                ? JourneyStatus.IN_PROGRESS
                : JourneyStatus.CANCELED;

        const startLoc = pick(locations);
        const endLoc = pick(locations);

        const j = await prisma.journey.create({
            data: {
                organizationId: org.id,
                driverId: driver.id,
                vehicleId: vehicle.id,
                status,
                startKm,
                endKm,
                startTime,
                endTime,
                startLocation: { lat: startLoc.lat, lng: startLoc.lng, address: startLoc.name },
                endLocation: isCompleted ? { lat: endLoc.lat, lng: endLoc.lng, address: endLoc.name } : undefined,
                plannedRoute: [[startLoc.lat, startLoc.lng], [endLoc.lat, endLoc.lng]],
            },
        });
        journeys.push({ id: j.id, vehicleId: vehicle.id, driverId: driver.id, startTime, endTime, status: j.status, startKm });

        if (i % 100 === 0) console.log(`   > ${i} jornadas...`);
    }

    // Mark active vehicles
    const activeJourneys = journeys.filter(j => j.status === 'IN_PROGRESS');
    for (const aj of activeJourneys) {
        await prisma.vehicle.update({ where: { id: aj.vehicleId }, data: { status: VehicleStatus.IN_USE } });
    }

    // ────────────────────────────────────────
    // 5. CHECKLISTS (400 — checkout/checkin pairs)
    // ────────────────────────────────────────
    console.log('✅ Gerando 400 checklists...');
    const completedJourneys = journeys.filter(j => j.status === 'COMPLETED');

    for (let i = 0; i < Math.min(200, completedJourneys.length); i++) {
        const j = completedJourneys[i];
        const items = [
            { itemId: 'pneus', status: Math.random() > 0.08 ? 'OK' : 'ISSUE', notes: '' },
            { itemId: 'freios', status: Math.random() > 0.05 ? 'OK' : 'ISSUE', notes: '' },
            { itemId: 'farois', status: Math.random() > 0.1 ? 'OK' : 'ISSUE', notes: '' },
            { itemId: 'fluidos', status: Math.random() > 0.12 ? 'OK' : 'ISSUE', notes: '' },
            { itemId: 'documentos', status: Math.random() > 0.02 ? 'OK' : 'ISSUE', notes: '' },
            { itemId: 'extintor', status: Math.random() > 0.05 ? 'OK' : 'ISSUE', notes: '' },
        ];

        // Checkout
        await prisma.checklist.create({
            data: {
                journeyId: j.id,
                type: ChecklistType.CHECKOUT,
                items,
                rating: randInt(3, 5),
                createdAt: new Date(j.startTime.getTime() - 15 * 60000),
            },
        });

        // Checkin (if ended)
        if (j.endTime) {
            await prisma.checklist.create({
                data: {
                    journeyId: j.id,
                    type: ChecklistType.CHECKIN,
                    items,
                    rating: randInt(2, 5),
                    createdAt: new Date(j.endTime.getTime() + 10 * 60000),
                },
            });
        }
    }

    // ────────────────────────────────────────
    // 6. INCIDENTES (100 — ~20% das jornadas)
    // ────────────────────────────────────────
    console.log('⚠️ Gerando ~100 incidentes...');
    let incidentCount = 0;
    for (const j of completedJourneys) {
        if (Math.random() > 0.22 || incidentCount >= 120) continue;

        const loc = pick(locations);
        await prisma.incident.create({
            data: {
                organizationId: org.id,
                driverId: j.driverId,
                vehicleId: j.vehicleId,
                journeyId: j.id,
                description: pick(incidentDescriptions),
                severity: pick(['LOW', 'MEDIUM', 'HIGH']),
                status: Math.random() > 0.3 ? 'RESOLVED' : 'OPEN',
                location: { lat: loc.lat, lng: loc.lng },
                isDriverAtFault: Math.random() > 0.7,
                createdAt: j.startTime,
            },
        });
        incidentCount++;
    }
    console.log(`   > ${incidentCount} incidentes criados`);

    // ────────────────────────────────────────
    // 7. ABASTECIMENTOS (600 — ~40% das jornadas + extras)
    // ────────────────────────────────────────
    console.log('⛽ Gerando ~600 abastecimentos...');
    let fuelCount = 0;
    for (const j of completedJourneys) {
        if (Math.random() > 0.55 || fuelCount >= 600) continue;

        const v = vehicles.find(v => v.id === j.vehicleId)!;
        const liters = randFloat(15, 80);
        const ppl = v.type === 'TRUCK' ? randFloat(5.5, 7.2) : randFloat(5.0, 6.8);

        await prisma.fuelEntry.create({
            data: {
                organizationId: org.id,
                vehicleId: j.vehicleId,
                driverId: j.driverId,
                journeyId: j.id,
                date: j.startTime,
                km: j.startKm + randInt(10, 100),
                liters,
                pricePerLiter: ppl,
                totalValue: parseFloat((liters * ppl).toFixed(2)),
                fuelType: v.type === 'TRUCK' ? FuelType.DIESEL : pick([FuelType.GASOLINE, FuelType.ETHANOL]),
                paymentMethod: pick([PaymentMethod.FUEL_CARD, PaymentMethod.CREDIT_CARD, PaymentMethod.INVOICED, PaymentMethod.PIX]),
            },
        });
        fuelCount++;
    }
    console.log(`   > ${fuelCount} abastecimentos`);

    // ────────────────────────────────────────
    // 8. MANUTENÇÕES (150)
    // ────────────────────────────────────────
    console.log('🔧 Gerando 150 manutenções...');
    for (let i = 0; i < 150; i++) {
        const v = pick(vehicles);
        const isFinished = Math.random() > 0.3;
        const scheduledDate = randomDateInRange(historyStart, now);
        const cost = isFinished ? randFloat(200, 3500) : null;

        await prisma.maintenance.create({
            data: {
                organizationId: org.id,
                vehicleId: v.id,
                type: pick([MaintenanceType.OIL, MaintenanceType.TIRES, MaintenanceType.INSPECTION, MaintenanceType.OTHER]),
                lastKm: Math.max(v.currentKm - randInt(3000, 10000), 0),
                nextDueKm: v.currentKm + randInt(5000, 15000),
                status: isFinished ? MaintenanceStatus.COMPLETED : MaintenanceStatus.PENDING,
                cost,
                performedAt: isFinished ? scheduledDate : null,
                notes: isFinished ? 'Serviço realizado conforme programação' : 'Aguardando agendamento',
            },
        });

        // 15% ficam em manutenção
        if (!isFinished && Math.random() < 0.15) {
            await prisma.vehicle.update({
                where: { id: v.id },
                data: { status: VehicleStatus.MAINTENANCE },
            });
        }
    }

    // ────────────────────────────────────────
    // 9. PNEUS (400 — instalados + estoque)
    // ────────────────────────────────────────
    console.log('🛞 Gerando 400 pneus...');
    const tyres: { id: string; vehicleId: string | null }[] = [];

    // Pneus instalados nos veículos (4 por veículo para carros/motos, 6 para caminhões)
    let tyreSeq = 1;
    for (const v of vehicles.slice(0, 150)) {
        const count = v.type === 'TRUCK' ? 6 : v.type === 'MOTORCYCLE' ? 2 : 4;
        const sizes = tyreSizes[v.type as keyof typeof tyreSizes] || tyreSizes.CAR;
        const size = pick(sizes);

        for (let p = 0; p < count; p++) {
            const t = await prisma.tyre.create({
                data: {
                    organizationId: org.id,
                    vehicleId: v.id,
                    identifier: `PNE-${String(tyreSeq++).padStart(4, '0')}`,
                    brand: pick(tyreBrands),
                    model: `${pick(['XZA', 'HSR', 'TR2', 'FR1', 'ST1'])} ${randInt(1, 3)}`,
                    size,
                    dot: `${randInt(1, 52).toString().padStart(2, '0')}${randInt(22, 25)}`,
                    status: TyreStatus.IN_USE,
                    currentKm: randInt(1000, 80000),
                    initialCost: randFloat(300, 1800),
                    axle: Math.ceil((p + 1) / 2),
                    position: p % 2 === 0 ? 'L' : 'R',
                },
            });
            tyres.push({ id: t.id, vehicleId: v.id });
        }
    }

    // Pneus em estoque (80 pneus extras)
    for (let i = 0; i < 80; i++) {
        const t = await prisma.tyre.create({
            data: {
                organizationId: org.id,
                vehicleId: null,
                identifier: `PNE-${String(tyreSeq++).padStart(4, '0')}`,
                brand: pick(tyreBrands),
                model: `${pick(['XZA', 'HSR', 'TR2', 'FR1', 'ST1'])} ${randInt(1, 3)}`,
                size: pick(tyreSizes.TRUCK),
                dot: `${randInt(1, 52).toString().padStart(2, '0')}${randInt(22, 25)}`,
                status: pick([TyreStatus.STOCK, TyreStatus.RETREADING, TyreStatus.SCRAP]),
                currentKm: randInt(0, 50000),
                initialCost: randFloat(400, 1600),
            },
        });
        tyres.push({ id: t.id, vehicleId: null });
    }
    console.log(`   > ${tyres.length} pneus criados`);

    // ────────────────────────────────────────
    // 10. MOVIMENTAÇÕES DE PNEUS (200)
    // ────────────────────────────────────────
    console.log('📦 Gerando 200 movimentações de pneus...');
    for (let i = 0; i < 200; i++) {
        const tyre = pick(tyres);
        const veh = tyre.vehicleId ? vehicles.find(v => v.id === tyre.vehicleId) : pick(vehicles);

        await prisma.tyreMovement.create({
            data: {
                organizationId: org.id,
                tyreId: tyre.id,
                vehicleId: veh?.id,
                type: pick(['INSTALL', 'REMOVE', 'ROTATION', 'RETREAD', 'SCRAP']),
                km: veh ? veh.currentKm - randInt(0, 5000) : 0,
                tyreKm: randInt(0, 60000),
                axle: randInt(1, 3),
                position: pick(['L', 'R', 'LI', 'RI']),
                notes: Math.random() > 0.6 ? 'Movimentação programada' : null,
                createdAt: randomDateInRange(historyStart, now),
            },
        });
    }

    // ────────────────────────────────────────
    // 11. MEDIÇÕES DE PNEUS (300)
    // ────────────────────────────────────────
    console.log('📏 Gerando 300 medições de pneus...');
    for (let i = 0; i < 300; i++) {
        const tyre = pick(tyres);
        await prisma.tyreMeasurement.create({
            data: {
                organizationId: org.id,
                tyreId: tyre.id,
                treadDepth: randFloat(2, 15),
                pressure: randFloat(80, 120),
                km: randInt(1000, 80000),
                measuredAt: randomDateInRange(historyStart, now),
                measuredById: pick(drivers).id,
            },
        });
    }

    // ────────────────────────────────────────
    // RESUMO
    // ────────────────────────────────────────
    const duration = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`\n✨ Simulação CONCLUÍDA em ${duration}s!`);
    console.log('──────────────────────────────────────────');
    console.log(`🏢 1 Organização: ${org.name}`);
    console.log(`👥 350 Usuários (1 Admin, 10 Gestores, 339 Motoristas)`);
    console.log(`🚗 200 Veículos (80 Carros, 80 Caminhões, 20 Motos, 20 Máquinas)`);
    console.log(`🛣️ 500 Jornadas (440 Concluídas, 40 Ativas, 20 Canceladas)`);
    console.log(`✅ ~400 Checklists (Saída + Retorno)`);
    console.log(`⚠️ ~${incidentCount} Incidentes`);
    console.log(`⛽ ~${fuelCount} Abastecimentos`);
    console.log(`🔧 150 Manutenções`);
    console.log(`🛞 ${tyres.length} Pneus`);
    console.log(`📦 200 Movimentações de Pneus`);
    console.log(`📏 300 Medições de Pneus`);
    console.log(`📅 Período: mar/2025 — fev/2026`);
    console.log('──────────────────────────────────────────');
    console.log('🔑 Login: admin@paraopeba.com.br | Senha: 123456');
    console.log('📋 CNPJ: 12.345.678/0001-90');
}

main()
    .catch((e) => {
        console.error('❌ Erro no seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
