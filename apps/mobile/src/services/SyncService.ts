import { Platform } from 'react-native';
import { API_URL } from './api';

export type SyncStatus = 'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR';
type SyncListener = (status: SyncStatus) => void;

class SyncService {
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
        if (Platform.OS === 'web' || !this.token) return;

        if (this.syncPromise) {
            console.log('[Sync] Sync already in progress, awaiting...');
            return this.syncPromise;
        }

        this.syncPromise = (async () => {
            console.log(`[Sync] Starting synchronization process... (ForceReset: ${this.forceReset})`);
            this.isSyncing = true;
            this.notifyListeners('SYNCING');

            try {
                // Lazy loading heavy dependencies to avoid startup crashes
                const [
                    { synchronize },
                    NetInfo,
                    { database }
                ] = await Promise.all([
                    import('@nozbe/watermelondb/sync'),
                    import('@react-native-community/netinfo').then(m => m.default),
                    import('../model/database')
                ]);

                const netState = await NetInfo.fetch();
                if (!netState.isConnected) {
                    console.log('[Sync] Disconnected: No network.');
                    this.notifyListeners('IDLE');
                    return;
                }

                if (this.forceReset) {
                    console.log('[Sync] PHASE: RESET - Purging local database...');
                    try {
                        await database.unsafeResetDatabase();
                    } catch (resetError) {
                        console.error('[Sync] RESET FAILED:', resetError);
                    }
                }

                console.log('[Sync] PHASE: PULL/PUSH - Initiating...');
                
                const fetchWithRetry = async (url: string, options: any, retries = 3) => {
                    for (let i = 0; i <= retries; i++) {
                        try {
                            const response = await fetch(url, options);
                            if (response.ok) return response;
                            
                            // Don't retry on client errors (4xx) except 429
                            if (response.status >= 400 && response.status < 500 && response.status !== 429) {
                                return response;
                            }

                            if (i === retries) return response;
                            
                            // Exponential backoff: 1.5s, 3s, 6s...
                            const delay = Math.min(1500 * Math.pow(2, i), 10000);
                            console.log(`[Sync] Attempt ${i + 1} failed (${response.status}). Retrying in ${delay}ms...`);
                            await new Promise(resolve => setTimeout(resolve, delay));
                        } catch (err) {
                            if (i === retries) throw err;
                            const delay = Math.min(1500 * Math.pow(2, i), 10000);
                            console.log(`[Sync] Network error. Attempt ${i + 1} failed. Retrying in ${delay}ms...`);
                            await new Promise(resolve => setTimeout(resolve, delay));
                        }
                    }
                };

                await synchronize({
                    database,
                    pullChanges: async ({ lastPulledAt }) => {
                        const effectivelyLastPulledAt = this.forceReset ? 0 : (lastPulledAt || 0);
                        const response = await fetchWithRetry(`${API_URL}/sync/pull?lastPulledAt=${effectivelyLastPulledAt}`, {
                            headers: { 'Authorization': `Bearer ${this.token}` }
                        });

                        if (!response || !response.ok) throw new Error(`Pull failed: ${response?.status}`);

                        const { changes, timestamp } = await response.json();
                        return { changes, timestamp };
                    },
                    pushChanges: async ({ changes }) => {
                        if (this.forceReset) return;

                        const response = await fetchWithRetry(`${API_URL}/sync/push`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${this.token}`
                            },
                            body: JSON.stringify(changes)
                        });

                        if (!response || !response.ok) throw new Error(`Push failed: ${response?.status}`);
                    },
                    migrationsEnabledAtVersion: 1,
                    sendCreatedAsUpdated: true,
                });

                console.log('[Sync] Synchronize COMPLETE.');
                this.forceReset = false;
                this.notifyListeners('IDLE');
                this.notifyListeners('SUCCESS');

            } catch (error: any) {
                console.error('[Sync] SYNC PROCESS FAILED:', error);
                this.notifyListeners('ERROR');
            } finally {
                this.syncPromise = null;
                this.isSyncing = false;
            }
        })();

        return this.syncPromise;
    }
}

export const syncService = new SyncService();
