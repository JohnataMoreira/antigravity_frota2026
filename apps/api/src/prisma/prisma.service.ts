import { Injectable, OnModuleInit, OnModuleDestroy, UnauthorizedException } from '@nestjs/common';
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

                        // 2. SECURE CHECK: Fail-Closed enforcement for Isolated Models
                        if (!organizationId) {
                            // If explicit bypass is active (e.g., login, registration, internal scripts), permit global query
                            if (TenantContext.isBypass()) {
                                return query(args);
                            }

                            // If we are performing a create/createMany/upsert AND the data already explicitly injects an organizationId, permit (useful for seeded tests)
                            const anyArgs = (args || {}) as any;
                            const isCreateWithOrg = (['create', 'createMany', 'upsert'].includes(operation)) &&
                                (anyArgs?.data?.organizationId || anyArgs?.create?.organizationId);

                            if (isCreateWithOrg) {
                                return query(args);
                            }

                            // FAIL CLOSED: Isolated model accessed without organizationId and without explicit bypass
                            throw new UnauthorizedException(`[SECURITY FATAL] Fail-Closed Intervention: Attempted to query isolated model '${String(model)}' without TenantContext (organizationId) or explicit Authentication Bypass.`);
                        }

                        // 3. Apply organizationId to filters/data ONLY if context is present
                        if (organizationId) {
                            // Apply to filters
                            if (['findFirst', 'findMany', 'count', 'update', 'updateMany', 'delete', 'deleteMany', 'aggregate', 'findUnique'].includes(operation)) {
                                /* eslint-disable @typescript-eslint/no-explicit-any */
                                const anyArgs = (args || {}) as any;
                                anyArgs.where = { ...anyArgs.where, organizationId };
                                args = anyArgs;
                            }

                            // Apply to data on creation
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

                            // Specific check for upsert
                            if (operation === 'upsert') {
                                /* eslint-disable @typescript-eslint/no-explicit-any */
                                const anyArgs = (args || {}) as any;
                                anyArgs.create = { ...anyArgs.create, organizationId };
                                anyArgs.update = { ...anyArgs.update, organizationId };
                                anyArgs.where = { ...anyArgs.where, organizationId };
                                args = anyArgs;
                            }
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
