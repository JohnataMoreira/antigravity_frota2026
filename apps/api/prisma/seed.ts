import { PrismaClient, VehicleType, VehicleStatus, JourneyStatus, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // 1. Clean up database
    console.log('🧹 Cleaning up existing data...');
    await prisma.checklist.deleteMany();
    await prisma.journey.deleteMany();
    await prisma.maintenance.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.user.deleteMany();
    await prisma.organization.deleteMany();

    // 2. Create Organization
    console.log('🏢 Creating Organization...');
    const org = await prisma.organization.create({
        data: {
            name: 'Grupo Paraopeba',
            document: '12.345.678/0001-90',
        },
    });

    // 3. Create Users
    console.log('👥 Creating Users...');
    const passwordHash = await bcrypt.hash('123456', 10);

    const admin = await prisma.user.create({
        data: {
            name: 'Gestor Paraopeba',
            email: 'admin@paraopeba.com.br',
            passwordHash,
            role: Role.ADMIN,
            organizationId: org.id,
        },
    });

    const driversData = [
        { name: 'João Silva', email: 'joao@paraopeba.com.br' },
        { name: 'Maria Oliveira', email: 'maria@paraopeba.com.br' },
        { name: 'Carlos Santos', email: 'carlos@paraopeba.com.br' },
        { name: 'Ana Pereira', email: 'ana@paraopeba.com.br' },
    ];

    const drivers = [];
    for (const d of driversData) {
        const driver = await prisma.user.create({
            data: {
                name: d.name,
                email: d.email,
                passwordHash,
                role: Role.DRIVER,
                organizationId: org.id,
                licenseNumber: `CNH-${Math.floor(Math.random() * 1000000)}`,
            },
        });
        drivers.push(driver);
    }

    // 4. Create Vehicles
    console.log('🚗 Creating Vehicles...');
    const vehiclesData = [
        { plate: 'ABC-1234', model: 'Fiat Strada', type: VehicleType.CAR, currentKm: 50000 },
        { plate: 'XYZ-9876', model: 'Toyota Hilux', type: VehicleType.TRUCK, currentKm: 120000 },
        { plate: 'TRK-5555', model: 'Scania R450', type: VehicleType.TRUCK, currentKm: 350000 },
        { plate: 'VOL-1111', model: 'Volvo FH540', type: VehicleType.TRUCK, currentKm: 280000 },
        { plate: 'CAT-320', model: 'Caterpillar 320', type: VehicleType.MACHINE, currentKm: 5000 }, // Using Km for hours roughly
    ];

    const vehicles = [];
    for (const v of vehiclesData) {
        const vehicle = await prisma.vehicle.create({
            data: {
                plate: v.plate,
                model: v.model,
                type: v.type,
                currentKm: v.currentKm,
                organizationId: org.id,
                status: VehicleStatus.AVAILABLE,
            },
        });
        vehicles.push(vehicle);
    }

    // 5. Create Journeys
    console.log('🛣️ Creating Journeys...');

    // Completed Journeys
    await prisma.journey.create({
        data: {
            organizationId: org.id,
            driverId: drivers[0].id,
            vehicleId: vehicles[0].id,
            status: JourneyStatus.COMPLETED,
            startKm: 49800,
            endKm: 49950,
            startTime: new Date(Date.now() - 86400000 * 2), // 2 days ago
            endTime: new Date(Date.now() - 86400000 * 2 + 7200000), // 2 hours later
        },
    });

    await prisma.journey.create({
        data: {
            organizationId: org.id,
            driverId: drivers[1].id,
            vehicleId: vehicles[1].id,
            status: JourneyStatus.COMPLETED,
            startKm: 119500,
            endKm: 119800,
            startTime: new Date(Date.now() - 86400000), // 1 day ago
            endTime: new Date(Date.now() - 86400000 + 10800000), // 3 hours later
        },
    });

    await prisma.journey.create({
        data: {
            organizationId: org.id,
            driverId: drivers[2].id,
            vehicleId: vehicles[2].id,
            status: JourneyStatus.COMPLETED,
            startKm: 349000,
            endKm: 349500,
            startTime: new Date(Date.now() - 43200000), // 12 hours ago
            endTime: new Date(Date.now() - 43200000 + 18000000), // 5 hours later
        },
    });

    // Active Journeys
    // Update vehicle status to IN_USE for active journeys
    const activeVehicle1 = vehicles[3];
    const activeVehicle2 = vehicles[4];

    await prisma.vehicle.update({
        where: { id: activeVehicle1.id },
        data: { status: VehicleStatus.IN_USE },
    });

    await prisma.journey.create({
        data: {
            organizationId: org.id,
            driverId: drivers[3].id,
            vehicleId: activeVehicle1.id,
            status: JourneyStatus.IN_PROGRESS,
            startKm: activeVehicle1.currentKm,
            startTime: new Date(Date.now() - 3600000), // 1 hour ago
        },
    });

    // Using the admin driver for the last journey just to mix
    await prisma.vehicle.update({
        where: { id: activeVehicle2.id },
        data: { status: VehicleStatus.IN_USE },
    });

    await prisma.journey.create({
        data: {
            organizationId: org.id,
            driverId: drivers[0].id, // Joao again
            vehicleId: activeVehicle2.id,
            status: JourneyStatus.IN_PROGRESS,
            startKm: activeVehicle2.currentKm,
            startTime: new Date(Date.now() - 7200000), // 2 hours ago
        },
    });

    console.log('✅ Seed completed!');
    console.log('🔑 Admin Credentials:');
    console.log('   Email: admin@paraopeba.com.br');
    console.log('   Password: 123456');
    console.log('   Document: 12.345.678/0001-90');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
