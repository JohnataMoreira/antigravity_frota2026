import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
  jti?: string; // JWT ID único — permite invalidação individual
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  // ─────────────────────────────────────────────────────────────
  // VALIDAÇÃO LOCAL — usado pela LocalStrategy
  // ─────────────────────────────────────────────────────────────
  async validateCredentials(email: string, password: string, ip: string): Promise<User> {
    const user = await this.usersService.findByEmailForAuth(email);

    // ── Timing attack mitigation ──────────────────────────────
    // Se o usuário não existe, compara com hash dummy para gastar
    // o mesmo tempo que levaria comparar uma senha real.
    // Isso impede medir o tempo de resposta para descobrir emails válidos.
    const dummyHash = '$2b$12$invalidhashpaddingtomatchtime.invalid.hash.here';
    const passwordToCompare = user?.password ?? dummyHash;
    const isPasswordValid = await bcrypt.compare(password, passwordToCompare);

    // ── Mensagem GENÉRICA — nunca dizer se é email ou senha ───
    const genericError = new UnauthorizedException('Credenciais inválidas');

    if (!user || !isPasswordValid) {
      if (user) {
        await this.usersService.recordFailedLogin(user.id, ip);
      }
      throw genericError;
    }

    // Verifica bloqueio por tentativas excessivas
    if (user.isLocked()) {
      const minutesLeft = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 60000,
      );
      throw new UnauthorizedException(
        `Conta temporariamente bloqueada. Tente novamente em ${minutesLeft} minuto(s).`,
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Conta inativa');
    }

    return user;
  }

  // ─────────────────────────────────────────────────────────────
  // LOGIN — emite par de tokens
  // ─────────────────────────────────────────────────────────────
  async login(user: User, ip: string): Promise<TokenPair> {
    const tokens = await this.generateTokenPair(user);
    await this.usersService.saveRefreshTokenHash(user.id, tokens.refreshToken);
    await this.usersService.recordSuccessfulLogin(user.id, ip);
    this.logger.log(`Login bem-sucedido: user=${user.id} ip=${ip}`);
    return tokens;
  }

  // ─────────────────────────────────────────────────────────────
  // GOOGLE OAUTH LOGIN
  // ─────────────────────────────────────────────────────────────
  async googleLogin(googleProfile: any, ip: string): Promise<TokenPair> {
    const user = await this.usersService.findOrCreateFromGoogle(googleProfile);
    return this.login(user, ip);
  }

  // ─────────────────────────────────────────────────────────────
  // REFRESH TOKEN — rotação com detecção de roubo
  // ─────────────────────────────────────────────────────────────
  async refreshTokens(userId: string, incomingRefreshToken: string): Promise<TokenPair> {
    // Verifica se o token foi revogado (blacklist via Redis)
    const isRevoked = await this.isTokenRevoked(incomingRefreshToken);
    if (isRevoked) {
      this.logger.warn(`Tentativa de uso de refresh token revogado. User: ${userId}`);
      // Possível roubo de token — invalida TODA a sessão do usuário
      await this.usersService.clearRefreshToken(userId);
      throw new ForbiddenException('Sessão inválida. Faça login novamente.');
    }

    const user = await this.usersService.findByIdWithTokens(userId);

    if (!user || !user.hashedRefreshToken) {
      throw new ForbiddenException('Sessão expirada. Faça login novamente.');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Conta inativa');
    }

    const isTokenValid = await bcrypt.compare(
      incomingRefreshToken,
      user.hashedRefreshToken,
    );

    if (!isTokenValid) {
      // Hash não corresponde — possível ataque de reuso de token antigo
      this.logger.warn(`Refresh token inválido detectado para user: ${userId}. Sessão invalidada.`);
      await this.usersService.clearRefreshToken(userId);
      throw new ForbiddenException('Sessão comprometida. Faça login novamente.');
    }

    // Revoga o token atual antes de emitir novo (Refresh Token Rotation)
    await this.revokeToken(incomingRefreshToken);

    // Emite novo par de tokens
    const newTokens = await this.generateTokenPair(user);
    await this.usersService.saveRefreshTokenHash(user.id, newTokens.refreshToken);

    return newTokens;
  }

  // ─────────────────────────────────────────────────────────────
  // LOGOUT — invalida sessão completamente
  // ─────────────────────────────────────────────────────────────
  async logout(userId: string, refreshToken?: string): Promise<void> {
    // Revoga o refresh token no Redis (blacklist)
    if (refreshToken) {
      await this.revokeToken(refreshToken);
    }
    // Remove do banco
    await this.usersService.clearRefreshToken(userId);
    this.logger.log(`Logout: user=${userId}`);
  }

  // ─────────────────────────────────────────────────────────────
  // VALIDAÇÃO JWT — usado pela JwtStrategy
  // ─────────────────────────────────────────────────────────────
  async validateJwtPayload(payload: JwtPayload): Promise<User | null> {
    try {
      // Verifica se o token foi explicitamente revogado (para logout imediato)
      if (payload.jti) {
        const isRevoked = await this.isJtiRevoked(payload.jti);
        if (isRevoked) return null;
      }

      const user = await this.usersService.findById(payload.sub);
      if (!user || !user.isActive) return null;

      return user;
    } catch (error) {
      this.logger.error('Erro ao validar JWT payload', error.stack);
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // GERAÇÃO DE TOKENS
  // ─────────────────────────────────────────────────────────────
  private async generateTokenPair(user: User): Promise<TokenPair> {
    const jti = this.generateJti(); // ID único para o access token

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      jti,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION', '15m'),
      }),
      this.jwtService.signAsync(
        { sub: user.id, email: user.email }, // Refresh token com payload mínimo
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d'),
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  // ─────────────────────────────────────────────────────────────
  // BLACKLIST DE TOKENS via Redis
  // ─────────────────────────────────────────────────────────────
  private async revokeToken(token: string): Promise<void> {
    try {
      // Decodifica sem verificar para obter o exp
      const decoded = this.jwtService.decode(token) as any;
      if (!decoded?.exp) return;

      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl <= 0) return; // Já expirado — não precisa revogar

      const key = `revoked:rt:${this.hashTokenForCache(token)}`;
      await this.cacheManager.set(key, '1', ttl * 1000);
    } catch (error) {
      // Falha no Redis não impede o logout — apenas loga
      this.logger.warn('Aviso: falha ao revogar token no Redis', error.message);
    }
  }

  private async isTokenRevoked(token: string): Promise<boolean> {
    try {
      const key = `revoked:rt:${this.hashTokenForCache(token)}`;
      const value = await this.cacheManager.get(key);
      return value === '1';
    } catch (error) {
      // Se Redis falhou, não bloqueia acesso (fail-open para refresh)
      // mas loga o incidente
      this.logger.warn('Redis indisponível ao verificar revogação de token');
      return false;
    }
  }

  private async isJtiRevoked(jti: string): Promise<boolean> {
    try {
      const key = `revoked:jti:${jti}`;
      const value = await this.cacheManager.get(key);
      return value === '1';
    } catch {
      return false; // Fail-open: se Redis falhar, não bloqueia requests válidos
    }
  }

  // ─────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────
  private generateJti(): string {
    // ID único de 32 bytes em hex
    return require('crypto').randomBytes(16).toString('hex');
  }

  private hashTokenForCache(token: string): string {
    // Usa SHA-256 para gerar chave curta do token no Redis
    // Evita armazenar tokens completos no cache
    return require('crypto').createHash('sha256').update(token).digest('hex');
  }
}
