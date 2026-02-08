import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateUserDto, adminOrgId: string) {
        // Hash password
        const salt = await bcrypt.genSalt();
        const passwordHash = await bcrypt.hash(dto.password, salt);

        // Create user in same organization as admin
        const user = await this.prisma.user.create({
            data: {
                name: dto.name,
                email: dto.email,
                passwordHash,
                role: dto.role,
                licenseNumber: dto.licenseNumber,
                organizationId: adminOrgId,
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

    async findAll(organizationId: string) {
        return this.prisma.user.findMany({
            where: { organizationId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                licenseNumber: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string, organizationId: string) {
        const user = await this.prisma.user.findFirst({
            where: { id, organizationId },
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

    async update(id: string, dto: UpdateUserDto, organizationId: string) {
        // Check user exists and belongs to same org
        await this.findOne(id, organizationId);

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

    async remove(id: string, organizationId: string) {
        // Check user exists and belongs to same org
        await this.findOne(id, organizationId);

        await this.prisma.user.delete({
            where: { id },
        });

        return { message: 'User deleted successfully' };
    }
}
