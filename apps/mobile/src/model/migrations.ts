import { schemaMigrations, createTable } from '@nozbe/watermelondb/Schema/migrations'

export default schemaMigrations({
    migrations: [
        {
            toVersion: 3,
            steps: [
                createTable({
                    name: 'expenses',
                    columns: [
                        { name: 'journey_id', type: 'string', isIndexed: true },
                        { name: 'type', type: 'string' },
                        { name: 'amount', type: 'number' },
                        { name: 'payment_method', type: 'string' },
                        { name: 'description', type: 'string', isOptional: true },
                        { name: 'receipt_photo_url', type: 'string', isOptional: true },
                        { name: 'status', type: 'string' },
                        { name: 'backend_id', type: 'string', isOptional: true },
                        { name: 'updated_at', type: 'number' },
                    ],
                }),
                createTable({
                    name: 'tasks',
                    columns: [
                        { name: 'journey_id', type: 'string', isIndexed: true },
                        { name: 'title', type: 'string' },
                        { name: 'description', type: 'string', isOptional: true },
                        { name: 'status', type: 'string' },
                        { name: 'lat', type: 'number', isOptional: true },
                        { name: 'lng', type: 'number', isOptional: true },
                        { name: 'scheduled_at', type: 'number', isOptional: true },
                        { name: 'completed_at', type: 'number', isOptional: true },
                        { name: 'backend_id', type: 'string', isOptional: true },
                        { name: 'updated_at', type: 'number' },
                    ],
                }),
                createTable({
                    name: 'documents',
                    columns: [
                        { name: 'vehicle_id', type: 'string', isOptional: true, isIndexed: true },
                        { name: 'driver_id', type: 'string', isOptional: true, isIndexed: true },
                        { name: 'type', type: 'string' },
                        { name: 'name', type: 'string' },
                        { name: 'number', type: 'string', isOptional: true },
                        { name: 'expiry_date', type: 'number', isOptional: true },
                        { name: 'file_url', type: 'string' },
                        { name: 'backend_id', type: 'string', isOptional: true },
                        { name: 'updated_at', type: 'number' },
                    ],
                }),
            ],
        },
        {
            toVersion: 2,
            steps: [
                createTable({
                    name: 'sync_queue',
                    columns: [
                        { name: 'action_type', type: 'string' },
                        { name: 'payload', type: 'string' },
                        { name: 'photo_uri', type: 'string', isOptional: true },
                        { name: 'status', type: 'string' },
                        { name: 'retries', type: 'number' },
                        { name: 'error', type: 'string', isOptional: true },
                        { name: 'updated_at', type: 'number' },
                    ],
                }),
            ],
        },
    ],
})
