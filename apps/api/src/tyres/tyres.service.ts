import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTyreDto, InstallTyreDto, RecordMeasurementDto, TyreRotationDto } from './dto';
import { TyreStatus } from '@prisma/client';

@Injectable()
export class TyresService {
    constructor(private prisma: PrismaService) { }

    async create(organizationId: string, dto: CreateTyreDto) {
        return this.prisma.tyre.create({
            data: {
                ...dto,
                organizationId,
                status: TyreStatus.STOCK,
                currentKm: dto.initialKm || 0,
            }
        });
    }

    async findAll(organizationId: string) {
        return this.prisma.tyre.findMany({
            where: { organizationId },
            include: { vehicle: { select: { plate: true } } },
            orderBy: { identifier: 'asc' }
        });
    }

    async findOne(organizationId: string, id: string) {
        const tyre = await this.prisma.tyre.findFirst({
            where: { id, organizationId },
            include: {
                vehicle: true,
                movements: { orderBy: { createdAt: 'desc' } },
                measurements: { orderBy: { measuredAt: 'desc' } }
            }
        });

        if (!tyre) throw new NotFoundException('Tyre not found');
        return tyre;
    }

    async install(organizationId: string, tyreId: string, dto: InstallTyreDto) {
        const tyre = await this.findOne(organizationId, tyreId);
        if (tyre.status !== TyreStatus.STOCK) {
            throw new BadRequestException('Tyre is not in stock');
        }

        return this.prisma.$transaction(async (tx) => {
            // 1. Create movement record
            await tx.tyreMovement.create({
                data: {
                    organizationId,
                    tyreId,
                    vehicleId: dto.vehicleId,
                    type: 'INSTALL',
                    km: dto.km,
                    tyreKm: tyre.currentKm,
                    axle: dto.axle,
                    position: dto.position
                }
            });

            // 2. Update Tyre status
            return tx.tyre.update({
                where: { id: tyreId },
                data: {
                    vehicleId: dto.vehicleId,
                    status: TyreStatus.IN_USE,
                    axle: dto.axle,
                    position: dto.position
                }
            });
        });
    }

    async recordMeasurement(organizationId: string, tyreId: string, dto: RecordMeasurementDto) {
        const tyre = await this.findOne(organizationId, tyreId);

        return this.prisma.tyreMeasurement.create({
            data: {
                organizationId,
                tyreId,
                treadDepth: dto.treadDepth,
                pressure: dto.pressure,
                km: dto.km
            }
        });
    }

    async remove(organizationId: string, tyreId: string, km: number, notes?: string) {
        const tyre = await this.findOne(organizationId, tyreId);
        if (tyre.status !== TyreStatus.IN_USE) {
            throw new BadRequestException('Tyre is not in use');
        }

        return this.prisma.$transaction(async (tx) => {
            // Calculate KM difference
            const movement = await tx.tyreMovement.findFirst({
                where: { tyreId, type: 'INSTALL' },
                orderBy: { createdAt: 'desc' }
            });

            const addedKm = movement ? Math.max(0, km - movement.km) : 0;

            await tx.tyreMovement.create({
                data: {
                    organizationId,
                    tyreId,
                    vehicleId: tyre.vehicleId,
                    type: 'REMOVE',
                    km,
                    tyreKm: tyre.currentKm + addedKm,
                    notes
                }
            });

            return tx.tyre.update({
                where: { id: tyreId },
                data: {
                    vehicleId: null,
                    status: TyreStatus.STOCK,
                    axle: null,
                    position: null,
                    currentKm: tyre.currentKm + addedKm
                }
            });
        });
    }
}
