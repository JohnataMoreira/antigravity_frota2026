// Web stub - WatermelonDB sync and SQLite are not available on web.
// Metro automatically uses this file instead of SyncService.ts when bundling for web.

export type SyncStatus = 'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR';

class SyncServiceStub {
    setToken(_token: string) {}
    subscribe(_listener: (s: SyncStatus) => void) { return () => {}; }
    async sync() {}
}

export const syncService = new SyncServiceStub();
