import { REQUIRED_ENV } from './env.required';

/**
 * Validação rígida de variáveis de ambiente.
 * Se uma variável obrigatória estiver ausente ou for fraca, o processo morre com log claro.
 * Isso evita o ciclo de 502 Bad Gateway por desconfiguração no servidor.
 */
export function validateConfig(config: Record<string, unknown>) {
    const env = process.env;
    const isProd = env.NODE_ENV === 'production';
    const errors: string[] = [];
    const warnings: string[] = [];

    // ─── JWT_ACCESS_SECRET ────────────────────────────────
    if (!env.JWT_ACCESS_SECRET) {
        errors.push('❌ JWT_ACCESS_SECRET está ausente. Gere com: openssl rand -base64 48');
    } else if (env.JWT_ACCESS_SECRET.length < REQUIRED_ENV.JWT_ACCESS_SECRET.minLength) {
        errors.push(`❌ JWT_ACCESS_SECRET tem apenas ${env.JWT_ACCESS_SECRET.length} chars. Mínimo: ${REQUIRED_ENV.JWT_ACCESS_SECRET.minLength}`);
    }

    // ─── JWT_REFRESH_SECRET ───────────────────────────────
    if (!env.JWT_REFRESH_SECRET) {
        errors.push('❌ JWT_REFRESH_SECRET está ausente. Gere com: openssl rand -base64 48');
    } else if (env.JWT_REFRESH_SECRET.length < REQUIRED_ENV.JWT_REFRESH_SECRET.minLength) {
        errors.push(`❌ JWT_REFRESH_SECRET tem apenas ${env.JWT_REFRESH_SECRET.length} chars. Mínimo: ${REQUIRED_ENV.JWT_REFRESH_SECRET.minLength}`);
    } else if (env.JWT_REFRESH_SECRET === env.JWT_ACCESS_SECRET) {
        errors.push('❌ JWT_REFRESH_SECRET deve ser DIFERENTE do JWT_ACCESS_SECRET');
    }

    // ─── COOKIE_SECRET ────────────────────────────────────
    if (!env.COOKIE_SECRET) {
        errors.push('❌ COOKIE_SECRET está ausente. Gere com: openssl rand -base64 48');
    } else if (env.COOKIE_SECRET.length < REQUIRED_ENV.COOKIE_SECRET.minLength) {
        errors.push(`❌ COOKIE_SECRET muito curto: ${env.COOKIE_SECRET.length} chars. Mínimo: ${REQUIRED_ENV.COOKIE_SECRET.minLength}`);
    }

    // ─── DATABASE ─────────────────────────────────────────
    if (!env.DATABASE_URL && !env.DB_URL) {
        errors.push('❌ DATABASE_URL está ausente. Formato: postgresql://user:pass@host:5432/dbname');
    }

    // ─── REDIS (obrigatório em produção) ──────────────────
    if (isProd && !env.REDIS_URL) {
        errors.push('❌ REDIS_URL está ausente em produção. Formato: redis://:senha@host:6379');
    } else if (!env.REDIS_URL) {
        warnings.push('⚠️  REDIS_URL ausente. Blacklist de tokens desativada (aceitável em dev)');
    }

    // ─── Exibe warnings (não bloqueia) ────────────────────
    if (warnings.length > 0) {
        console.warn('\n' + '─'.repeat(60));
        console.warn('  AVISOS DE CONFIGURAÇÃO:');
        warnings.forEach(w => console.warn('  ' + w));
        console.warn('─'.repeat(60) + '\n');
    }

    // ─── Erros bloqueiam o boot com mensagem acionável ────
    if (errors.length > 0) {
        console.error('\n' + '═'.repeat(60));
        console.error('  SISTEMA NÃO PODE INICIAR — VARIÁVEIS INVÁLIDAS:');
        console.error('═'.repeat(60));
        errors.forEach(e => console.error('  ' + e));
        console.error('═'.repeat(60));
        console.error('\n  COMO RESOLVER:');
        console.error('  1. No Dokploy: vá em Environment Variables do serviço API');
        console.error('  2. Adicione as variáveis listadas acima');
        console.error('  3. Para gerar secrets seguros: openssl rand -base64 48');
        console.error('  4. Faça redeploy do serviço');
        console.error('═'.repeat(60) + '\n');

        // Em produção, queremos que o processo morra para não entrar no limbo 502 sem log
        // Em dev, isso aparecerá no terminal do desenvolvedor
        process.exit(1);
    }

    return config;
}
