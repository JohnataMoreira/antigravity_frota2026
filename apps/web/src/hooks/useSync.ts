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
                    // Note: In a real scenario, we would map journeyId to the correct endpoint
                    // For the Frota2026 Checklists:
                    await api.post(`/journeys/${item.journeyId}/checklist`, {
                        items: item.items,
                        rating: item.rating,
                        offline: true,
                        timestamp: item.timestamp
                    });

                    // Mark as synced
                    await db.pendingChecklists.update(item.id!, { synced: true });
                    console.log(`[Sync] Checklist ${item.id} synced successfully.`);
                } catch (error) {
                    console.error(`[Sync] Failed to sync checklist ${item.id}:`, error);
                    // We don't mark as synced, so it stays in queue for next attempt
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
