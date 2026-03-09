/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SyncService {
    constructor(private prisma: PrismaService) { }

    async pull(lastPulledAt: number) {
        const changes: any = {};
        const date = new Date(lastPulledAt);

        // Vehicles (Read-only for mobile basically, but we send updates)
        const updatedVehicles = await this.prisma.vehicle.findMany({
            where: {
                updatedAt: { gt: date },
            },
            select: {
                id: true, plate: true, model: true, brand: true, status: true, currentKm: true, updatedAt: true
            }
        });

        // Map to WatermelonDB format
        changes.vehicles = {
            created: updatedVehicles.filter(v => v.updatedAt.getTime() === v.updatedAt.getTime()), // Simplification: assume all are created/updated
            updated: updatedVehicles,
            deleted: [], // TODO: Track deletions
        };

        // Journeys (We start with limited history, maybe active only? or recent)
        // For now, let's not pull journeys to keep payload small, assuming mobile manages its own active journey mainly.
        // But if driver changes device? Need to pull.
        const updatedJourneys = await this.prisma.journey.findMany({
            where: {
                updatedAt: { gt: date }
            }
        });

        changes.journeys = {
            created: [],
            updated: updatedJourneys.map(j => ({
                id: j.id,
                vehicle_id: j.vehicleId,
                driver_id: j.driverId,
                status: j.status,
                start_km: j.startKm,
                end_km: j.endKm,
                start_time: j.startTime.getTime(),
                end_time: j.endTime?.getTime(),
                start_lat: (j.startLocation as any)?.lat,
                start_lng: (j.startLocation as any)?.lng,
                end_lat: (j.endLocation as any)?.lat,
                end_lng: (j.endLocation as any)?.lng,
                updated_at: j.updatedAt.getTime(),
            })),
            deleted: []
        };

        // Checklists
        const updatedChecklists = await this.prisma.checklist.findMany({
            where: {
                updatedAt: { gt: date }
            }
        });

        changes.checklists = {
            created: [],
            updated: updatedChecklists.map(c => ({
                id: c.id,
                journey_id: c.journeyId,
                type: c.type,
                items: JSON.stringify(c.items),
                updated_at: c.updatedAt.getTime(),
            })),
            deleted: []
        };

        return { changes, timestamp: Date.now() };
    }

    async push(changes: any, userId: string) {
        if (changes.journeys) {
            const { created, updated } = changes.journeys;

            for (const j of created) {
                await this.prisma.journey.create({
                    data: {
                        id: j.id,
                        driverId: userId,
                        vehicleId: j.vehicle_id,
                        status: j.status,
                        startKm: j.start_km,
                        startTime: new Date(j.start_time),
                        startLocation: j.start_lat ? { lat: j.start_lat, lng: j.start_lng } : undefined,
                        updatedAt: new Date(j.updated_at || Date.now()),
                    } as any
                }).catch(e => console.error('Sync Create Journey Error', e));
            }

            for (const j of updated) {
                await this.prisma.journey.update({
                    where: { id: j.id },
                    data: {
                        status: j.status,
                        endKm: j.end_km,
                        endTime: j.end_time ? new Date(j.end_time) : null,
                        endLocation: j.end_lat ? { lat: j.end_lat, lng: j.end_lng } : undefined,
                        updatedAt: new Date(j.updated_at || Date.now()),
                    }
                }).catch(e => console.error('Sync Update Journey Error', e));
            }
        }

        if (changes.checklists) {
            const { created, updated } = changes.checklists;

            for (const c of created) {
                await this.prisma.checklist.create({
                    data: {
                        id: c.id,
                        journeyId: c.journey_id,
                        type: c.type,
                        items: typeof c.items === 'string' ? JSON.parse(c.items) : c.items,
                        updatedAt: new Date(c.updated_at || Date.now()),
                    }
                }).catch(e => console.error('Sync Create Checklist Error', e));
            }

            for (const c of updated) {
                await this.prisma.checklist.update({
                    where: { id: c.id },
                    data: {
                        items: typeof c.items === 'string' ? JSON.parse(c.items) : c.items,
                        updatedAt: new Date(c.updated_at || Date.now()),
                    }
                }).catch(e => console.error('Sync Update Checklist Error', e));
            }
        }
    }
}
