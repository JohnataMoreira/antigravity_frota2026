import { AsyncLocalStorage } from 'async_hooks';

export class TenantContext {
    private static storage = new AsyncLocalStorage<string>();

    static run<T>(organizationId: string, next: () => T): T {
        return this.storage.run(organizationId, next);
    }

    static get(): string | undefined {
        return this.storage.getStore();
    }
}
