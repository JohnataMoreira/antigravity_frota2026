console.log('[DEBUG] Loading JourneysService file...');
import { Injectable, BadRequestException, NotFoundException, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StartJourneyDto, EndJourneyDto } from './dto';
import { JourneyStatus, VehicleStatus, ChecklistType } from '@prisma/client';

import { MaintenanceAlertsService } from '../maintenance/alerts.service';
import { ComplianceService } from '../compliance/compliance.service';

@Injectable()
export class JourneysService {
    constructor(
        private prisma: PrismaService,
        @Inject(forwardRef(() => MaintenanceAlertsService))
        private maintenanceAlertsService: MaintenanceAlertsService,
        @Inject(forwardRef(() => ComplianceService))
        private complianceService: ComplianceService
    ) { }

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
                    plannedRoute: dto.plannedRoute,
                    destinationName: dto.destinationName,
                    checklists: dto.checklistItems ? {
                        create: {
                            type: ChecklistType.CHECKOUT,
                            items: dto.checklistItems,
                        }
                    } : undefined
                } as any, // organizationId is injected by Prisma Extension
                include: { vehicle: true, checklists: true }
            });

            // Trigger Compliance Audit (Soft Block)
            const organizationId = (journey as any).organizationId;
            if (organizationId) {
                // Handle Photos (Attachments)
                if (dto.photos && dto.photos.length > 0) {
                    const checklist = journey.checklists[0];
                    if (checklist) {
                        for (const photo of dto.photos) {
                            await tx.attachment.create({
                                data: {
                                    organizationId,
                                    checklistId: checklist.id,
                                    url: photo,
                                    type: 'IMAGE',
                                    originalName: 'vistoria_saida.jpg'
                                }
                            });
                        }
                    }
                }

                const complianceAlerts = await this.complianceService.getComplianceAlerts(organizationId, dto.vehicleId, driverId);
                const expiredDocs = complianceAlerts.filter(a => a.isExpired);

                if (expiredDocs.length > 0) {
                    const docNames = expiredDocs.map(d => d.name).join(', ');
                    await tx.alert.create({
                        data: {
                            organizationId,
                            type: 'DOCUMENT',
                            severity: 'CRITICAL',
                            message: `Jornada Iniciada com Documentos Vencidos: ${docNames}. Motorista foi alertado mas seguiu viagem.`,
                            entityId: journey.id,
                            entityType: 'Journey'
                        }
                    });
                }
            }

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

            // Trigger Maintenance Check
            const organizationId = (updatedJourney as any).organizationId;
            if (organizationId) {
                // We fire and forget or wait? Better wait for consistency or use a queue later.
                await this.maintenanceAlertsService.checkAlerts(organizationId);
            }

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
                checklists: {
                    include: { attachments: true }
                },
                attachments: true
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
                durationMinutes: Math.max(0, Math.floor(durationMs / 60000)),
                isLongRunning: journey.status === JourneyStatus.IN_PROGRESS && durationMs > TWELVE_HOURS_MS
            };
        });
    }

    async findOne(id: string) {
        const journey = await this.prisma.journey.findUnique({
            where: { id },
            include: {
                vehicle: true,
                driver: { select: { name: true } },
                checklists: {
                    include: { attachments: true }
                },
                attachments: true
            }
        });

        if (!journey) throw new NotFoundException('Journey not found');
        return journey;
    }
}
