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
                updated_at: j.updatedAt.getTime(),
            })),
            deleted: []
        };

        return { changes, timestamp: Date.now() };
    }

    async push(changes: any, userId: string) {
        // Process pushed changes
        // WatermelonDB sends { vehicles: { created: [], updated: [], deleted: [] }, ... }

        // We only expect Journey creations/updates from Mobile (Drivers)
        if (changes.journeys) {
            const { created, updated } = changes.journeys;

            for (const j of created) {
                // Create journey
                // Note: ID in mobile is temporary? WatermelonDB uses UUIDs usually.
                // We should use the ID from mobile if it's a UUID, or map it.
                // Prisma schema has auto-uuid. If we force ID, it might work if valid UUID.
                await this.prisma.journey.create({
                    data: {
                        id: j.id, // Trust mobile ID?
                        driverId: userId, // Enforce current user as driver
                        vehicleId: j.vehicle_id,
                        status: j.status,
                        startKm: j.start_km,
                        startTime: new Date(j.start_time),
                        updatedAt: new Date(j.updated_at || Date.now()),
                    } as any // organizationId is injected by Prisma Extension
                }).catch(e => console.error('Sync Create Error', e));
            }

            for (const j of updated) {
                await this.prisma.journey.update({
                    where: { id: j.id },
                    data: {
                        status: j.status,
                        endKm: j.end_km,
                        endTime: j.end_time ? new Date(j.end_time) : null,
                        updatedAt: new Date(j.updated_at || Date.now()),
                    }
                }).catch(e => console.error('Sync Update Error', e));
            }
        }

        // Vehicles: Mobile might update KM on sync?
        // Usually via Journey End.
    }
}
