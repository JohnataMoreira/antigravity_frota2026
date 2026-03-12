export interface SyncTableChange<T> {
    created: T[];
    updated: T[];
    deleted: string[];
}

export interface SyncPushChanges {
    vehicles?: SyncTableChange<any>;
    journeys?: SyncTableChange<any>;
    checklists?: SyncTableChange<any>;
    tasks?: SyncTableChange<any>;
    expenses?: SyncTableChange<any>;
}

export interface SyncPullResponse {
    changes: {
        vehicles: SyncTableChange<any>;
        journeys: SyncTableChange<any>;
        checklists: SyncTableChange<any>;
        tasks: SyncTableChange<any>;
        expenses: SyncTableChange<any>;
        documents: SyncTableChange<any>;
    };
    timestamp: number;
}
