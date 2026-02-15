/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StartJourneyDto, EndJourneyDto } from './dto';
import { JourneyStatus, VehicleStatus, ChecklistType } from '@prisma/client';

@Injectable()
export class JourneysService {
    constructor(private prisma: PrismaService) { }

    async start(driverId: string, dto: StartJourneyDto) {
        // 1. Check if vehicle exists and is available (automated isolation)
        const vehicle = await this.prisma.vehicle.findUnique({
            where: { id: dto.vehicleId },
        });

        if (!vehicle) {
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

            // Create Journey (organizationId added by extension)
            const journey = await tx.journey.create({
                data: {
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
                } as any, // organizationId is injected by Prisma Extension
                include: { vehicle: true, checklists: true }
            });

            return journey;
        });
    }

    async end(driverId: string, journeyId: string, dto: EndJourneyDto) {
        const journey = await this.prisma.journey.findFirst({
            where: { id: journeyId, driverId },
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

    async findActive(driverId: string) {
        return this.prisma.journey.findFirst({
            where: { driverId, status: JourneyStatus.IN_PROGRESS },
            include: { vehicle: true }
        });
    }

    async findAll() {
        const journeys = await this.prisma.journey.findMany({
            include: {
                vehicle: { select: { plate: true, model: true } },
                driver: { select: { name: true } },
                checklists: true
            },
            orderBy: { startTime: 'desc' }
        });

        const now = new Date();
        const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

        return journeys.map(journey => {
            const durationMs = journey.endTime
                ? (new Date(journey.endTime).getTime() - new Date(journey.startTime).getTime())
                : (now.getTime() - new Date(journey.startTime).getTime());

            return {
                ...journey,
                durationMinutes: Math.floor(durationMs / 60000),
                isLongRunning: journey.status === JourneyStatus.IN_PROGRESS && durationMs > TWELVE_HOURS_MS
            };
        });
    }
}
