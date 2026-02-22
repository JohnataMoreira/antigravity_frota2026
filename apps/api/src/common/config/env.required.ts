// ════════════════════════════════════════════════════════
// TODA variável de ambiente que o sistema precisa está aqui.
// Antes de usar uma variável nova em qualquer arquivo,
// declare ela aqui primeiro. Isso evita o ciclo de 502.
// ════════════════════════════════════════════════════════

export const REQUIRED_ENV = {
    // ─── Obrigatórias sempre ───────────────────────────────
    JWT_ACCESS_SECRET: { minLength: 32, description: 'Secret do access token JWT' },
    JWT_REFRESH_SECRET: { minLength: 32, description: 'Secret do refresh token JWT (diferente do anterior)' },
    COOKIE_SECRET: { minLength: 32, description: 'Secret para assinar cookies' },
    DATABASE_URL: { minLength: 10, description: 'URL de conexão do PostgreSQL' },

    // ─── Obrigatórias em produção ──────────────────────────
    REDIS_URL: { minLength: 10, description: 'URL do Redis para blacklist de tokens', prodOnly: true },

    // ─── Opcionais com default seguro ─────────────────────
    PORT: { default: '3000' },
    NODE_ENV: { default: 'development' },
    JWT_ACCESS_EXPIRATION: { default: '15m' },
    JWT_REFRESH_EXPIRATION: { default: '7d' },
    BCRYPT_ROUNDS: { default: '12' },
} as const;
