import { appSchema, tableSchema } from '@nozbe/watermelondb'

export const mySchema = appSchema({
    version: 3,
    tables: [
        tableSchema({
            name: 'vehicles',
            columns: [
                { name: 'plate', type: 'string' },
                { name: 'model', type: 'string' },
                { name: 'brand', type: 'string' },
                { name: 'status', type: 'string' },
                { name: 'current_km', type: 'number' },
                { name: 'updated_at', type: 'number' },
            ],
        }),
        tableSchema({
            name: 'journeys',
            columns: [
                { name: 'vehicle_id', type: 'string' },
                { name: 'driver_id', type: 'string' },
                { name: 'status', type: 'string' },
                { name: 'start_km', type: 'number' },
                { name: 'end_km', type: 'number', isOptional: true },
                { name: 'start_time', type: 'number' },
                { name: 'end_time', type: 'number', isOptional: true },
                { name: 'start_lat', type: 'number', isOptional: true },
                { name: 'start_lng', type: 'number', isOptional: true },
                { name: 'end_lat', type: 'number', isOptional: true },
                { name: 'end_lng', type: 'number', isOptional: true },
                { name: 'backend_id', type: 'string', isOptional: true },
                { name: 'start_photo_url', type: 'string', isOptional: true },
                { name: 'updated_at', type: 'number' },
                { name: 'created_at', type: 'number' },
            ],
        }),
        tableSchema({
            name: 'checklists',
            columns: [
                { name: 'journey_id', type: 'string' },
                { name: 'type', type: 'string' },
                { name: 'items', type: 'string' }, // JSON string
                { name: 'updated_at', type: 'number' },
                { name: 'created_at', type: 'number' },
            ],
        }),
        tableSchema({
            name: 'expenses',
            columns: [
                { name: 'journey_id', type: 'string', isIndexed: true },
                { name: 'type', type: 'string' }, // TOLL, PARKING, FUEL, etc.
                { name: 'amount', type: 'number' },
                { name: 'payment_method', type: 'string' },
                { name: 'description', type: 'string', isOptional: true },
                { name: 'receipt_photo_url', type: 'string', isOptional: true },
                { name: 'status', type: 'string' }, // PENDING, APPROVED, PAID
                { name: 'backend_id', type: 'string', isOptional: true },
                { name: 'updated_at', type: 'number' },
                { name: 'created_at', type: 'number' },
            ],
        }),
        tableSchema({
            name: 'tasks',
            columns: [
                { name: 'journey_id', type: 'string', isIndexed: true },
                { name: 'title', type: 'string' },
                { name: 'description', type: 'string', isOptional: true },
                { name: 'status', type: 'string' }, // PENDING, COMPLETED, CANCELED
                { name: 'lat', type: 'number', isOptional: true },
                { name: 'lng', type: 'number', isOptional: true },
                { name: 'scheduled_at', type: 'number', isOptional: true },
                { name: 'completed_at', type: 'number', isOptional: true },
                { name: 'backend_id', type: 'string', isOptional: true },
                { name: 'updated_at', type: 'number' },
                { name: 'created_at', type: 'number' },
            ],
        }),
        tableSchema({
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
                { name: 'created_at', type: 'number' },
            ],
        }),
        tableSchema({
            name: 'sync_queue',
            columns: [
                { name: 'action_type', type: 'string' },
                { name: 'payload', type: 'string' }, // JSON string
                { name: 'photo_uri', type: 'string', isOptional: true },
                { name: 'status', type: 'string' }, // 'pending' | 'processing' | 'failed' | 'completed'
                { name: 'retries', type: 'number' },
                { name: 'error', type: 'string', isOptional: true },
                { name: 'updated_at', type: 'number' },
            ],
        }),
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
