import { useEffect } from 'react';
import { db } from '../lib/offline-db';
import { api } from '../lib/axios';

/**
 * useSync Hook - The "Dumb-to-Smart" Synchronizer
 * 
 * Watches for online status and automatically tries to push
 * pending offline data (like checklists) to the server.
 */
export function useSync() {
    useEffect(() => {
        const syncPendingData = async () => {
            if (!navigator.onLine) return;

            const pending = await db.pendingChecklists
                .where('synced')
                .equals(0)
                .toArray();

            if (pending.length === 0) return;

            console.log(`[Sync] Found ${pending.length} pending checklists. Starting sync...`);

            for (const item of pending) {
                try {
                    if (item.journeyId.startsWith('OFFLINE_')) {
                        // This is a new journey start performed offline
                        await api.post('/journeys/start', {
                            vehicleId: (item as any).vehicleId,
                            startKm: (item as any).startKm,
                            plannedRoute: (item as any).plannedRoute,
                            destinationName: (item as any).destinationName,
                            checklistItems: item.items,
                            photos: (item as any).photos // Sync photos too
                        });
                    } else {
                        // This would be a secondary checklist or update
                        await api.post(`/journeys/${item.journeyId}/checklist`, {
                            items: item.items,
                            rating: item.rating,
                            offline: true,
                            timestamp: item.timestamp
                        });
                    }

                    // Delete from local DB instead of just marking (cleaner for mobile)
                    await db.pendingChecklists.delete(item.id!);
                    console.log(`[Sync] Item ${item.id} synced and removed from local DB.`);
                } catch (error) {
                    console.error(`[Sync] Failed to sync item ${item.id}:`, error);
                }
            }
        };

        // Run on mount
        syncPendingData();

        // Listen for connection recovery
        const handleOnline = () => {
            console.log('[Sync] Connection restored. Triggering sync...');
            syncPendingData();
        };

        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, []);
}
