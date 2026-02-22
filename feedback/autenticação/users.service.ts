import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User, AuthProvider, UserRole } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly bcryptRounds: number;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {
    this.bcryptRounds = this.configService.get<number>('BCRYPT_ROUNDS', 12);
  }

  // ─────────────────────────────────────────────────────────────
  // CRIAÇÃO DE USUÁRIO com transação atômica
  // ─────────────────────────────────────────────────────────────
  async create(dto: CreateUserDto): Promise<User> {
    // Usa transação para garantir atomicidade — ou cria tudo ou não cria nada
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verifica duplicidade dentro da transação para evitar race condition
      const existing = await queryRunner.manager.findOne(User, {
        where: { email: dto.email.toLowerCase() },
        lock: { mode: 'pessimistic_write' }, // Lock de escrita
      });

      if (existing) {
        throw new ConflictException('E-mail já cadastrado');
      }

      const hashedPassword = await this.hashPassword(dto.password);

      const user = queryRunner.manager.create(User, {
        email: dto.email.toLowerCase(),
        firstName: dto.firstName,
        lastName: dto.lastName,
        password: hashedPassword,
        provider: AuthProvider.LOCAL,
        isActive: true,
      });

      const savedUser = await queryRunner.manager.save(user);
      await queryRunner.commitTransaction();

      this.logger.log(`Novo usuário criado: ${savedUser.id}`);
      return savedUser;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof ConflictException) throw error;

      // Trata erro de constraint unique do banco (fallback além da verificação manual)
      if (error.code === '23505') {
        throw new ConflictException('E-mail já cadastrado');
      }

      this.logger.error('Erro ao criar usuário', error.stack);
      throw new InternalServerErrorException('Erro ao criar conta');
    } finally {
      // SEMPRE libera o queryRunner — evita vazamento de conexões
      await queryRunner.release();
    }
  }

  // ─────────────────────────────────────────────────────────────
  // UPSERT para Google OAuth — cria ou atualiza sem duplicar
  // ─────────────────────────────────────────────────────────────
  async findOrCreateFromGoogle(googleProfile: {
    email: string;
    firstName: string;
    lastName: string;
    googleId: string;
    picture: string;
  }): Promise<User> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let user = await queryRunner.manager.findOne(User, {
        where: { email: googleProfile.email.toLowerCase() },
        lock: { mode: 'pessimistic_write' },
      });

      if (user) {
        // Usuário existe — vincula conta Google se necessário
        if (!user.googleId) {
          user.googleId = googleProfile.googleId;
          user.provider = AuthProvider.GOOGLE;
          user.isEmailVerified = true; // Google já verificou o email
          user = await queryRunner.manager.save(user);
        }
      } else {
        // Cria novo usuário via Google
        user = queryRunner.manager.create(User, {
          email: googleProfile.email.toLowerCase(),
          firstName: googleProfile.firstName,
          lastName: googleProfile.lastName,
          googleId: googleProfile.googleId,
          picture: googleProfile.picture,
          provider: AuthProvider.GOOGLE,
          isEmailVerified: true,
          isActive: true,
        });
        user = await queryRunner.manager.save(user);
      }

      await queryRunner.commitTransaction();
      return user;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Erro no OAuth Google', error.stack);
      throw new InternalServerErrorException('Erro ao autenticar com Google');
    } finally {
      await queryRunner.release();
    }
  }

  // ─────────────────────────────────────────────────────────────
  // BUSCA SEGURA — sempre retorna null em vez de lançar exceção
  // em contextos de autenticação (evita enumeração de usuários)
  // ─────────────────────────────────────────────────────────────
  async findByEmailForAuth(email: string): Promise<User | null> {
    try {
      return await this.userRepository
        .createQueryBuilder('user')
        .addSelect('user.password')
        .addSelect('user.hashedRefreshToken')
        .where('user.email = :email', { email: email.toLowerCase() })
        .andWhere('user.isActive = true')
        .getOne();
    } catch (error) {
      this.logger.error('Erro ao buscar usuário por email', error.stack);
      return null; // Falha segura — não revela se o email existe
    }
  }

  async findById(id: string): Promise<User | null> {
    try {
      return await this.userRepository.findOne({ where: { id } });
    } catch (error) {
      this.logger.error(`Erro ao buscar usuário ${id}`, error.stack);
      return null;
    }
  }

  async findByIdWithTokens(id: string): Promise<User | null> {
    try {
      return await this.userRepository
        .createQueryBuilder('user')
        .addSelect('user.hashedRefreshToken')
        .where('user.id = :id', { id })
        .getOne();
    } catch (error) {
      this.logger.error(`Erro ao buscar usuário com tokens ${id}`, error.stack);
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // REFRESH TOKEN — salva apenas o hash, nunca o token bruto
  // ─────────────────────────────────────────────────────────────
  async saveRefreshTokenHash(userId: string, token: string): Promise<void> {
    try {
      const hash = await bcrypt.hash(token, this.bcryptRounds);
      await this.userRepository.update(userId, {
        hashedRefreshToken: hash,
        lastLoginAt: new Date(),
      });
    } catch (error) {
      this.logger.error(`Erro ao salvar refresh token para ${userId}`, error.stack);
      throw new InternalServerErrorException('Erro ao salvar sessão');
    }
  }

  async clearRefreshToken(userId: string): Promise<void> {
    try {
      await this.userRepository.update(userId, { hashedRefreshToken: null });
    } catch (error) {
      // Falha no logout não é crítica — loga mas não bloqueia
      this.logger.warn(`Aviso: erro ao limpar refresh token para ${userId}`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // CONTROLE DE BLOQUEIO por tentativas falhas
  // ─────────────────────────────────────────────────────────────
  async recordFailedLogin(userId: string, ip: string): Promise<void> {
    try {
      const user = await this.findById(userId);
      if (!user) return;

      user.incrementFailedAttempts();
      await this.userRepository.save(user);

      if (user.isLocked()) {
        this.logger.warn(
          `Conta ${userId} bloqueada após ${user.failedLoginAttempts} tentativas. IP: ${ip}`,
        );
      }
    } catch (error) {
      this.logger.error('Erro ao registrar falha de login', error.stack);
    }
  }

  async recordSuccessfulLogin(userId: string, ip: string): Promise<void> {
    try {
      await this.userRepository.update(userId, {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: ip,
      });
    } catch (error) {
      // Não bloqueia o login bem-sucedido por erro de atualização de metadata
      this.logger.warn(`Aviso: erro ao registrar login bem-sucedido para ${userId}`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // LIMPEZA periódica de tokens expirados (agendada)
  // ─────────────────────────────────────────────────────────────
  async cleanExpiredData(): Promise<void> {
    try {
      // Desbloqueia contas cujo tempo de bloqueio já passou
      await this.userRepository
        .createQueryBuilder()
        .update(User)
        .set({ lockedUntil: null, failedLoginAttempts: 0 })
        .where('lockedUntil < :now', { now: new Date() })
        .execute();
    } catch (error) {
      this.logger.error('Erro na limpeza de dados expirados', error.stack);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // HELPERS PRIVADOS
  // ─────────────────────────────────────────────────────────────
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.bcryptRounds);
  }
}
