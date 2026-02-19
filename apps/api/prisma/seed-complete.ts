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
    DocumentType,
    PurchaseOrderStatus,
    TransactionType,
    TransactionStatus
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

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

async function main() {
    console.log('🏁 Iniciando Seed Completo (12 meses)...');
    const t0 = Date.now();

    const passwordHash = await bcrypt.hash('123456', 10);
    const historyStart = new Date('2025-02-01');
    const now = new Date('2026-02-19');

    // 1. Organization
    const org = await prisma.organization.upsert({
        where: { document: '12.345.678/0001-90' },
        update: {},
        create: { name: 'Grupo Paraopeba S.A.', document: '12.345.678/0001-90' },
    });

    // 2. Users (Admin + 20 Drivers)
    const admin = await prisma.user.upsert({
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
    for (let i = 0; i < 20; i++) {
        const u = await prisma.user.upsert({
            where: { email: `motorista${i}@paraopeba.com.br` },
            update: { organizationId: org.id },
            create: {
                name: `${pick(firstNames)} ${pick(lastNames)}`,
                email: `motorista${i}@paraopeba.com.br`,
                passwordHash,
                role: Role.DRIVER,
                organizationId: org.id,
            },
        });
        drivers.push(u);
    }

    // 3. Vehicles (20)
    const vehicles = [];
    for (let i = 0; i < 20; i++) {
        const type = i < 10 ? VehicleType.TRUCK : VehicleType.CAR;
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
                currentKm: randInt(10000, 200000),
                status: VehicleStatus.AVAILABLE,
                organizationId: org.id,
            }
        });
        vehicles.push(v);
    }

    // 4. Inventory Items
    const inventoryItems = [];
    const categories = ['FILTROS', 'LUBRIFICANTES', 'PNEUS', 'PECAS'];
    for (const cat of categories) {
        for (let i = 0; i < 5; i++) {
            const item = await prisma.inventoryItem.create({
                data: {
                    organizationId: org.id,
                    name: `${cat} - Item ${i + 1}`,
                    sku: `${cat.slice(0, 3)}-${randInt(1000, 9999)}`,
                    category: cat,
                    unit: cat === 'LUBRIFICANTES' ? 'L' : 'UN',
                    minQuantity: randInt(5, 10),
                    currentQuantity: randInt(10, 50),
                    price: randFloat(50, 500),
                }
            });
            inventoryItems.push(item);
        }
    }

    // 5. Suppliers
    const suppliers = [];
    for (let i = 0; i < 5; i++) {
        const s = await prisma.supplier.create({
            data: {
                organizationId: org.id,
                name: `Fornecedor ${pick(['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'])}`,
                category: pick(categories)
            }
        });
        suppliers.push(s);
    }

    // 6. 13 Months of History (Journeys, Fuel, Maintenance, Finance)
    console.log('📅 Gerando histórico de 13 meses (Fev 2025 - Fev 2026)...');
    for (let month = 0; month < 13; month++) {
        const monthDate = new Date(historyStart);
        monthDate.setMonth(monthDate.getMonth() + month);

        // Journeys & Fuel (30 per month)
        for (let j = 0; j < 30; j++) {
            const vehicle = pick(vehicles);
            const driver = pick(drivers);
            // End of month or today if current month
            const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
            const maxDate = endOfMonth > now ? now : endOfMonth;

            const startTime = randomDateInRange(monthDate, maxDate);
            const endTime = new Date(startTime.getTime() + randInt(2, 10) * 3600000);

            const journey = await prisma.journey.create({
                data: {
                    organizationId: org.id,
                    driverId: driver.id,
                    vehicleId: vehicle.id,
                    status: JourneyStatus.COMPLETED,
                    startKm: vehicle.currentKm - randInt(1000, 2000) + (month * 100),
                    endKm: vehicle.currentKm - randInt(500, 900) + (month * 100),
                    startTime,
                    endTime,
                }
            });

            // Checklist for journey
            await prisma.checklist.create({
                data: {
                    journeyId: journey.id,
                    type: ChecklistType.CHECKOUT,
                    items: [
                        { itemId: 'pneus', status: 'OK' },
                        { itemId: 'oleo', status: 'OK' },
                        { itemId: 'fluidez', status: 'OK' }
                    ],
                    rating: randInt(4, 5)
                }
            });

            // Fuel for some journeys
            if (Math.random() > 0.5) {
                const liters = randFloat(20, 60);
                const totalValue = randFloat(150, 400);
                const fuel = await prisma.fuelEntry.create({
                    data: {
                        organizationId: org.id,
                        vehicleId: vehicle.id,
                        driverId: driver.id,
                        journeyId: journey.id,
                        date: startTime,
                        km: journey.startKm + 5,
                        liters,
                        totalValue,
                        pricePerLiter: totalValue / liters,
                        fuelType: vehicle.type === VehicleType.TRUCK ? FuelType.DIESEL : FuelType.GASOLINE,
                    }
                });

                // Financial transaction for fuel
                await prisma.financialTransaction.create({
                    data: {
                        organizationId: org.id,
                        description: `Abastecimento - ${vehicle.plate}`,
                        amount: totalValue,
                        type: TransactionType.EXPENSE,
                        status: TransactionStatus.PAID,
                        category: 'FUEL',
                        dueDate: startTime,
                        paymentDate: startTime,
                        fuelEntryId: fuel.id
                    }
                });
            }
        }

        // Maintenances (5 per month)
        for (let m = 0; m < 5; m++) {
            const vehicle = pick(vehicles);
            const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
            const maxDate = endOfMonth > now ? now : endOfMonth;
            const date = randomDateInRange(monthDate, maxDate);
            const cost = randFloat(200, 2000);

            const maintenance = await prisma.maintenance.create({
                data: {
                    organizationId: org.id,
                    vehicleId: vehicle.id,
                    type: pick([MaintenanceType.OIL, MaintenanceType.INSPECTION, MaintenanceType.OTHER]),
                    nextDueKm: vehicle.currentKm + 10000,
                    status: MaintenanceStatus.COMPLETED,
                    cost,
                    performedAt: date,
                }
            });

            await prisma.financialTransaction.create({
                data: {
                    organizationId: org.id,
                    description: `Manutenção - ${vehicle.plate}`,
                    amount: cost,
                    type: TransactionType.EXPENSE,
                    status: TransactionStatus.PAID,
                    category: 'MAINTENANCE',
                    dueDate: date,
                    paymentDate: date,
                    maintenanceId: maintenance.id
                }
            });
        }

        // Purchase Orders (2 per month)
        for (let p = 0; p < 2; p++) {
            const supplier = pick(suppliers);
            const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
            const maxDate = endOfMonth > now ? now : endOfMonth;
            const date = randomDateInRange(monthDate, maxDate);
            const item = pick(inventoryItems);
            const qty = randInt(5, 20);
            const total = qty * (item.price || 100);

            const order = await prisma.purchaseOrder.create({
                data: {
                    organizationId: org.id,
                    supplierId: supplier.id,
                    requesterId: admin.id,
                    status: PurchaseOrderStatus.COMPLETED,
                    totalValue: total,
                    createdAt: date,
                    items: {
                        create: [
                            {
                                inventoryItemId: item.id,
                                description: item.name,
                                quantity: qty,
                                unitPrice: item.price
                            }
                        ]
                    }
                }
            });

            // Stock Movement for Purchase
            await prisma.stockMovement.create({
                data: {
                    inventoryItemId: item.id,
                    type: 'IN',
                    quantity: qty,
                    reason: 'PURCHASE',
                    createdAt: date
                }
            });

            // Financial transaction for Purchase
            await prisma.financialTransaction.create({
                data: {
                    organizationId: org.id,
                    description: `Compra - Pedido #${order.id.slice(0, 8)}`,
                    amount: total,
                    type: TransactionType.EXPENSE,
                    status: TransactionStatus.PAID,
                    category: 'PURCHASE',
                    dueDate: date,
                    paymentDate: date,
                    purchaseOrderId: order.id
                }
            });
        }
    }

    // 7. Compliance (Documents)
    console.log('📄 Gerando documentos de conformidade...');
    for (const v of vehicles) {
        await prisma.document.create({
            data: {
                organizationId: org.id,
                vehicleId: v.id,
                type: DocumentType.CRLV,
                name: 'CRLV Digital',
                number: `${randInt(1000000, 9999999)}`,
                issueDate: new Date('2025-01-01'),
                expiryDate: new Date('2026-12-31'),
                fileUrl: 'https://cdn.frota2026.com.br/docs/crlv-sample.pdf',
                fileType: 'pdf'
            }
        });
    }

    for (const d of drivers) {
        await prisma.document.create({
            data: {
                organizationId: org.id,
                userId: d.id,
                type: DocumentType.CNH,
                name: 'CNH Digital',
                number: `${randInt(1000000, 9999999)}`,
                issueDate: new Date('2023-05-15'),
                expiryDate: new Date('2028-05-15'),
                fileUrl: 'https://cdn.frota2026.com.br/docs/cnh-sample.pdf',
                fileType: 'pdf'
            }
        });
    }

    // 8. Tyres and Measurements
    console.log('🛞 Gerando pneus e medições...');
    for (const v of vehicles) {
        for (let i = 0; i < (v.type === VehicleType.TRUCK ? 10 : 4); i++) {
            const tyre = await prisma.tyre.create({
                data: {
                    organizationId: org.id,
                    vehicleId: v.id,
                    identifier: `PN-${v.plate}-${i + 1}`,
                    brand: 'Michelin',
                    model: 'X Multi',
                    size: v.type === VehicleType.TRUCK ? '295/80R22.5' : '205/55R16',
                    status: TyreStatus.IN_USE,
                    currentKm: randInt(1000, 50000),
                    initialCost: randFloat(800, 1500),
                    axle: Math.floor(i / 2) + 1,
                    position: i % 2 === 0 ? 'L' : 'R',
                }
            });

            // Initial Measurement
            await prisma.tyreMeasurement.create({
                data: {
                    organizationId: org.id,
                    tyreId: tyre.id,
                    treadDepth: randFloat(6, 12),
                    pressure: randInt(30, 110),
                    km: 0,
                    measuredAt: new Date('2025-02-15')
                }
            });

            // Recent Measurement
            await prisma.tyreMeasurement.create({
                data: {
                    organizationId: org.id,
                    tyreId: tyre.id,
                    treadDepth: randFloat(3, 8),
                    pressure: randInt(30, 110),
                    km: tyre.currentKm,
                    measuredAt: now
                }
            });
        }
    }

    console.log(`\n✨ Seed concluído em ${((Date.now() - t0) / 1000).toFixed(1)}s!`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
