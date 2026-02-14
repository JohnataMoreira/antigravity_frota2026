import { PrismaClient, VehicleType, VehicleStatus, JourneyStatus, Role, FuelType, PaymentMethod, MaintenanceType, MaintenanceStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Helper Data
const firstNames = ['João', 'Maria', 'José', 'Ana', 'Carlos', 'Paulo', 'Antônio', 'Marcos', 'Luiz', 'Gabriel', 'Rafael', 'Daniel', 'Marcelo', 'Fernando', 'Ricardo', 'Lucas', 'André', 'Roberto', 'Bruno', 'Tiago', 'Rodrigo', 'Sandro', 'Fabiano', 'Renato', 'Juliana', 'Camila', 'Fernanda', 'Patrícia', 'Aline', 'Sandra', 'Regina', 'Sônia', 'Marcia', 'Cláudia', 'Letícia', 'Tatiana', 'Vanessa', 'Beatriz', 'Bárbara', 'Priscila'];
const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa', 'Rocha', 'Dias', 'Nascimento', 'Andrade', 'Moreira', 'Nunes', 'Marques', 'Machado', 'Mendes', 'Freitas'];

const carModels = [
    { brand: 'Fiat', model: 'Strada' }, { brand: 'Fiat', model: 'Toro' }, { brand: 'Fiat', model: 'Argo' },
    { brand: 'VW', model: 'Gol' }, { brand: 'VW', model: 'Saveiro' }, { brand: 'VW', model: 'Amarok' },
    { brand: 'GM', model: 'Onix' }, { brand: 'GM', model: 'S10' }, { brand: 'Toyota', model: 'Hilux' },
    { brand: 'Ford', model: 'Ranger' }, { brand: 'Hyundai', model: 'HB20' }, { brand: 'Jeep', model: 'Renegade' }
];

const truckModels = [
    { brand: 'Scania', model: 'R450' }, { brand: 'Scania', model: 'G440' },
    { brand: 'Volvo', model: 'FH540' }, { brand: 'Volvo', model: 'VM270' },
    { brand: 'Mercedes', model: 'Actros 2651' }, { brand: 'Mercedes', model: 'Axor 2544' },
    { brand: 'Iveco', model: 'S-Way' }, { brand: 'Volkswagen', model: 'Meteor' }
];

const machineModels = [
    { brand: 'Caterpillar', model: '320 Next Gen' }, { brand: 'Caterpillar', model: '924K' },
    { brand: 'Komatsu', model: 'PC200' }, { brand: 'John Deere', model: '620G' },
    { brand: 'New Holland', model: 'B95B' }, { brand: 'Case', model: '580N' }
];

const bikeModels = [
    { brand: 'Honda', model: 'Bros 160' }, { brand: 'Honda', model: 'XRE 300' },
    { brand: 'Yamaha', model: 'Lander 250' }, { brand: 'Yamaha', model: 'Ténéré 250' }
];

function getRandomItem(arr: any[]) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generatePlate() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    let plate = '';
    for (let i = 0; i < 3; i++) plate += letters[Math.floor(Math.random() * letters.length)];
    plate += '-';
    // Mercosul style or old style
    for (let i = 0; i < 4; i++) plate += numbers[Math.floor(Math.random() * numbers.length)];
    return plate;
}

async function main() {
    console.log('🏁 Iniciando Grande Simulação: Grupo Paraopeba');
    const startTime = Date.now();

    const passwordHash = await bcrypt.hash('123456', 10);

    // 1. Organização
    const org = await prisma.organization.upsert({
        where: { document: '12.345.678/0001-90' },
        update: {},
        create: {
            name: 'Grupo Paraopeba S.A.',
            document: '12.345.678/0001-90',
        },
    });

    // 2. Criar 350 Usuários
    console.log('👥 Gerando 350 usuários...');
    const users = [];

    // Admin e Gestores
    for (let i = 0; i < 11; i++) {
        const firstName = getRandomItem(firstNames);
        const lastName = getRandomItem(lastNames);
        const name = `${firstName} ${lastName}`;
        const email = i === 0 ? 'admin@paraopeba.com.br' : `gestor${i}@paraopeba.com.br`;

        users.push(await prisma.user.upsert({
            where: { email },
            update: { organizationId: org.id },
            create: {
                name,
                email,
                passwordHash,
                role: i === 0 ? Role.ADMIN : Role.ADMIN, // Most managers will be admins in this simulation
                organizationId: org.id,
            }
        }));
    }

    // Motoristas (339)
    for (let i = 0; i < 339; i++) {
        const firstName = getRandomItem(firstNames);
        const lastName = getRandomItem(lastNames);
        const name = `${firstName} ${lastName}`;
        const email = `motorista${i}@paraopeba.com.br`;

        users.push(await prisma.user.upsert({
            where: { email },
            update: { organizationId: org.id },
            create: {
                name,
                email,
                passwordHash,
                role: Role.DRIVER,
                organizationId: org.id,
                licenseNumber: `${Math.floor(Math.random() * 9)}00${Math.floor(Math.random() * 10000000)}`,
            }
        }));
        if (i % 50 === 0) console.log(`   > ${i} motoristas criados...`);
    }

    // 3. Criar 200 Veículos
    console.log('🚗 Gerando 200 veículos...');
    const vehicles = [];
    const typesCount = { [VehicleType.CAR]: 80, [VehicleType.TRUCK]: 80, [VehicleType.MOTORCYCLE]: 20, [VehicleType.MACHINE]: 20 };

    for (const [type, count] of Object.entries(typesCount)) {
        for (let i = 0; i < count; i++) {
            let modelData;
            if (type === VehicleType.CAR) modelData = getRandomItem(carModels);
            else if (type === VehicleType.TRUCK) modelData = getRandomItem(truckModels);
            else if (type === VehicleType.MOTORCYCLE) modelData = getRandomItem(bikeModels);
            else modelData = getRandomItem(machineModels);

            const plate = generatePlate();
            const v = await prisma.vehicle.upsert({
                where: { organizationId_plate: { organizationId: org.id, plate: plate } },
                update: {},
                create: {
                    plate: plate,
                    model: modelData.model,
                    brand: modelData.brand,
                    type: type as VehicleType,
                    currentKm: Math.floor(Math.random() * 200000) + 1000,
                    status: VehicleStatus.AVAILABLE,
                    organizationId: org.id,
                    year: 2018 + Math.floor(Math.random() * 7),
                }
            });
            vehicles.push(v);
        }
    }

    // 4. Simular 200 Jornadas
    console.log('🛣️ Simulando 200 jornadas e históricos...');
    const now = new Date();

    for (let i = 0; i < 200; i++) {
        const vehicle = getRandomItem(vehicles);
        const driver = getRandomItem(users.filter(u => u.role === Role.DRIVER));
        const isCompleted = i < 160;

        const startKm = vehicle.currentKm - (Math.floor(Math.random() * 500) + 50);
        const endKm = isCompleted ? startKm + (Math.floor(Math.random() * 300) + 20) : null;

        const startTime = new Date(now);
        startTime.setDate(now.getDate() - (Math.floor(Math.random() * 7))); // Up to 7 days ago
        startTime.setHours(Math.floor(Math.random() * 24));

        const journey = await prisma.journey.create({
            data: {
                organizationId: org.id,
                driverId: driver.id,
                vehicleId: vehicle.id,
                status: isCompleted ? JourneyStatus.COMPLETED : JourneyStatus.IN_PROGRESS,
                startKm,
                endKm,
                startTime,
                endTime: isCompleted ? new Date(startTime.getTime() + (Math.floor(Math.random() * 8) + 1) * 3600000) : null,
            }
        });

        // Abastecimento em ~40% das jornadas concluídas
        if (isCompleted && Math.random() < 0.4) {
            const liters = Math.floor(Math.random() * 50) + 20;
            const price = 5.2 + (Math.random() * 1.5);
            await prisma.fuelEntry.create({
                data: {
                    organizationId: org.id,
                    vehicleId: vehicle.id,
                    driverId: driver.id,
                    journeyId: journey.id,
                    date: journey.startTime,
                    km: startKm + 10,
                    liters,
                    pricePerLiter: price,
                    totalValue: liters * price,
                    fuelType: vehicle.type === VehicleType.TRUCK ? FuelType.DIESEL : (Math.random() > 0.5 ? FuelType.GASOLINE : FuelType.ETHANOL),
                    paymentMethod: getRandomItem([PaymentMethod.FUEL_CARD, PaymentMethod.CREDIT_CARD, PaymentMethod.INVOICED]),
                }
            });
        }

        // Manutenção em ~15% dos veículos aleatoriamente
        if (Math.random() < 0.15) {
            const isFinished = Math.random() > 0.3;
            await prisma.maintenance.create({
                data: {
                    organizationId: org.id,
                    vehicleId: vehicle.id,
                    type: getRandomItem([MaintenanceType.OIL, MaintenanceType.TIRES, MaintenanceType.INSPECTION]),
                    lastKm: startKm - 5000,
                    nextDueKm: startKm + 5000,
                    status: isFinished ? MaintenanceStatus.COMPLETED : MaintenanceStatus.PENDING,
                    cost: isFinished ? Math.floor(Math.random() * 1000) + 200 : null,
                    performedAt: isFinished ? journey.startTime : null,
                    notes: isFinished ? 'Manutenção preventiva realizada' : 'Aguardando agendamento',
                }
            });
            // Update vehicle status
            if (!isFinished) {
                await prisma.vehicle.update({
                    where: { id: vehicle.id },
                    data: { status: VehicleStatus.MAINTENANCE }
                });
            }
        }

        // Se estiver em progresso, atualizar veículo
        if (!isCompleted) {
            await prisma.vehicle.update({
                where: { id: vehicle.id },
                data: { status: VehicleStatus.IN_USE }
            });
        }

        if (i % 40 === 0) console.log(`   > ${i} jornadas processadas...`);
    }

    const duration = (Date.now() - startTime) / 1000;
    console.log(`\n✨ Simulação CONCLUÍDA em ${duration.toFixed(1)} segundos!`);
    console.log('--------------------------------------------------');
    console.log(`🏢 Organização: ${org.name}`);
    console.log(`👥 Usuários: 350 (Admin: 1, Gestores: 10, Motoristas: 339)`);
    console.log(`🚗 Veículos: 200`);
    console.log(`🛣️ Jornadas: 200 (160 Históricas, 40 Ativas)`);
    console.log('--------------------------------------------------');
    console.log('Credenciais de teste:');
    console.log('User: admin@paraopeba.com.br | Senha: 123456');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
