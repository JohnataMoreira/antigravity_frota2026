import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsString,
  IsOptional,
  Min,
  Max,
  MinLength,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

/**
 * BLINDAGEM DE CONFIGURAÇÃO
 * O sistema RECUSA a inicializar se qualquer variável obrigatória estiver ausente,
 * com valor inválido, ou insegura.
 * Isso previne falhas silenciosas onde o sistema sobe sem segurança ativa.
 */
class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @Min(1024)
  @Max(65535)
  PORT: number = 3000;

  // ─── JWT ────────────────────────────────────────
  @IsString()
  @MinLength(32, { message: 'JWT_ACCESS_SECRET deve ter ao menos 32 caracteres' })
  JWT_ACCESS_SECRET: string;

  @IsString()
  @MinLength(32, { message: 'JWT_REFRESH_SECRET deve ter ao menos 32 caracteres' })
  JWT_REFRESH_SECRET: string;

  @IsString()
  JWT_ACCESS_EXPIRATION: string = '15m';

  @IsString()
  JWT_REFRESH_EXPIRATION: string = '7d';

  // ─── GOOGLE OAUTH ────────────────────────────────
  @IsString()
  @MinLength(10)
  GOOGLE_CLIENT_ID: string;

  @IsString()
  @MinLength(10)
  GOOGLE_CLIENT_SECRET: string;

  @IsString()
  GOOGLE_CALLBACK_URL: string;

  // ─── BANCO DE DADOS ──────────────────────────────
  @IsString()
  DB_HOST: string = 'localhost';

  @IsNumber()
  DB_PORT: number = 5432;

  @IsString()
  DB_USERNAME: string;

  @IsString()
  DB_PASSWORD: string;

  @IsString()
  DB_NAME: string;

  // ─── REDIS ───────────────────────────────────────
  @IsString()
  REDIS_HOST: string = 'localhost';

  @IsNumber()
  REDIS_PORT: number = 6379;

  @IsOptional()
  @IsString()
  REDIS_PASSWORD?: string;

  // ─── SEGURANÇA ───────────────────────────────────
  @IsString()
  @MinLength(32)
  COOKIE_SECRET: string;

  @IsString()
  ALLOWED_ORIGINS: string = 'http://localhost:3001';

  @IsString()
  FRONTEND_URL: string = 'http://localhost:3001';

  // ─── BCRYPT ──────────────────────────────────────
  @IsNumber()
  @Min(10)
  @Max(14)
  BCRYPT_ROUNDS: number = 12;
}

export function validateConfig(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const messages = errors.map((e) => Object.values(e.constraints || {}).join(', ')).join('\n');
    throw new Error(
      `\n\n❌ ERRO DE CONFIGURAÇÃO — O sistema não pode inicializar:\n${messages}\n\n` +
        `Verifique seu arquivo .env antes de continuar.\n`,
    );
  }

  return validatedConfig;
}
