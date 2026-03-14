import { Model, Relation, Query } from '@nozbe/watermelondb'
import { field, date, readonly, relation, children } from '@nozbe/watermelondb/decorators'
import Vehicle from './Vehicle'
import Task from './Task'
import Expense from './Expense'
import Checklist from './Checklist'

export default class Journey extends Model {
    static table = 'journeys'
    static associations = {
        vehicles: { type: 'belongs_to', key: 'vehicle_id' },
        tasks: { type: 'has_many', foreignKey: 'journey_id' },
        expenses: { type: 'has_many', foreignKey: 'journey_id' },
        checklists: { type: 'has_many', foreignKey: 'journey_id' },
    } as const

    @relation('vehicles', 'vehicle_id') vehicle!: Relation<Vehicle>
    @field('vehicle_id') vehicleId!: string
    @field('driver_id') driverId!: string
    @field('status') status!: string
    @field('start_km') startKm!: number
    @field('end_km') endKm?: number
    @date('start_time') startTime!: number
    @date('end_time') endTime?: number
    @field('start_lat') startLat?: number
    @field('start_lng') startLng?: number
    @field('end_lat') endLat?: number
    @field('end_lng') endLng?: number
    @field('backend_id') backendId?: string
    @field('start_photo_url') startPhotoUrl?: string
    @readonly @date('updated_at') updatedAt!: number

    @children('tasks') tasks!: Query<Task>
    @children('expenses') expenses!: Query<Expense>
    @children('checklists') checklists!: Query<Checklist>
}
