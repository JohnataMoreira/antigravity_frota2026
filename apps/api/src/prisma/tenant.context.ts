import { AsyncLocalStorage } from 'async_hooks';

export interface TenantState {
    organizationId?: string;
    bypassAuth?: boolean;
}

export class TenantContext {
    private static storage = new AsyncLocalStorage<TenantState>();

    static run<T>(organizationId: string, next: () => T): T {
        return this.storage.run({ organizationId }, next);
    }

    static runBypass<T>(next: () => T): T {
        return this.storage.run({ bypassAuth: true }, next);
    }

    static get(): string | undefined {
        const state = this.storage.getStore();
        return state?.organizationId;
    }

    static isBypass(): boolean {
        const state = this.storage.getStore();
        return state?.bypassAuth === true;
    }
}
