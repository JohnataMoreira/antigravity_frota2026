import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StartJourneyDto, EndJourneyDto } from './dto';
import { JourneyStatus, VehicleStatus, ChecklistType } from '@prisma/client';

@Injectable()
export class JourneysService {
    constructor(private prisma: PrismaService) { }

    async start(organizationId: string, driverId: string, dto: StartJourneyDto) {
        // 1. Check if vehicle exists and is available
        const vehicle = await this.prisma.vehicle.findUnique({
            where: { id: dto.vehicleId },
        });

        if (!vehicle || vehicle.organizationId !== organizationId) {
            throw new NotFoundException('Vehicle not found');
        }

        if (vehicle.status !== VehicleStatus.AVAILABLE) {
            throw new ConflictException(`Vehicle is currently ${vehicle.status}`);
        }

        // 2. Check if driver has active journey
        const activeJourney = await this.prisma.journey.findFirst({
            where: {
                driverId,
                status: JourneyStatus.IN_PROGRESS,
            },
        });

        if (activeJourney) {
            throw new ConflictException('Driver already has an active journey');
        }

        // 3. Create Journey Transactionally
        return this.prisma.$transaction(async (tx) => {
            // Update Vehicle Status to IN_USE
            await tx.vehicle.update({
                where: { id: dto.vehicleId },
                data: { status: VehicleStatus.IN_USE },
            });

            // Create Journey
            const journey = await tx.journey.create({
                data: {
                    organizationId,
                    driverId,
                    vehicleId: dto.vehicleId,
                    startKm: dto.startKm,
                    status: JourneyStatus.IN_PROGRESS,
                    startLocation: (dto.lat && dto.lng) ? { lat: dto.lat, lng: dto.lng } : undefined,
                    checklists: dto.checklistItems ? {
                        create: {
                            type: ChecklistType.CHECKOUT,
                            items: dto.checklistItems,
                        }
                    } : undefined
                },
                include: { vehicle: true, checklists: true }
            });

            return journey;
        });
    }

    async end(organizationId: string, driverId: string, journeyId: string, dto: EndJourneyDto) {
        const journey = await this.prisma.journey.findFirst({
            where: { id: journeyId, organizationId, driverId },
            include: { vehicle: true }
        });

        if (!journey) throw new NotFoundException('Journey not found');
        if (journey.status !== JourneyStatus.IN_PROGRESS) throw new BadRequestException('Journey already finished');

        if (dto.endKm < journey.startKm) {
            throw new BadRequestException(`End Km (${dto.endKm}) cannot be less than Start Km (${journey.startKm})`);
        }

        return this.prisma.$transaction(async (tx) => {
            // Update Journey
            const updatedJourney = await tx.journey.update({
                where: { id: journeyId },
                data: {
                    status: JourneyStatus.COMPLETED,
                    endKm: dto.endKm,
                    endTime: new Date(),
                    endLocation: (dto.lat && dto.lng) ? { lat: dto.lat, lng: dto.lng } : undefined,
                    checklists: dto.checklistItems ? {
                        create: {
                            type: ChecklistType.CHECKIN,
                            items: dto.checklistItems,
                        }
                    } : undefined
                },
                include: { vehicle: true, checklists: true }
            });

            // Update Vehicle
            await tx.vehicle.update({
                where: { id: journey.vehicleId },
                data: {
                    status: VehicleStatus.AVAILABLE,
                    currentKm: dto.endKm,
                }
            });

            return updatedJourney;
        });
    }

    async findActive(organizationId: string, driverId: string) {
        return this.prisma.journey.findFirst({
            where: { organizationId, driverId, status: JourneyStatus.IN_PROGRESS },
            include: { vehicle: true }
        });
    }

    async findAll(organizationId: string) {
        return this.prisma.journey.findMany({
            where: { organizationId },
            include: {
                vehicle: true,
                driver: true,
                checklists: true
            },
            orderBy: { startTime: 'desc' }
        });
    }
}
