import { Platform } from 'react-native';

export type SyncStatus = 'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR';

type SyncListener = (status: SyncStatus) => void;

class SyncService {
    private isSyncing = false;
    private status: SyncStatus = 'IDLE';
    private listeners: SyncListener[] = [];
    private syncInterval: ReturnType<typeof setInterval> | null = null;
    private token: string | null = null;

    setToken(token: string) {
        this.token = token;
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
        // WatermelonDB sync only works on native platforms (SQLite)
        if (Platform.OS === 'web' || this.isSyncing || !this.token) return;

        this.isSyncing = true;
        this.notifyListeners('SYNCING');

        try {
            const [{ synchronize }, { database }, NetInfo] = await Promise.all([
                import('@nozbe/watermelondb/sync'),
                import('../model/database'),
                import('@react-native-community/netinfo').then(m => m.default),
            ]);

            const netState = await NetInfo.fetch();
            if (!netState.isConnected) {
                this.notifyListeners('IDLE');
                return;
            }

            const API_URL = 'https://frota.johnatamoreira.com.br/api/sync';

            await synchronize({
                database,
                pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
                    const params = new URLSearchParams({
                        last_pulled_at: lastPulledAt ? String(lastPulledAt) : '0',
                        schema_version: String(schemaVersion),
                        migration: migration ? JSON.stringify(migration) : ''
                    });

                    const response = await fetch(`${API_URL}?${params.toString()}`, {
                        headers: { 'Authorization': `Bearer ${this.token}` }
                    });

                    if (!response.ok) throw new Error(await response.text());

                    const { changes, timestamp } = await response.json();
                    return { changes, timestamp };
                },
                pushChanges: async ({ changes, lastPulledAt }) => {
                    const response = await fetch(`${API_URL}?last_pulled_at=${lastPulledAt || 0}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${this.token}`
                        },
                        body: JSON.stringify(changes),
                    });

                    if (!response.ok) throw new Error(await response.text());
                },
                migrationsEnabledAtVersion: 1,
            });

            this.notifyListeners('SUCCESS');
        } catch (error) {
            console.error('Sync failed:', error);
            this.notifyListeners('ERROR');
        } finally {
            this.isSyncing = false;
        }
    }
}

export const syncService = new SyncService();
