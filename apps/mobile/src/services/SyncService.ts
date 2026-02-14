import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from '../model/database';
import NetInfo from '@react-native-community/netinfo';
import { AppState, AppStateStatus } from 'react-native';

const API_URL = 'https://frota.johnatamoreira.com.br/api/sync';
const SYNC_INTERVAL = 1000 * 60 * 5; // 5 minutes

export type SyncStatus = 'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR';

type SyncListener = (status: SyncStatus) => void;

class SyncService {
    private isSyncing = false;
    private status: SyncStatus = 'IDLE';
    private listeners: SyncListener[] = [];
    private syncInterval: NodeJS.Timeout | null = null;
    private token: string | null = null;

    constructor() {
        this.setupAutoSync();
    }

    setToken(token: string) {
        this.token = token;
    }

    private setupAutoSync() {
        // Sync on app foreground
        AppState.addEventListener('change', this.handleAppStateChange);

        // Sync on network restore
        NetInfo.addEventListener(state => {
            if (state.isConnected && this.status === 'ERROR') {
                this.sync();
            }
        });

        // Periodic sync
        this.startPeriodicSync();
    }

    private handleAppStateChange = (nextAppState: AppStateStatus) => {
        if (nextAppState === 'active') {
            this.sync();
            this.startPeriodicSync();
        } else {
            this.stopPeriodicSync();
        }
    };

    private startPeriodicSync() {
        if (this.syncInterval) clearInterval(this.syncInterval);
        this.syncInterval = setInterval(() => {
            this.sync();
        }, SYNC_INTERVAL);
    }

    private stopPeriodicSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
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
        if (this.isSyncing || !this.token) return;

        const netState = await NetInfo.fetch();
        if (!netState.isConnected) {
            return; // Silent fail if offline
        }

        this.isSyncing = true;
        this.notifyListeners('SYNCING');

        try {
            await synchronize({
                database,
                pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
                    const params = new URLSearchParams({
                        last_pulled_at: lastPulledAt ? String(lastPulledAt) : '0',
                        schema_version: String(schemaVersion),
                        migration: migration ? JSON.stringify(migration) : ''
                    });

                    const response = await fetch(`${API_URL}?${params.toString()}`, {
                        headers: {
                            'Authorization': `Bearer ${this.token}`
                        }
                    });

                    if (!response.ok) {
                        throw new Error(await response.text());
                    }

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

                    if (!response.ok) {
                        throw new Error(await response.text());
                    }
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
