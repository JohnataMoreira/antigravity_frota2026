import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDriverDto } from './dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class DriversService {
    constructor(private prisma: PrismaService) { }

    async create(organizationId: string, dto: CreateDriverDto) {
        const existingUser = await this.prisma.user.findFirst({
            where: { organizationId, email: dto.email },
        });

        if (existingUser) throw new ConflictException('Driver with this email already exists in organization');

        const salt = await bcrypt.genSalt();
        const passwordHash = await bcrypt.hash(dto.password, salt);

        return this.prisma.user.create({
            data: {
                organizationId,
                email: dto.email,
                name: dto.name,
                passwordHash,
                role: 'DRIVER',
                licenseNumber: dto.licenseNumber,
            },
            select: {
                id: true,
                name: true,
                email: true,
                licenseNumber: true,
                active: true,
            },
        });
    }

    async findAll(organizationId: string) {
        return this.prisma.user.findMany({
            where: { organizationId, role: 'DRIVER' },
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
