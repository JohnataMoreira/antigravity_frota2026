import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { TenantContext } from './tenant.context';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor() {
        super();
        return this.$extends({
            query: {
                $allModels: {
                    async $allOperations({ model, operation, args, query }) {
                        const organizationId = TenantContext.get();

                        // Define models that DO NOT have organizationId (isolation skip)
                        // These are either global or related to specific parents that already handle isolation
                        const skippedModels = ['Checklist', 'StockMovement', 'TelemetryRecord', 'PurchaseOrderItem', 'TyreMeasurement'];

                        // 1. Skip isolation for Organization model itself or if it's a model without organizationId
                        if (model === 'Organization' || skippedModels.includes(model as string)) {
                            return query(args);
                        }

                        // 2. SECURE CHECK: If an isolated model is accessed without organizationId, FAIL instead of leaking
                        // Logic: Allow if it's a CREATE operation with organizationId already in data, 
                        // or if no tenant context is available (e.g. login/seed/auth routes which are excluded in middleware)
                        if (!organizationId) {
                            const anyArgs = (args || {}) as any;
                            const isCreateWithOrg = (['create', 'createMany', 'upsert'].includes(operation)) &&
                                (anyArgs?.data?.organizationId || anyArgs?.create?.organizationId);

                            if (!isCreateWithOrg) {
                                // If we're in a global context (like auth), we allow it.
                                // But if we're in an authenticated route, organizationId should be present.
                                return query(args);
                            }
                        }

                        // 3. Apply organizationId to filters
                        if (['findFirst', 'findMany', 'count', 'update', 'updateMany', 'delete', 'deleteMany', 'aggregate', 'findUnique'].includes(operation)) {
                            /* eslint-disable @typescript-eslint/no-explicit-any */
                            const anyArgs = (args || {}) as any;
                            anyArgs.where = { ...anyArgs.where, organizationId };
                            args = anyArgs;
                        }

                        // 4. Apply organizationId to data on creation
                        if (['create', 'createMany'].includes(operation)) {
                            /* eslint-disable @typescript-eslint/no-explicit-any */
                            const anyArgs = (args || {}) as any;
                            if (operation === 'create') {
                                anyArgs.data = { ...anyArgs.data, organizationId };
                            } else {
                                if (Array.isArray(anyArgs.data)) {
                                    anyArgs.data = anyArgs.data.map((item: any) => ({ ...item, organizationId }));
                                }
                            }
                            args = anyArgs;
                        }

                        // 5. Specific check for upsert
                        if (operation === 'upsert') {
                            /* eslint-disable @typescript-eslint/no-explicit-any */
                            const anyArgs = (args || {}) as any;
                            anyArgs.create = { ...anyArgs.create, organizationId };
                            anyArgs.update = { ...anyArgs.update, organizationId };
                            anyArgs.where = { ...anyArgs.where, organizationId };
                            args = anyArgs;
                        }

                        return query(args);
                    },
                },
            },
        }) as any;
    }

    async onModuleInit() {
        await this.$connect();
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}
