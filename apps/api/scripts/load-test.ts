import { PrismaClient, VehicleStatus, JourneyStatus } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:3000/api';

async function getAdminToken() {
    try {
        const res = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@paraopeba.com.br',
            password: '123456'
        });
        return res.data.access_token;
    } catch (error) {
        console.error('Failed to get admin token');
        process.exit(1);
    }
}

async function runLoadTest(driverCount: number, durationMinutes: number) {
    console.log(`🚀 Starting load test with ${driverCount} concurrent simulations for ${durationMinutes} minutes...`);

    const token = await getAdminToken();

    // 1. Get/Create enough vehicles and active journeys
    const org = await prisma.organization.findFirst();
    if (!org) throw new Error('Org not found');

    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!adminUser) throw new Error('Admin not found');

    console.log('📦 Ensuring sufficient test data...');
    const existingVehicles = await prisma.vehicle.findMany({
        take: driverCount,
        where: { organizationId: org.id }
    });

    // Create more vehicles if needed
    if (existingVehicles.length < driverCount) {
        const needed = driverCount - existingVehicles.length;
        console.log(`➕ Creating ${needed} more dummy vehicles...`);
        for (let i = 0; i < needed; i++) {
            const v = await prisma.vehicle.create({
                data: {
                    organizationId: org.id,
                    plate: `TEST-${Math.floor(Math.random() * 99999)}`,
                    model: 'LoadTest Dummy',
                    type: 'TRUCK',
                    currentKm: 100000,
                    status: 'IN_USE'
                }
            });
            existingVehicles.push(v);
        }
    }

    // Ensure they have active journeys
    const targetVehicles = existingVehicles.slice(0, driverCount);
    for (const v of targetVehicles) {
        const active = await prisma.journey.findFirst({
            where: { vehicleId: v.id, status: 'IN_PROGRESS' }
        });
        if (!active) {
            await prisma.journey.create({
                data: {
                    organizationId: org.id,
                    driverId: adminUser.id, // Just use admin as driver for simulation
                    vehicleId: v.id,
                    status: 'IN_PROGRESS',
                    startKm: v.currentKm,
                    startTime: new Date()
                }
            });
            await prisma.vehicle.update({
                where: { id: v.id },
                data: { status: 'IN_USE' }
            });
        }
    }

    console.log('✅ Environment ready. Starting ping loop...');

    const endTime = Date.now() + durationMinutes * 60 * 1000;
    let successCount = 0;
    let errorCount = 0;

    const simulateDriver = async (vehicle: any) => {
        while (Date.now() < endTime) {
            try {
                const startTime = Date.now();
                await axios.post(`${API_URL}/telemetry/ingest/${vehicle.id}`, {
                    latitude: -19.9 + (Math.random() * 0.1),
                    longitude: -43.9 + (Math.random() * 0.1),
                    speed: 60 + (Math.random() * 20),
                    odometer: vehicle.currentKm + (Math.random() * 10),
                    fuelLevel: 80 - (Math.random() * 5),
                    engineStatus: true
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                successCount++;
                const latency = Date.now() - startTime;
                if (successCount % 100 === 0) {
                    console.log(`[STAB] ${successCount} requests sent. Latency: ${latency}ms`);
                }
            } catch (err: any) {
                errorCount++;
                console.error(`[ERR] Status: ${err.response?.status} - ${err.message}`);
            }
            // Wait 5-10 seconds jitter
            await new Promise(resolve => setTimeout(resolve, 5000 + Math.random() * 5000));
        }
    };

    // Run all drivers in parallel
    await Promise.all(targetVehicles.map(v => simulateDriver(v)));

    console.log('\n--- Load Test Summary ---');
    console.log(`Total Success: ${successCount}`);
    console.log(`Total Errors: ${errorCount}`);
    console.log(`Success Rate: ${((successCount / (successCount + errorCount)) * 100).toFixed(2)}%`);
    console.log('------------------------');
}

const DRIVERS = parseInt(process.argv[2]) || 100;
const DURATION = parseInt(process.argv[3]) || 5;

runLoadTest(DRIVERS, DURATION)
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
