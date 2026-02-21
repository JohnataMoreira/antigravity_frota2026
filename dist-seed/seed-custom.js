"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
const firstNames = ['João', 'Maria', 'José', 'Ana', 'Carlos', 'Paulo', 'Antônio', 'Marcos', 'Luiz', 'Gabriel', 'Rafael', 'Daniel', 'Marcelo', 'Fernando', 'Ricardo', 'Lucas', 'André', 'Roberto', 'Bruno', 'Tiago', 'Rodrigo', 'Sandro', 'Fabiano', 'Renato', 'Juliana', 'Camila', 'Fernanda', 'Patrícia', 'Aline', 'Sandra'];
const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa'];
const carModels = [
    { brand: 'Fiat', model: 'Strada' }, { brand: 'Fiat', model: 'Toro' }, { brand: 'VW', model: 'Saveiro' },
    { brand: 'GM', model: 'S10' }, { brand: 'Toyota', model: 'Hilux' }, { brand: 'Ford', model: 'Ranger' },
    { brand: 'Renault', model: 'Duster Oroch' }, { brand: 'Fiat', model: 'Fiorino' },
];
const truckModels = [
    { brand: 'Scania', model: 'R450' }, { brand: 'Volvo', model: 'FH540' },
    { brand: 'Mercedes', model: 'Actros 2651' }, { brand: 'Iveco', model: 'S-Way' },
    { brand: 'Ford', model: 'Cargo 2429' }, { brand: 'VW', model: 'Constellation 24.280' },
];
const fineDescriptions = [
    { code: '7455', description: 'Velocidade superior à máxima permitida em até 20%', points: 4 },
    { code: '7463', description: 'Velocidade superior à máxima em mais de 20% até 50%', points: 5 },
    { code: '5541', description: 'Avanço de semáforo com luz vermelha', points: 7 },
    { code: '6050', description: 'Parar em local proibido', points: 5 },
    { code: '5185', description: 'Transitar em locais e horários não permitidos', points: 5 },
    { code: '7366', description: 'Não usar cinto de segurança', points: 5 },
    { code: '6006', description: 'Estacionar em faixa de pedestres', points: 5 },
    { code: '5290', description: 'Usar aparelho celular ao volante', points: 7 },
];
const supplierNames = [
    'Auto Peças Belo Horizonte Ltda', 'Distribuidora Sul Pneus S.A.', 'Posto Shell Contagem',
    'Lubromax Lubrificantes', 'MG Truck Parts', 'AutoCenter Premium', 'Filtros & Cia',
    'Elétrica Veicular MG', 'Mecânica Total Ltda', 'BH Combustíveis',
];
const inventoryData = [
    { name: 'Óleo Motor 15W40', sku: 'OIL-15W40', category: 'Lubrificantes', unit: 'L', minQuantity: 20, currentQuantity: 45, price: 18.90 },
    { name: 'Filtro de Óleo Scania', sku: 'FLT-OIL-SCAN', category: 'Filtros', unit: 'UN', minQuantity: 10, currentQuantity: 23, price: 45.00 },
    { name: 'Filtro de Ar Volvo', sku: 'FLT-AR-VOLV', category: 'Filtros', unit: 'UN', minQuantity: 5, currentQuantity: 8, price: 78.00 },
    { name: 'Pastilha de Freio Dianteira', sku: 'BRK-PAST-D', category: 'Freios', unit: 'PAR', minQuantity: 5, currentQuantity: 12, price: 95.00 },
    { name: 'Pneu 295/80 R22.5', sku: 'TYR-295-80', category: 'Pneus', unit: 'UN', minQuantity: 4, currentQuantity: 16, price: 1250.00 },
    { name: 'Pneu 265/75 R16', sku: 'TYR-265-75', category: 'Pneus', unit: 'UN', minQuantity: 4, currentQuantity: 10, price: 650.00 },
    { name: 'Fluido de Arrefecimento', sku: 'FLD-ARR', category: 'Lubrificantes', unit: 'L', minQuantity: 10, currentQuantity: 3, price: 22.00 },
    { name: 'Correia Dentada', sku: 'BLT-DENT', category: 'Correias', unit: 'UN', minQuantity: 3, currentQuantity: 5, price: 185.00 },
    { name: 'Lâmpada LED Farol', sku: 'LMP-LED-FR', category: 'Elétrica', unit: 'UN', minQuantity: 10, currentQuantity: 22, price: 35.00 },
    { name: 'Graxa de Chassis', sku: 'GRS-CHS', category: 'Lubrificantes', unit: 'KG', minQuantity: 5, currentQuantity: 12, price: 28.00 },
];
function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randFloat(min, max) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}
function daysAgo(days) {
    return new Date(Date.now() - days * 24 * 3600000);
}
function generatePlate() {
    const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const N = '0123456789';
    let p = '';
    for (let i = 0; i < 3; i++)
        p += L[randInt(0, 25)];
    p += '-';
    for (let i = 0; i < 4; i++)
        p += N[randInt(0, 9)];
    return p;
}
function generateCPF() {
    const n = () => randInt(100000000, 999999999);
    return `${n()}-${randInt(10, 99)}`;
}
async function main() {
    console.log('🏁 Iniciando Seed Completo v2 — Frota2026...');
    const t0 = Date.now();
    const passwordHash = await bcrypt.hash('123456', 10);
    const now = new Date();
    // ============================================================
    // 1. Organization
    // ============================================================
    console.log('🏢 Criando organização...');
    const org = await prisma.organization.upsert({
        where: { document: '12.345.678/0001-90' },
        update: {},
        create: { name: 'Grupo Paraopeba S.A.', document: '12.345.678/0001-90' },
    });
    // ============================================================
    // 2. Cleanup (idempotent)
    // ============================================================
    console.log('🧹 Limpando dados antigos...');
    // Wrap new models in try/catch — Prisma Client may not have regenerated yet
    try {
        await prisma.alert.deleteMany({ where: { organizationId: org.id } });
    }
    catch (e) {
        console.warn('  ⚠️ Alert não disponível ainda (pular)');
    }
    try {
        await prisma.trafficFine.deleteMany({ where: { organizationId: org.id } });
    }
    catch (e) {
        console.warn('  ⚠️ TrafficFine não disponível ainda (pular)');
    }
    await prisma.attachment.deleteMany({ where: { organizationId: org.id } });
    await prisma.financialTransaction.deleteMany({ where: { organizationId: org.id } });
    await prisma.purchaseOrderItem.deleteMany({});
    await prisma.purchaseOrder.deleteMany({ where: { organizationId: org.id } });
    await prisma.stockMovement.deleteMany({});
    await prisma.inventoryItem.deleteMany({ where: { organizationId: org.id } });
    await prisma.supplier.deleteMany({ where: { organizationId: org.id } });
    await prisma.fuelEntry.deleteMany({ where: { organizationId: org.id } });
    await prisma.fuelEntry.deleteMany({ where: { organizationId: org.id } });
    await prisma.maintenance.deleteMany({ where: { organizationId: org.id } });
    await prisma.maintenanceTemplate.deleteMany({ where: { organizationId: org.id } });
    await prisma.checklist.deleteMany({});
    await prisma.incident.deleteMany({ where: { organizationId: org.id } });
    await prisma.journey.deleteMany({ where: { organizationId: org.id } });
    await prisma.telemetryRecord.deleteMany({});
    await prisma.vehicle.deleteMany({ where: { organizationId: org.id } });
    await prisma.user.deleteMany({ where: { organizationId: org.id, role: client_1.Role.DRIVER } });
    // ============================================================
    // 3. Users
    // ============================================================
    console.log('👥 Gerando usuários...');
    const adminEmails = ['admin@paraopeba.com.br', 'johnatavinicius@hotmail.com'];
    for (const email of adminEmails) {
        await prisma.user.upsert({
            where: { email },
            update: { organizationId: org.id },
            create: {
                name: email.includes('johnata') ? 'Johnata Moreira' : 'Administrador Paraopeba',
                email,
                passwordHash,
                role: client_1.Role.ADMIN,
                organizationId: org.id,
                phone: '(31) 9999-9999',
                licenseNumber: `MG-${randInt(1000000, 9999999)}`,
            },
        });
    }
    const drivers = [];
    const driverData = [
        { firstName: 'Carlos', lastName: 'Silva', city: 'Belo Horizonte' },
        { firstName: 'Marcos', lastName: 'Oliveira', city: 'Contagem' },
        { firstName: 'Paulo', lastName: 'Santos', city: 'Betim' },
        { firstName: 'Ricardo', lastName: 'Ferreira', city: 'Ribeirão das Neves' },
        { firstName: 'Lucas', lastName: 'Alves', city: 'Vespasiano' },
        { firstName: 'André', lastName: 'Pereira', city: 'Santa Luzia' },
        { firstName: 'Bruno', lastName: 'Lima', city: 'Sabará' },
        { firstName: 'Roberto', lastName: 'Costa', city: 'Nova Lima' },
        { firstName: 'Tiago', lastName: 'Rodrigues', city: 'Igarapé' },
        { firstName: 'Rafael', lastName: 'Gomes', city: 'Brumadinho' },
        { firstName: 'Fernando', lastName: 'Ribeiro', city: 'Belo Horizonte' },
        { firstName: 'Rodrigo', lastName: 'Martins', city: 'Contagem' },
        { firstName: 'Daniel', lastName: 'Carvalho', city: 'Betim' },
        { firstName: 'Gabriel', lastName: 'Almeida', city: 'Pedro Leopoldo' },
        { firstName: 'Sandro', lastName: 'Moreira', city: 'Lagoa Santa' },
        { firstName: 'João', lastName: 'Nunes', city: 'Matozinhos' },
        { firstName: 'Juliana', lastName: 'Soares', city: 'Belo Horizonte' },
        { firstName: 'Ana', lastName: 'Vieira', city: 'Contagem' },
        { firstName: 'Camila', lastName: 'Barbosa', city: 'Betim' },
    ];
    for (let i = 0; i < driverData.length; i++) {
        const d = driverData[i];
        const email = `${d.firstName.toLowerCase()}.${d.lastName.toLowerCase()}${i}@paraopeba.com.br`;
        const u = await prisma.user.upsert({
            where: { email },
            update: { organizationId: org.id },
            create: {
                name: `${d.firstName} ${d.lastName}`,
                firstName: d.firstName,
                lastName: d.lastName,
                email,
                passwordHash,
                role: client_1.Role.DRIVER,
                organizationId: org.id,
                phone: `(31) 9${randInt(1000, 9999)}-${randInt(1000, 9999)}`,
                licenseNumber: `MG-${randInt(1000000, 9999999)}`,
                addressCity: d.city,
                addressState: 'MG',
                entryDate: daysAgo(randInt(180, 1800)),
                cpf: generateCPF(),
            },
        });
        drivers.push(u);
    }
    // ============================================================
    // 4. Vehicles (50)
    // ============================================================
    console.log('🚗 Gerando 50 veículos...');
    const vehicles = [];
    for (let i = 0; i < 50; i++) {
        const type = i < 22 ? client_1.VehicleType.TRUCK : i < 38 ? client_1.VehicleType.CAR : i < 44 ? client_1.VehicleType.MOTORCYCLE : client_1.VehicleType.MACHINE;
        const models = type === client_1.VehicleType.TRUCK ? truckModels : carModels;
        const m = pick(models);
        const plate = generatePlate();
        const currentKm = randInt(15000, 250000);
        const v = await prisma.vehicle.upsert({
            where: { organizationId_plate: { organizationId: org.id, plate } },
            update: {},
            create: {
                plate,
                model: m.model,
                brand: m.brand,
                type,
                currentKm,
                status: pick([client_1.VehicleStatus.AVAILABLE, client_1.VehicleStatus.AVAILABLE, client_1.VehicleStatus.AVAILABLE, client_1.VehicleStatus.MAINTENANCE, client_1.VehicleStatus.IN_USE]),
                fuelLevel: randFloat(20, 100),
                year: randInt(2018, 2025),
                lastMaintenanceKm: currentKm - randInt(1000, 15000),
                lastMaintenanceDate: daysAgo(randInt(30, 180)),
                organizationId: org.id,
            }
        });
        vehicles.push(v);
    }
    // ============================================================
    // 5. Maintenance Templates
    // ============================================================
    console.log('📋 Criando catálogo de serviços...');
    const templates = [
        { name: 'Troca de Óleo e Filtro', type: 'PREVENTIVE', vehicleTypes: [client_1.VehicleType.TRUCK, client_1.VehicleType.CAR], intervalKm: 10000, intervalMonths: 6 },
        { name: 'Revisão de Freios', type: 'PREVENTIVE', vehicleTypes: [client_1.VehicleType.TRUCK, client_1.VehicleType.CAR], intervalKm: 20000, intervalMonths: 12 },
        { name: 'Alinhamento e Balanceamento', type: 'PREVENTIVE', vehicleTypes: [client_1.VehicleType.CAR], intervalKm: 10000, intervalMonths: 6 },
        { name: 'Revisão de Suspensão', type: 'PREVENTIVE', vehicleTypes: [client_1.VehicleType.TRUCK], intervalKm: 30000, intervalMonths: 12 },
        { name: 'Troca de Correia Dentada', type: 'PREVENTIVE', vehicleTypes: [client_1.VehicleType.CAR], intervalKm: 60000, intervalMonths: 48 },
        { name: 'Revisão Geral Programada', type: 'PREVENTIVE', vehicleTypes: [client_1.VehicleType.TRUCK, client_1.VehicleType.CAR, client_1.VehicleType.MOTORCYCLE], intervalKm: 25000, intervalMonths: 12 },
    ];
    for (const t of templates) {
        await prisma.maintenanceTemplate.create({ data: { ...t, organizationId: org.id } });
    }
    // ============================================================
    // 6. Journeys (60) with FuelEntries
    // ============================================================
    console.log('🛣️  Gerando 60 jornadas com abastecimentos...');
    const journeys = [];
    const destinations = ['Vitória/ES', 'Rio de Janeiro/RJ', 'São Paulo/SP', 'Uberlândia/MG', 'Juiz de Fora/MG', 'Montes Claros/MG', 'Governador Valadares/MG'];
    for (let i = 0; i < 60; i++) {
        const vehicle = pick(vehicles);
        const driver = pick(drivers);
        const startDaysAgo = randInt(1, 90);
        const startTime = daysAgo(startDaysAgo);
        const durationMs = randInt(3, 12) * 3600000;
        const endTime = new Date(startTime.getTime() + durationMs);
        const startKm = vehicle.currentKm - randInt(1000, 5000);
        const kmDriven = randInt(150, 800);
        const endKm = startKm + kmDriven;
        const j = await prisma.journey.create({
            data: {
                organizationId: org.id,
                driverId: driver.id,
                vehicleId: vehicle.id,
                status: i < 55 ? client_1.JourneyStatus.COMPLETED : client_1.JourneyStatus.IN_PROGRESS,
                startKm,
                endKm: i < 55 ? endKm : undefined,
                startTime,
                endTime: i < 55 ? endTime : undefined,
                destinationName: pick(destinations),
                startLocation: { lat: -19.9191 + randFloat(-2, 2), lng: -43.9386 + randFloat(-2, 2), address: 'Belo Horizonte, MG' },
                endLocation: i < 55 ? { lat: -19.9191 + randFloat(-5, 5), lng: -43.9386 + randFloat(-5, 5) } : undefined,
                checklists: {
                    create: [
                        {
                            type: client_1.ChecklistType.CHECKOUT,
                            items: [
                                { itemId: 'pneus', status: 'OK' },
                                { itemId: 'oleo', status: 'OK' },
                                { itemId: 'freios', status: randInt(0, 3) > 0 ? 'OK' : 'ISSUE', notes: 'Verificar pressão' },
                                { itemId: 'combustivel', status: 'OK' },
                                { itemId: 'luzes', status: 'OK' },
                            ],
                            rating: randInt(3, 5),
                            createdAt: startTime,
                        }
                    ]
                },
            }
        });
        journeys.push({ ...j, driver, vehicle });
    }
    // ============================================================
    // 7. Fuel Entries (80)
    // ============================================================
    console.log('⛽ Gerando 80 abastecimentos...');
    const fuelTypes = [client_1.FuelType.DIESEL, client_1.FuelType.DIESEL, client_1.FuelType.DIESEL, client_1.FuelType.GASOLINE, client_1.FuelType.ETHANOL];
    const paymentMethods = [client_1.PaymentMethod.FUEL_CARD, client_1.PaymentMethod.FUEL_CARD, client_1.PaymentMethod.CASH, client_1.PaymentMethod.PIX, client_1.PaymentMethod.CREDIT_CARD];
    for (let i = 0; i < 80; i++) {
        const j = pick(journeys);
        const liters = randFloat(30, 250);
        const pricePerLiter = randFloat(5.40, 6.80);
        const totalValue = parseFloat((liters * pricePerLiter).toFixed(2));
        const fuelType = j.vehicle.type === client_1.VehicleType.TRUCK ? client_1.FuelType.DIESEL : pick(fuelTypes);
        await prisma.fuelEntry.create({
            data: {
                organizationId: org.id,
                vehicleId: j.vehicleId,
                driverId: j.driverId,
                journeyId: randInt(0, 1) ? j.id : undefined,
                date: new Date(j.startTime.getTime() + randInt(1, 3) * 3600000),
                km: j.startKm + randInt(10, 200),
                liters,
                totalValue,
                pricePerLiter,
                fuelType,
                paymentMethod: pick(paymentMethods),
                paymentProvider: 'Ipiranga Frota',
            }
        });
    }
    // ============================================================
    // 8. Maintenances (30)
    // ============================================================
    console.log('🔧 Gerando 30 manutenções...');
    const maintenanceTypes = [client_1.MaintenanceType.OIL, client_1.MaintenanceType.TIRES, client_1.MaintenanceType.INSPECTION, client_1.MaintenanceType.OTHER];
    for (let i = 0; i < 30; i++) {
        const vehicle = pick(vehicles);
        const type = pick(maintenanceTypes);
        const daysBack = randInt(5, 120);
        const performedAt = daysAgo(daysBack);
        const cost = randFloat(250, 8000);
        await prisma.maintenance.create({
            data: {
                organizationId: org.id,
                vehicleId: vehicle.id,
                type,
                status: i < 22 ? client_1.MaintenanceStatus.COMPLETED : client_1.MaintenanceStatus.PENDING,
                lastKm: vehicle.currentKm - randInt(500, 10000),
                nextDueKm: vehicle.currentKm + randInt(5000, 15000),
                nextDueDate: new Date(now.getTime() + randInt(30, 180) * 24 * 3600000),
                cost: i < 22 ? cost : undefined,
                performedAt: i < 22 ? performedAt : undefined,
                notes: pick(['Realizado conforme previsto.', 'Necessário retornar em 30 dias.', 'Peça substituída.', undefined, undefined]),
            }
        });
    }
    // ============================================================
    // 9. Suppliers (10)
    // ============================================================
    console.log('🏪 Gerando fornecedores...');
    const suppliers = [];
    for (let i = 0; i < supplierNames.length; i++) {
        const s = await prisma.supplier.create({
            data: {
                organizationId: org.id,
                name: supplierNames[i],
                document: `${randInt(10, 99)}.${randInt(100, 999)}.${randInt(100, 999)}/0001-${randInt(10, 99)}`,
                phone: `(31) 3${randInt(100, 999)}-${randInt(1000, 9999)}`,
                email: `contato@${supplierNames[i].toLowerCase().replace(/\s/g, '').substring(0, 12)}.com.br`,
                category: pick(['Combustível', 'Peças', 'Pneus', 'Manutenção', 'Lubrificantes']),
            }
        });
        suppliers.push(s);
    }
    // ============================================================
    // 10. Inventory Items
    // ============================================================
    console.log('📦 Populando estoque...');
    const inventoryItems = [];
    for (const item of inventoryData) {
        const inv = await prisma.inventoryItem.create({
            data: { ...item, organizationId: org.id }
        });
        inventoryItems.push(inv);
        // Add initial stock movement
        await prisma.stockMovement.create({
            data: {
                inventoryItemId: inv.id,
                type: 'IN',
                quantity: item.currentQuantity,
                reason: 'PURCHASE',
                notes: 'Estoque inicial',
            }
        });
    }
    // ============================================================
    // 11. Purchase Orders (8)
    // ============================================================
    console.log('🛒 Gerando ordens de compra...');
    const adminUser = await prisma.user.findFirst({ where: { organizationId: org.id, role: client_1.Role.ADMIN } });
    for (let i = 0; i < 8; i++) {
        const supplier = pick(suppliers);
        const status = pick([client_1.PurchaseOrderStatus.COMPLETED, client_1.PurchaseOrderStatus.COMPLETED, client_1.PurchaseOrderStatus.APPROVED, client_1.PurchaseOrderStatus.REQUESTED]);
        const inv = pick(inventoryItems);
        const qty = randFloat(5, 50);
        const unitPrice = inv.price ?? randFloat(50, 500);
        await prisma.purchaseOrder.create({
            data: {
                organizationId: org.id,
                supplierId: supplier.id,
                requesterId: adminUser.id,
                approverId: status !== client_1.PurchaseOrderStatus.REQUESTED ? adminUser.id : undefined,
                status,
                notes: `Compra de ${inv.name}`,
                items: {
                    create: [{
                            inventoryItemId: inv.id,
                            description: inv.name,
                            quantity: qty,
                            unitPrice,
                        }]
                }
            }
        });
    }
    // ============================================================
    // 12. Financial Transactions (40)
    // ============================================================
    console.log('💰 Gerando 40 transações financeiras...');
    const categories = ['FUEL', 'MAINTENANCE', 'PURCHASE', 'SALARY', 'TAX', 'OTHER'];
    for (let i = 0; i < 40; i++) {
        const daysBack = randInt(1, 120);
        const dueDate = daysAgo(daysBack);
        const isPaid = randInt(0, 3) > 0;
        await prisma.financialTransaction.create({
            data: {
                organizationId: org.id,
                description: `${pick(['Abastecimento', 'Manutenção', 'Pedágio', 'Revisão', 'Seguro', 'IPVA', 'Multa'])} - ${pick(['Jan', 'Fev', 'Mar', 'Abr', 'Mai'])}/${now.getFullYear()}`,
                amount: randFloat(150, 15000),
                type: client_1.TransactionType.EXPENSE,
                status: isPaid ? client_1.TransactionStatus.PAID : (dueDate < now ? client_1.TransactionStatus.OVERDUE : client_1.TransactionStatus.PENDING),
                category: pick(categories),
                dueDate,
                paymentDate: isPaid ? new Date(dueDate.getTime() + randInt(0, 3) * 24 * 3600000) : undefined,
                paymentMethod: isPaid ? pick([client_1.PaymentMethod.PIX, client_1.PaymentMethod.CREDIT_CARD, client_1.PaymentMethod.CASH]) : undefined,
            }
        });
    }
    // ============================================================
    // 13. Traffic Fines (15)
    // ============================================================
    console.log('🚦 Gerando 15 multas...');
    for (let i = 0; i < 15; i++) {
        const vehicle = pick(vehicles);
        const j = journeys.find((j) => j.vehicleId === vehicle.id) ?? pick(journeys);
        const fine = pick(fineDescriptions);
        const daysBack = randInt(5, 180);
        const occurredAt = daysAgo(daysBack);
        const hasDriver = randInt(0, 1);
        const amount = pick([130.16, 195.23, 293.47, 880.41, 195.23, 293.47]);
        await prisma.trafficFine.create({
            data: {
                organizationId: org.id,
                vehicleId: vehicle.id,
                driverId: hasDriver ? j.driverId : undefined,
                journeyId: hasDriver ? j.id : undefined,
                code: fine.code,
                description: fine.description,
                occurredAt,
                location: pick(['BR-040 Km 450', 'MG-030 Km 12', 'Av. Antônio Carlos, BH', 'BR-381 Km 278', 'Anel Rodoviário BH Km 8']),
                amount,
                points: fine.points,
                status: pick(['PENDING_IDENTIFICATION', 'IDENTIFIED', 'IDENTIFIED', 'PAID', 'PAID', 'APPEAL']),
            }
        });
    }
    // ============================================================
    // 14. Alerts (10)
    // ============================================================
    console.log('🔔 Gerando alertas...');
    const alertData = [
        { type: 'MAINTENANCE', severity: 'CRITICAL', message: 'Revisão de Freios VENCIDA — Toyota Hilux (ABC-1234)' },
        { type: 'MAINTENANCE', severity: 'WARNING', message: 'Troca de Óleo próxima — Scania R450 (XYZ-5678): faltam 300 km' },
        { type: 'DOCUMENT', severity: 'CRITICAL', message: 'CRLV vencido — Ford Ranger (DEF-9012)' },
        { type: 'STOCK', severity: 'WARNING', message: 'Estoque baixo: Fluido de Arrefecimento (3 L, mínimo: 10 L)' },
        { type: 'FINE', severity: 'INFO', message: '3 multas aguardam identificação de motorista' },
        { type: 'MAINTENANCE', severity: 'WARNING', message: 'Alinhamento e Balanceamento próximo — GM S10 (GHI-3456)' },
        { type: 'EXPIRY', severity: 'WARNING', message: 'CNH de Carlos Silva vence em 15 dias' },
        { type: 'STOCK', severity: 'CRITICAL', message: 'Estoque CRÍTICO: Filtro de Ar Volvo (apenas 8 UN)' },
        { type: 'MAINTENANCE', severity: 'INFO', message: 'Revisão Geral agendada — Ford Cargo (JKL-7890)' },
        { type: 'FINE', severity: 'INFO', message: 'Multa de R$ 293,47 identificada para motorista André Pereira' },
    ];
    for (const alert of alertData) {
        await prisma.alert.create({
            data: {
                organizationId: org.id,
                ...alert,
                isRead: randInt(0, 2) === 0,
            }
        });
    }
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`\n✨ Seed completo concluído em ${elapsed}s!`);
    console.log('📊 Resumo:');
    console.log(`   - ${driverData.length + 2} usuários (2 admins + ${driverData.length} motoristas)`);
    console.log(`   - 50 veículos`);
    console.log(`   - ${templates.length} templates de manutenção`);
    console.log(`   - 60 jornadas`);
    console.log(`   - 80 abastecimentos`);
    console.log(`   - 30 manutenções`);
    console.log(`   - ${supplierNames.length} fornecedores`);
    console.log(`   - ${inventoryData.length} itens de estoque`);
    console.log(`   - 8 pedidos de compra`);
    console.log(`   - 40 transações financeiras`);
    console.log(`   - 15 multas`);
    console.log(`   - 10 alertas`);
}
main()
    .catch((e) => {
    console.error('❌ Erro no seed:');
    console.dir(e, { depth: null });
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
