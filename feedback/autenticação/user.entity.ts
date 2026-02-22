import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
  VersionColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcrypt';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255, nullable: false })
  email: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  firstName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName: string;

  // ─── SENHA: Nunca exposta nas respostas ────────────────────
  @Exclude()
  @Column({ type: 'varchar', nullable: true, select: false })
  password: string;

  // ─── REFRESH TOKEN: Apenas o hash é armazenado ────────────
  @Exclude()
  @Column({ type: 'varchar', nullable: true, select: false })
  hashedRefreshToken: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ type: 'enum', enum: AuthProvider, default: AuthProvider.LOCAL })
  provider: AuthProvider;

  @Column({ type: 'varchar', nullable: true })
  googleId: string;

  @Column({ type: 'varchar', nullable: true })
  picture: string;

  // ─── SEGURANÇA: Controle de tentativas de login ───────────
  @Column({ type: 'int', default: 0 })
  failedLoginAttempts: number;

  @Column({ type: 'timestamp', nullable: true })
  lockedUntil: Date;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isEmailVerified: boolean;

  @Column({ type: 'varchar', nullable: true, select: false })
  emailVerificationToken: string;

  @Column({ type: 'timestamp', nullable: true, select: false })
  emailVerificationExpires: Date;

  // ─── CONTROLE DE VERSÃO para detectar conflitos ───────────
  // Previne "race conditions" em atualizações concorrentes
  @VersionColumn()
  version: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @Column({ type: 'varchar', nullable: true })
  lastLoginIp: string;

  // ─── MÉTODOS ──────────────────────────────────────────────

  /** Verifica se a conta está bloqueada por excesso de tentativas */
  isLocked(): boolean {
    return this.lockedUntil && this.lockedUntil > new Date();
  }

  /** Verifica a senha com hash */
  async validatePassword(plainPassword: string): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(plainPassword, this.password);
  }

  /** Incrementa tentativas falhas e bloqueia após limite */
  incrementFailedAttempts(): void {
    this.failedLoginAttempts += 1;
    // Bloqueia por tempo progressivo:
    // 5 falhas = 5min, 10 = 30min, 15+ = 24h
    if (this.failedLoginAttempts >= 15) {
      this.lockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
    } else if (this.failedLoginAttempts >= 10) {
      this.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
    } else if (this.failedLoginAttempts >= 5) {
      this.lockedUntil = new Date(Date.now() + 5 * 60 * 1000);
    }
  }

  resetFailedAttempts(): void {
    this.failedLoginAttempts = 0;
    this.lockedUntil = null;
  }
}
