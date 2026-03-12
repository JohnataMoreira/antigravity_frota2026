import { database } from '../model/database';
import { api } from './api';
import { photoService } from './photoService';
import NetInfo from '@react-native-community/netinfo';
import SyncQueue from '../model/SyncQueue';

export type ActionType = 'REPORT_INCIDENT' | 'REGISTER_FUEL' | 'START_JOURNEY' | 'END_JOURNEY' | 'INGEST_TELEMETRY' | 'REGISTER_EXPENSE' | 'UPDATE_TASK_STATUS';

class OutboxService {
    private isProcessing = false;

    /**
     * Enqueue a new action for background synchronization
     */
    async enqueue(actionType: ActionType, payload: any, photoUri?: string) {
        console.log(`[Outbox] Enqueueing action: ${actionType}`);
        await database.write(async () => {
            await database.get<SyncQueue>('sync_queue').create(item => {
                item.actionType = actionType;
                item.payload = JSON.stringify(payload);
                item.photoUri = photoUri;
                item.status = 'pending';
                item.retries = 0;
            });
        });

        // Trigger processing immediately (will check network inside)
        this.processQueue();
    }

    /**
     * Process all pending items in the queue
     */
    async processQueue(token?: string) {
        if (this.isProcessing) return;
        this.isProcessing = true;

        try {
            const netState = await NetInfo.fetch();
            if (!netState.isConnected) {
                console.log('[Outbox] Offline. Skipping processing.');
                this.isProcessing = false;
                return;
            }

            const pendingItemsSnap = await database.get<SyncQueue>('sync_queue')
                .query()
                .fetch(); // fetch() is safer than snapshot from observe()

            if (!pendingItemsSnap || pendingItemsSnap.length === 0) {
                this.isProcessing = false;
                return;
            }

            const itemsToProcess = pendingItemsSnap.filter(i => i.status === 'pending' || i.status === 'failed');

            if (itemsToProcess.length === 0) {
                this.isProcessing = false;
                return;
            }

            console.log(`[Outbox] Processing ${itemsToProcess.length} pending items...`);

            for (const item of itemsToProcess) {
                try {
                    await this.processItem(item, token);
                } catch (e) {
                    console.error(`[Outbox] Failed to process item ${item.id}:`, e);
                }
            }
        } catch (error) {
            console.error('[Outbox] Global process error:', error);
        } finally {
            this.isProcessing = false;
        }
    }

    private async processItem(item: SyncQueue, token?: string) {
        // Mark as processing
        await database.write(async () => {
            await item.update(rec => { rec.status = 'processing'; });
        });

        try {
            let photoUrl = undefined;
            const payload = JSON.parse(item.payload);

            // 1. If has photo, upload it first
            if (item.photoUri && token) {
                console.log(`[Outbox] Uploading photo for action ${item.actionType}...`);
                photoUrl = await photoService.uploadPhoto(item.photoUri, token);
                if (!photoUrl) throw new Error('Photo upload failed');
                payload.photoUrl = photoUrl;
            }

            // 2. Call the targeted API
            console.log(`[Outbox] Calling API for action ${item.actionType}...`);
            if (item.actionType === 'REPORT_INCIDENT') {
                await api.reportIncident({ ...payload, photoUrl });
            } else if (item.actionType === 'REGISTER_FUEL') {
                await api.createFuelEntry(payload);
            } else if (item.actionType === 'START_JOURNEY') {
                const { vehicleId, startKm, checklistItems, location } = payload;
                await api.startJourney(vehicleId, startKm, checklistItems, location);
            } else if (item.actionType === 'END_JOURNEY') {
                const { journeyId, endKm, checklistItems, location } = payload;
                await api.endJourney(journeyId, endKm, checklistItems, location);
            } else if (item.actionType === 'INGEST_TELEMETRY') {
                await api.ingestTelemetry(payload.vehicleId, payload.data);
            } else if (item.actionType === 'REGISTER_EXPENSE') {
                await api.createExpense(payload);
            } else if (item.actionType === 'UPDATE_TASK_STATUS') {
                await api.updateTaskStatus(payload.taskId, payload.status);
            }

            // 3. Mark as completed
            await database.write(async () => {
                await item.update(rec => { rec.status = 'completed'; });
            });
            console.log(`[Outbox] ✅ Action ${item.actionType} completed!`);

        } catch (err: any) {
            console.error(`[Outbox] ❌ Item ${item.id} failed:`, err.message);
            await database.write(async () => {
                await item.update(rec => {
                    rec.status = 'failed';
                    rec.retries += 1;
                    rec.error = err.message;
                });
            });
            throw err;
        }
    }
}

export const outboxService = new OutboxService();
