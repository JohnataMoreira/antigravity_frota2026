import { Platform } from 'react-native';
import { API_URL } from './api';

export type SyncStatus = 'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR';
type SyncListener = (status: SyncStatus) => void;

class SyncServiceWeb {
    private isSyncing = false;
    private status: SyncStatus = 'IDLE';
    private listeners: SyncListener[] = [];
    private token: string | null = null;
    private forceReset = false;
    private syncPromise: Promise<void> | null = null;

    setToken(token: string) {
        this.token = token;
    }

    setForceReset(value: boolean) {
        this.forceReset = value;
    }

    subscribe(listener: SyncListener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notifyListeners(status: SyncStatus) {
        this.status = status;
        this.listeners.forEach(l => l(status));
    }

    async sync() {
        if (!this.token) {
            console.warn('[Sync-Web] Sync skipped: No token provided.');
            return;
        }

        if (this.syncPromise) {
            console.log('[Sync-Web] Sync already in progress, awaiting...');
            return this.syncPromise;
        }

        this.syncPromise = (async () => {
            console.log(`[Sync-Web] Starting synchronization process...`);
            this.isSyncing = true;
            this.notifyListeners('SYNCING');

            try {
                const [
                    { synchronize },
                    { database }
                ] = await Promise.all([
                    import('@nozbe/watermelondb/sync'),
                    import('../model/database')
                ]);

                if (this.forceReset) {
                    console.log('[Sync-Web] PHASE: RESET - Purging local database...');
                    try {
                        await database.unsafeResetDatabase();
                    } catch (resetError) {
                        console.error('[Sync-Web] RESET FAILED:', resetError);
                    }
                }

                await synchronize({
                    database,
                    pullChanges: async ({ lastPulledAt }) => {
                        const effectivelyLastPulledAt = this.forceReset ? 0 : (lastPulledAt || 0);
                        const response = await fetch(`${API_URL}/sync/pull?lastPulledAt=${effectivelyLastPulledAt}`, {
                            headers: { 'Authorization': `Bearer ${this.token}` }
                        });

                        if (!response.ok) throw new Error(`Pull failed: ${response.status}`);

                        const { changes, timestamp } = await response.json();
                        return { changes, timestamp };
                    },
                    pushChanges: async ({ changes }) => {
                        if (this.forceReset) return;

                        const response = await fetch(`${API_URL}/sync/push`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${this.token}`
                            },
                            body: JSON.stringify(changes)
                        });

                        if (!response.ok) throw new Error(`Push failed: ${response.status}`);
                    },
                    migrationsEnabledAtVersion: 1,
                    sendCreatedAsUpdated: true,
                });

                console.log('[Sync-Web] Synchronize COMPLETE.');
                this.forceReset = false;
                this.notifyListeners('IDLE');
                this.notifyListeners('SUCCESS');

            } catch (error: any) {
                console.error('[Sync-Web] SYNC PROCESS FAILED:', error);
                this.notifyListeners('ERROR');
            } finally {
                this.syncPromise = null;
                this.isSyncing = false;
            }
        })();

        return this.syncPromise;
    }
}

export const syncService = new SyncServiceWeb();
