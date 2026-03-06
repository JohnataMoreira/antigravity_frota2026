/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dto';

@Injectable()
export class VehiclesService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateVehicleDto) {
        return this.prisma.vehicle.create({
            data: dto as any, // organizationId is injected by Prisma Extension
        });
    }

    async findAll() {
        return (this.prisma.vehicle as any).findMany({
            where: { active: true },
            orderBy: { plate: 'asc' },
        });
    }

    async findOne(id: string) {
        const vehicle = await (this.prisma.vehicle as any).findFirst({
            where: { id, active: true },
        });

        if (!vehicle) throw new NotFoundException('Vehicle not found');
        return vehicle;
    }

    async update(id: string, dto: UpdateVehicleDto) {
        // Check existence and ownership (automated by extension)
        await this.findOne(id);

        return this.prisma.vehicle.update({
            where: { id },
            data: dto,
        });
    }

    async remove(id: string) {
        // Check existence and ownership (automated by extension)
        await this.findOne(id);

        return (this.prisma.vehicle as any).update({
            where: { id },
            data: { active: false },
        });
    }
}
