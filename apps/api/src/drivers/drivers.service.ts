/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDriverDto } from './dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class DriversService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateDriverDto) {
        const existingUser = await this.prisma.user.findFirst({
            where: { email: dto.email },
        });

        if (existingUser) throw new ConflictException('Driver with this email already exists in organization');

        const salt = await bcrypt.genSalt();
        const passwordHash = await bcrypt.hash(dto.password, salt);

        /* eslint-disable @typescript-eslint/no-explicit-any */
        return this.prisma.user.create({
            data: {
                email: dto.email,
                name: dto.name,
                passwordHash,
                role: 'DRIVER',
                licenseNumber: dto.licenseNumber,
            } as any, // organizationId is injected by Prisma Extension
            select: {
                id: true,
                name: true,
                email: true,
                licenseNumber: true,
                active: true,
            },
        });
        /* eslint-enable @typescript-eslint/no-explicit-any */
    }

    async findAll() {
        return this.prisma.user.findMany({
            where: { role: 'DRIVER' },
            select: {
                id: true,
                name: true,
                email: true,
                licenseNumber: true,
                active: true,
            },
            orderBy: { name: 'asc' },
        });
    }
}
