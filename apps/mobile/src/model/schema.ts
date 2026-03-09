import { appSchema, tableSchema } from '@nozbe/watermelondb'

export const mySchema = appSchema({
    version: 3, // Increment version
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
            ],
        }),
        tableSchema({
            name: 'checklists',
            columns: [
                { name: 'journey_id', type: 'string' },
                { name: 'type', type: 'string' },
                { name: 'items', type: 'string' }, // JSON string
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
