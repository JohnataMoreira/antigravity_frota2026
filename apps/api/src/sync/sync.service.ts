import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SyncPushChanges, SyncPullResponse } from './dto/sync.dto';

@Injectable()
export class SyncService {
    constructor(private prisma: PrismaService) { }

    async pull(lastPulledAt: number, organizationId: string, userId: string): Promise<SyncPullResponse> {
        const date = new Date(lastPulledAt);

        // Vehicles
        const vehicles = await this.prisma.vehicle.findMany({
            where: {
                organizationId,
                updatedAt: { gt: date },
            },
            select: {
                id: true, plate: true, model: true, brand: true, status: true, currentKm: true, active: true, updatedAt: true
            }
        });

        const vehicleChanges = {
            created: [],
            updated: vehicles.filter(v => v.active),
            deleted: vehicles.filter(v => !v.active).map(v => v.id),
        };

        // Journeys (We start with limited history, maybe active only? or recent)
        // For now, let's not pull journeys to keep payload small, assuming mobile manages its own active journey mainly.
        // But if driver changes device? Need to pull.
        const updatedJourneys = await this.prisma.journey.findMany({
            where: {
                organizationId,
                updatedAt: { gt: date }
            }
        });

        const journeyChanges = {
            created: [],
            updated: updatedJourneys.map((j: any) => ({
                id: j.id,
                vehicle_id: j.vehicleId,
                driver_id: j.driverId,
                status: j.status,
                start_km: j.startKm,
                end_km: j.endKm,
                start_time: j.startTime.getTime(),
                end_time: j.endTime?.getTime(),
                start_lat: (j.startLocation as { lat: number, lng: number })?.lat,
                start_lng: (j.startLocation as { lat: number, lng: number })?.lng,
                end_lat: (j.endLocation as { lat: number, lng: number })?.lat,
                end_lng: (j.endLocation as { lat: number, lng: number })?.lng,
                updated_at: j.updatedAt.getTime(),
            })),
            deleted: []
        };

        // Checklists
        const updatedChecklists = await this.prisma.checklist.findMany({
            where: {
                journey: { organizationId },
                updatedAt: { gt: date }
            }
        });

        const checklistChanges = {
            created: [],
            updated: updatedChecklists.map((c: any) => ({
                id: c.id,
                journey_id: c.journeyId,
                type: c.type,
                items: JSON.stringify(c.items),
                updated_at: c.updatedAt.getTime(),
            })),
            deleted: []
        };

        // Tasks
        const updatedTasks = await this.prisma.task.findMany({
            where: { organizationId, updatedAt: { gt: date } }
        });

        const taskChanges = {
            created: [],
            updated: updatedTasks.map((t: any) => ({
                id: t.id,
                journey_id: t.journeyId,
                title: t.title,
                description: t.description,
                status: t.status,
                lat: t.latitude,
                lng: t.longitude,
                address: t.address,
                scheduled_at: t.scheduledAt?.getTime(),
                completed_at: t.completedAt?.getTime(),
                updated_at: t.updatedAt.getTime(),
            })),
            deleted: []
        };

        // Expenses (FinancialTransactions)
        const updatedExpenses = await this.prisma.financialTransaction.findMany({
            where: { organizationId, updatedAt: { gt: date } }
        });

        const expenseChanges = {
            created: [],
            updated: updatedExpenses.map((e: any) => ({
                id: e.id,
                journey_id: e.journeyId,
                type: e.category,
                amount: e.amount,
                payment_method: e.paymentMethod,
                description: e.description,
                receipt_photo_url: e.attachmentUrl,
                status: e.status,
                updated_at: e.updatedAt.getTime(),
            })),
            deleted: []
        };

        // Documents
        const updatedDocs = await this.prisma.document.findMany({
            where: {
                organizationId,
                OR: [
                    { userId: userId },
                    { vehicle: { journeys: { some: { driverId: userId, status: 'IN_PROGRESS' } } } }
                ],
                updatedAt: { gt: date }
            }
        });

        const documentChanges = {
            created: [],
            updated: updatedDocs.map((d: any) => ({
                id: d.id,
                vehicle_id: d.vehicleId,
                driver_id: d.userId,
                type: d.type,
                name: d.name,
                number: d.number,
                expiry_date: d.expiryDate?.getTime(),
                file_url: d.fileUrl,
                updated_at: d.updatedAt.getTime(),
            })),
            deleted: []
        };

        return { 
            changes: {
                vehicles: vehicleChanges,
                journeys: journeyChanges,
                checklists: checklistChanges,
                tasks: taskChanges,
                expenses: expenseChanges,
                documents: documentChanges
            } as any, 
            timestamp: Date.now() 
        };
    }

    async push(changes: SyncPushChanges, userId: string, organizationId: string) {
        if (changes.journeys) {
            const { created, updated } = changes.journeys;

            for (const j of created) {
                await this.prisma.journey.create({
                    data: {
                        id: j.id,
                        organizationId,
                        driverId: userId,
                        vehicleId: j.vehicle_id,
                        status: j.status,
                        startKm: j.start_km,
                        startTime: new Date(j.start_time),
                        startLocation: j.start_lat ? { lat: j.start_lat, lng: j.start_lng } : undefined,
                        updatedAt: new Date(j.updated_at || Date.now()),
                    } as any
                }).catch((e: Error) => console.error('Sync Create Journey Error', e));
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
                }).catch((e: Error) => console.error('Sync Update Journey Error', e));
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
                }).catch((e: Error) => console.error('Sync Update Checklist Error', e));
            }
        }

        if (changes.tasks) {
            const { created, updated } = changes.tasks;
            for (const t of created) {
                await this.prisma.task.create({
                    data: {
                        id: t.id,
                        organizationId,
                        journeyId: t.journey_id,
                        title: t.title,
                        description: t.description,
                        status: t.status,
                        latitude: t.lat,
                        longitude: t.lng,
                        address: t.address,
                        scheduledAt: t.scheduled_at ? new Date(t.scheduled_at) : undefined,
                        completedAt: t.completed_at ? new Date(t.completed_at) : undefined,
                        updatedAt: new Date(t.updated_at || Date.now()),
                    }
                }).catch((e: Error) => console.error('Sync Create Task Error', e));
            }
            for (const t of updated) {
                await this.prisma.task.update({
                    where: { id: t.id },
                    data: {
                        status: t.status,
                        completedAt: t.completed_at ? new Date(t.completed_at) : undefined,
                        updatedAt: new Date(t.updated_at || Date.now()),
                    }
                }).catch((e: Error) => console.error('Sync Update Task Error', e));
            }
        }

        if (changes.expenses) {
            const { created } = changes.expenses;
            for (const e of created) {
                await this.prisma.financialTransaction.create({
                    data: {
                        id: e.id,
                        organizationId,
                        journeyId: e.journey_id,
                        amount: e.amount,
                        category: e.type,
                        paymentMethod: e.payment_method,
                        description: e.description,
                        attachmentUrl: e.receipt_photo_url,
                        status: e.status,
                        type: 'EXPENSE',
                        dueDate: new Date(),
                        updatedAt: new Date(e.updated_at || Date.now()),
                    }
                }).catch((err: Error) => console.error('Sync Create Expense Error', err));
            }
        }
    }
}
