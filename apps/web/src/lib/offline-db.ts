import Dexie, { Table } from 'dexie';

export interface OfflineChecklist {
    id?: number;
    journeyId: string;
    items: any[];
    photos: string[]; // Base64 strings for offline
    rating: number;
    timestamp: number;
    synced: boolean;
}

export interface CachedData {
    key: string;
    data: any;
    updatedAt: number;
}

export class FrotaOfflineDB extends Dexie {
    pendingChecklists!: Table<OfflineChecklist>;
    cache!: Table<CachedData>;

    constructor() {
        super('Frota2026Offline');
        this.version(1).stores({
            pendingChecklists: '++id, journeyId, synced, timestamp',
            cache: 'key'
        });
    }
}

export const db = new FrotaOfflineDB();
