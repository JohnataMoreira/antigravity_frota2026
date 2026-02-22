/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
    ) { }

    async create(dto: CreateUserDto) {
        // Hash password
        const salt = await bcrypt.genSalt();
        const passwordHash = await bcrypt.hash(dto.password, salt);

        // Create user (organizationId added by extension)
        const user = await this.prisma.user.create({
            data: {
                name: dto.name,
                email: dto.email,
                passwordHash,
                role: dto.role,
                licenseNumber: dto.licenseNumber,
                phone: dto.phone,
                cpf: dto.cpf,
                birthDate: (dto.birthDate && !isNaN(Date.parse(dto.birthDate))) ? new Date(dto.birthDate) : undefined,
                entryDate: (dto.entryDate && !isNaN(Date.parse(dto.entryDate))) ? new Date(dto.entryDate) : undefined,
                addressStreet: dto.addressStreet,
                addressNumber: dto.addressNumber,
                addressComplement: dto.addressComplement,
                addressNeighborhood: dto.addressNeighborhood,
                addressCity: dto.addressCity,
                addressState: dto.addressState,
                addressZipCode: dto.addressZipCode,
                avatarUrl: dto.avatarUrl,
            } as any, // organizationId is injected by Prisma Extension
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                licenseNumber: true,
                createdAt: true,
            },
        });

        return user;
    }

    async findAll(search?: string, role?: string) {
        const where: any = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { cpf: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (role && role !== 'ALL') {
            where.role = role;
        }

        return this.prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                licenseNumber: true,
                phone: true,
                cpf: true,
                birthDate: true,
                entryDate: true,
                avatarUrl: true,
                active: true,
                createdAt: true,
            },
            orderBy: { name: 'asc' },
        });
    }

    async findOne(id: string) {
        const user = await this.prisma.user.findFirst({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                licenseNumber: true,
                phone: true,
                cpf: true,
                birthDate: true,
                entryDate: true,
                active: true,
                addressStreet: true,
                addressNumber: true,
                addressComplement: true,
                addressNeighborhood: true,
                addressCity: true,
                addressState: true,
                addressZipCode: true,
                avatarUrl: true,
                createdAt: true,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    async update(id: string, dto: UpdateUserDto) {
        await this.findOne(id);

        const data: any = {
            name: dto.name,
            licenseNumber: dto.licenseNumber,
            role: dto.role,
            phone: dto.phone,
            cpf: dto.cpf,
            addressStreet: dto.addressStreet,
            addressNumber: dto.addressNumber,
            addressComplement: dto.addressComplement,
            addressNeighborhood: dto.addressNeighborhood,
            addressCity: dto.addressCity,
            addressState: dto.addressState,
            addressZipCode: dto.addressZipCode,
            avatarUrl: dto.avatarUrl,
        };

        if (dto.birthDate) data.birthDate = new Date(dto.birthDate);
        if (dto.entryDate) data.entryDate = new Date(dto.entryDate);

        if (dto.password) {
            const salt = await bcrypt.genSalt();
            data.passwordHash = await bcrypt.hash(dto.password, salt);
        }

        return this.prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
            },
        });
    }

    async toggleStatus(id: string) {
        const user = await this.findOne(id);
        return this.prisma.user.update({
            where: { id },
            data: { active: !user.active },
            select: { id: true, active: true },
        });
    }

    async updatePushToken(id: string, pushToken: string) {
        return this.prisma.user.update({
            where: { id },
            data: { pushToken },
            select: { id: true, name: true }
        });
    }

    async remove(id: string) {
        await this.findOne(id);

        await this.prisma.user.delete({
            where: { id },
        });

        return { message: 'User deleted successfully' };
    }

    // ─────────────────────────────────────────────────────────────
    // SEGURANÇA: Métodos internos de autenticação
    // ─────────────────────────────────────────────────────────────

    async findByEmailForAuth(email: string) {
        // Retorna o usuário com campos sensíveis (passwordHash, etc)
        // Usado apenas internamente por AuthService
        return this.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });
    }

    async recordFailedLogin(userId: string, ip: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) return;

        const failedAttempts = (user as any).failedLoginAttempts + 1;
        let lockedUntil: Date | null = null;

        // Bloqueio progressivo: 5 falhas = 5min, 10 falhas = 30min, 15+ falhas = 24h
        if (failedAttempts >= 15) {
            lockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
        } else if (failedAttempts >= 10) {
            lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
        } else if (failedAttempts >= 5) {
            lockedUntil = new Date(Date.now() + 5 * 60 * 1000);
        }

        await (this.prisma.user as any).update({
            where: { id: userId },
            data: {
                failedLoginAttempts: failedAttempts,
                lockedUntil,
                lastLoginIp: ip,
            },
        });
    }

    async recordSuccessfulLogin(userId: string, ip: string) {
        await (this.prisma.user as any).update({
            where: { id: userId },
            data: {
                failedLoginAttempts: 0,
                lockedUntil: null,
                lastLoginAt: new Date(),
                lastLoginIp: ip,
            },
        });
    }

    async saveRefreshTokenHash(userId: string, token: string) {
        const bcryptRounds = this.configService.get<number>('BCRYPT_ROUNDS', 12);
        const salt = await bcrypt.genSalt(bcryptRounds);
        const hash = await bcrypt.hash(token, salt);

        await (this.prisma.user as any).update({
            where: { id: userId },
            data: {
                hashedRefreshToken: hash,
            },
        });
    }

    async clearRefreshToken(userId: string) {
        await (this.prisma.user as any).update({
            where: { id: userId },
            data: {
                hashedRefreshToken: null,
            },
        });
    }

    async cleanExpiredData() {
        // Desbloqueia contas cujo tempo de penalidade já expirou
        await (this.prisma.user as any).updateMany({
            where: {
                lockedUntil: { lt: new Date() },
            },
            data: {
                lockedUntil: null,
                failedLoginAttempts: 0,
            },
        });
    }
}
