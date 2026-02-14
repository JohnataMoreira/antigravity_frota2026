import { PrismaClient } from '@prisma/client';
import { AsyncLocalStorage } from 'async_hooks';

// Minimal implementation of TenantContext for the script
const storage = new AsyncLocalStorage<string>();
class TenantContext {
    static get() { return storage.getStore(); }
    static run<T>(id: string, fn: () => T): T { return storage.run(id, fn); }
}

async function testIsolation() {
    const prisma = new PrismaClient().$extends({
        query: {
            $allModels: {
                async $allOperations({ model, operation, args, query }) {
                    const organizationId = TenantContext.get();
                    if (model === 'Organization' || !organizationId) return query(args);

                    if (['findFirst', 'findMany', 'count', 'update', 'updateMany', 'delete', 'deleteMany'].includes(operation)) {
                        const anyArgs = args as any;
                        anyArgs.where = { ...anyArgs.where, organizationId };
                    }

                    if (['create', 'createMany'].includes(operation)) {
                        const anyArgs = args as any;
                        if (operation === 'create') {
                            anyArgs.data = { ...anyArgs.data, organizationId };
                        }
                    }
                    return query(args);
                },
            },
        },
    });

    console.log('🚀 Iniciando Teste de Isolamento de Tenants...');

    try {
        const tenantA = 'tenant_a_uuid';
        const tenantB = 'tenant_b_uuid';

        // 1. Criar veículo no Tenant A
        console.log(`\n[1] Criando veículo no ${tenantA}...`);
        const vehicleA = await TenantContext.run(tenantA, () =>
            prisma.vehicle.create({
                data: {
                    plate: 'SEC-0001',
                    model: 'Security Test',
                    brand: 'Prisma Isolation',
                    status: 'AVAILABLE'
                } as any
            })
        );
        console.log(`✅ Veículo criado: ${vehicleA.id} (Org: ${vehicleA.organizationId})`);

        // 2. Tentar acessar veículo do Tenant A estando no Tenant B
        console.log(`\n[2] Tentando acessar veículo de A a partir do ${tenantB}...`);
        const leakedVehicle = await TenantContext.run(tenantB, () =>
            prisma.vehicle.findUnique({
                where: { id: vehicleA.id } as any
            })
        );

        if (leakedVehicle) {
            console.error('❌ FALHA CRÍTICA: Dados vazaram entre tenants!');
            process.exit(1);
        } else {
            console.log('✅ SUCESSO: Acesso negado (Isolamento ativo).');
        }

        // 3. Tentar ATUALIZAR veículo do Tenant A estando no Tenant B
        console.log(`\n[3] Tentando atualizar veículo de A a partir do ${tenantB}...`);
        try {
            await TenantContext.run(tenantB, () =>
                prisma.vehicle.update({
                    where: { id: vehicleA.id },
                    data: { model: 'HACKED' }
                })
            );
            console.error('❌ FALHA CRÍTICA: Atualização cross-tenant permitida!');
            process.exit(1);
        } catch (e: any) {
            console.log('✅ SUCESSO: Atualização negada (Prisma não encontrou o record no contexto B).');
        }

        // Cleanup
        console.log('\n🧹 Limpando dados de teste...');
        await TenantContext.run(tenantA, () => prisma.vehicle.delete({ where: { id: vehicleA.id } }));
        console.log('✨ Teste de Isolamento Concluído com 100% de aproveitamento.');

    } catch (error) {
        console.error('💥 Erro durante o teste:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

testIsolation();
