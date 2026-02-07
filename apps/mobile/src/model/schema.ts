import { appSchema, tableSchema } from '@nozbe/watermelondb'

export const mySchema = appSchema({
    version: 1,
    tables: [
        tableSchema({
            name: 'vehicles',
            columns: [
                { name: 'plate', type: 'string' },
                { name: 'model', type: 'string' },
                { name: 'brand', type: 'string' },
                { name: 'status', type: 'string' }, // AVAILABLE, IN_USE, etc.
                { name: 'current_km', type: 'number' },
                { name: 'updated_at', type: 'number' }, // For sync
            ],
        }),
        tableSchema({
            name: 'journeys',
            columns: [
                { name: 'vehicle_id', type: 'string' },
                { name: 'driver_id', type: 'string' },
                { name: 'status', type: 'string' }, // IN_PROGRESS, COMPLETED, SYNCED
                { name: 'start_km', type: 'number' },
                { name: 'end_km', type: 'number', isOptional: true },
                { name: 'start_time', type: 'number' },
                { name: 'end_time', type: 'number', isOptional: true },
                { name: 'backend_id', type: 'string', isOptional: true }, // ID in Postgres
                { name: 'updated_at', type: 'number' },
            ],
        }),
        // User info mainly for caching driver name but Auth handled separately usually
        tableSchema({
            name: 'user_profile',
            columns: [
                { name: 'name', type: 'string' },
                { name: 'email', type: 'string' },
                { name: 'license_number', type: 'string' },
            ]
        })
    ],
})
