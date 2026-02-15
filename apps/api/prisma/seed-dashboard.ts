import { PrismaClient, VehicleType, VehicleStatus, JourneyStatus, Role, MaintenanceType, MaintenanceStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting Dashboard Seed...');

    // 1. Clean Up
    console.log('🧹 Cleaning Database...');
    await prisma.stockMovement.deleteMany();
    await prisma.inventoryItem.deleteMany();
    await prisma.incident.deleteMany();
    await prisma.telemetryRecord.deleteMany();
    await prisma.checklist.deleteMany();
    await prisma.journey.deleteMany();
    await prisma.maintenance.deleteMany();
    await prisma.fuelEntry.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.user.deleteMany();
    await prisma.organization.deleteMany();

    // 2. Organization
    console.log('🏢 Creating Organization...');
    const org = await prisma.organization.create({
        data: {
            name: 'Grupo Paraopeba',
            document: '12.345.678/0001-90',
        }
    });

    // 3. User & Drivers
    console.log('👥 Creating Users...');
    const passwordHash = await bcrypt.hash('123456', 10);

    // Admin
    await prisma.user.create({
        data: {
            name: 'Gestor da Frota',
            email: 'admin@paraopeba.com.br',
            passwordHash,
            role: Role.ADMIN,
            organizationId: org.id
        }
    });

    // Drivers
    const driverNames = ['João Silva', 'Maria Oliveira', 'Carlos Santos', 'Ana Souza'];
    const drivers = [];
    for (const name of driverNames) {
        const d = await prisma.user.create({
            data: {
                name,
                email: name.toLowerCase().replace(' ', '.') + '@paraopeba.com.br',
                passwordHash,
                role: Role.DRIVER,
                organizationId: org.id,
                licenseNumber: `CNH-${Math.floor(Math.random() * 999999)}`,
                active: true
            }
        });
        drivers.push(d);
    }

    // 4. Vehicles
    console.log('🚗 Creating Vehicles...');
    const vehiclesData = [
        // Available
        { plate: 'ABC-1234', model: 'Fiat Strada', type: VehicleType.CAR, status: VehicleStatus.AVAILABLE, km: 45000, fuel: 85 },
        { plate: 'DEF-5678', model: 'VW Gol', type: VehicleType.CAR, status: VehicleStatus.AVAILABLE, km: 32000, fuel: 90 },
        // In Use (Active Journeys)
        { plate: 'TRK-9001', model: 'Scania R450', type: VehicleType.TRUCK, status: VehicleStatus.IN_USE, km: 150000, fuel: 60 },
        { plate: 'VOL-5400', model: 'Volvo FH540', type: VehicleType.TRUCK, status: VehicleStatus.IN_USE, km: 210000, fuel: 45 },
        // Maintenance
        { plate: 'MNT-1111', model: 'Toyota Hilux', type: VehicleType.TRUCK, status: VehicleStatus.MAINTENANCE, km: 89000, fuel: 20 },
    ];

    const vehicles = [];
    for (const v of vehiclesData) {
        const created = await prisma.vehicle.create({
            data: {
                organizationId: org.id,
                plate: v.plate,
                model: v.model,
                type: v.type,
                status: v.status,
                currentKm: v.km,
                fuelLevel: v.fuel,
            }
        });
        vehicles.push(created);
    }

    // 5. Journeys (Active & History)
    console.log('🛣️ Creating Journeys...');

    // ACTIVE 1: Normal Journey (João with Scania)
    await prisma.journey.create({
        data: {
            organizationId: org.id,
            driverId: drivers[0].id,
            vehicleId: vehicles[2].id, // Scania
            status: JourneyStatus.IN_PROGRESS,
            startKm: vehicles[2].currentKm - 50,
            startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // Started 2h ago
            // No incident
        }
    });

    // ACTIVE 2: Incident Journey (Maria with Volvo)
    const faultJourney = await prisma.journey.create({
        data: {
            organizationId: org.id,
            driverId: drivers[1].id,
            vehicleId: vehicles[3].id, // Volvo
            status: JourneyStatus.IN_PROGRESS,
            startKm: vehicles[3].currentKm - 120,
            startTime: new Date(Date.now() - 4 * 60 * 60 * 1000), // Started 4h ago
        }
    });

    // Create Incident for Active Journey 2
    await prisma.incident.create({
        data: {
            organizationId: org.id,
            journeyId: faultJourney.id,
            vehicleId: vehicles[3].id,
            driverId: drivers[1].id,
            description: 'Excesso de velocidade detectado na BR-040 (+15%)',
            severity: 'HIGH',
            status: 'OPEN',
            isDriverAtFault: true,
            location: { lat: -19.9167, lng: -43.9345 } // BH coordinates approx
        }
    });

    // HISTORICAL JOURNEYS (For Graphs/Stats)
    // Create 10 completed journeys spread over last 30 days
    for (let i = 0; i < 10; i++) {
        const daysAgo = Math.floor(Math.random() * 30);
        const distance = 50 + Math.floor(Math.random() * 300);

        await prisma.journey.create({
            data: {
                organizationId: org.id,
                driverId: drivers[Math.floor(Math.random() * drivers.length)].id,
                vehicleId: vehicles[Math.floor(Math.random() * 2)].id, // Use available cars for history
                status: JourneyStatus.COMPLETED,
                startKm: 10000 + (i * 500),
                endKm: 10000 + (i * 500) + distance,
                startTime: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
                endTime: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
            }
        });
    }

    // 6. Maintenance Data (For Costs Card)
    console.log('🔧 Creating Maintenances...');
    await prisma.maintenance.create({
        data: {
            organizationId: org.id,
            vehicleId: vehicles[4].id, // Hilux (In Maintenance)
            type: MaintenanceType.CORRECTIVE,
            status: MaintenanceStatus.PENDING,
            nextDueKm: vehicles[4].currentKm,
            lastKm: vehicles[4].currentKm,
            notes: 'Troca de pastilhas de freio urgente',
            cost: 450.00
        }
    });

    // Historical Maintenance (Completed)
    await prisma.maintenance.create({
        data: {
            organizationId: org.id,
            vehicleId: vehicles[0].id,
            type: MaintenanceType.PREVENTIVE,
            status: MaintenanceStatus.COMPLETED,
            performedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
            nextDueKm: vehicles[0].currentKm + 10000,
            lastKm: vehicles[0].currentKm - 1000,
            cost: 320.00,
            notes: 'Troca de óleo e filtros'
        }
    });

    console.log('✅ Dashboard SEED Complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
