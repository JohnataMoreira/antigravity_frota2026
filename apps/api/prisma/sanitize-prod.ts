import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Iniciando Sanitização de Dados...');

    // 1. Identificar o Tenant Principal (Grupo Paraopeba)
    const primaryOrg = await prisma.organization.findFirst({
        where: { document: '12.345.678/0001-90' }
    });

    if (!primaryOrg) {
        console.error('❌ Organização principal não encontrada. Abortando.');
        return;
    }

    console.log(`✅ Tenant Principal detectado: ${primaryOrg.name} (${primaryOrg.id})`);

    // 2. Desativar usuários que não pertencem ao Tenant Principal
    const deactivatedUsers = await prisma.user.updateMany({
        where: {
            organizationId: { not: primaryOrg.id },
            active: true
        },
        data: { active: false }
    });
    console.log(`👤 Usuários de outros tenants desativados: ${deactivatedUsers.count}`);

    // 3. Remover convites pendentes (testes) - Modelo removido
    // const deletedInvites = await prisma.invite.deleteMany({
    //     where: { organizationId: { not: primaryOrg.id } }
    // });
    // console.log(`✉️ Convites de teste removidos: ${deletedInvites?.count ?? 0}`);

    // 4. Limpar logs de auditoria antigos (opcional - manter apenas últimos 30 dias se necessário)
    // const thirtyDaysAgo = new Date();
    // thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    // const deletedLogs = await prisma.auditLog.deleteMany({
    //     where: { createdAt: { lt: thirtyDaysAgo } }
    // });
    // console.log(`📋 Logs de auditoria antigos removidos: ${deletedLogs.count}`);

    console.log('\n✨ Sanitização CONCLUÍDA com sucesso!');
}

main()
    .catch((e) => {
        console.error('❌ Erro na sanitização:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
