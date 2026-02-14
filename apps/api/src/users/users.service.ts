/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

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

    async findAll(search?: string) {
        const where: any = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { cpf: { contains: search, mode: 'insensitive' } },
            ];
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
                active: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
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

        const user = await this.prisma.user.update({
            where: { id },
            data: {
                name: dto.name,
                licenseNumber: dto.licenseNumber,
                role: dto.role,
            },
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

    async remove(id: string) {
        await this.findOne(id);

        await this.prisma.user.delete({
            where: { id },
        });

        return { message: 'User deleted successfully' };
    }
}
