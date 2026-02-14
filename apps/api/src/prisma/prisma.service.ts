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

                        // Skip isolation for Organization model itself or if no tenant context is available (e.g. login/seed)
                        if (model === 'Organization' || !organizationId) {
                            return query(args);
                        }

                        // Apply organizationId to filters
                        if (['findFirst', 'findMany', 'count', 'update', 'updateMany', 'delete', 'deleteMany', 'aggregate'].includes(operation)) {
                            /* eslint-disable @typescript-eslint/no-explicit-any */
                            const anyArgs = (args || {}) as any;
                            anyArgs.where = { ...anyArgs.where, organizationId };
                            args = anyArgs;
                        }

                        // Apply organizationId to data on creation
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
