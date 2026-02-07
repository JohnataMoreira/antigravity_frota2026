import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dto';

@Injectable()
export class VehiclesService {
    constructor(private prisma: PrismaService) { }

    async create(organizationId: string, dto: CreateVehicleDto) {
        return this.prisma.vehicle.create({
            data: {
                ...dto,
                organizationId,
            },
        });
    }

    async findAll(organizationId: string) {
        return this.prisma.vehicle.findMany({
            where: { organizationId },
            orderBy: { plate: 'asc' },
        });
    }

    async findOne(organizationId: string, id: string) {
        const vehicle = await this.prisma.vehicle.findFirst({
            where: { id, organizationId },
        });

        if (!vehicle) throw new NotFoundException('Vehicle not found');
        return vehicle;
    }

    async update(organizationId: string, id: string, dto: UpdateVehicleDto) {
        // Check existence and ownership
        await this.findOne(organizationId, id);

        return this.prisma.vehicle.update({
            where: { id },
            data: dto,
        });
    }

    async remove(organizationId: string, id: string) {
        // Check existence and ownership
        await this.findOne(organizationId, id);

        return this.prisma.vehicle.delete({
            where: { id },
        });
    }
}
