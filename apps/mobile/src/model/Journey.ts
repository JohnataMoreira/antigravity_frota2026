import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export default class Journey extends Model {
    static table = 'journeys'

    @field('vehicle_id') vehicleId!: string
    @field('driver_id') driverId!: string
    @field('status') status!: string
    @field('start_km') startKm!: number
    @field('end_km') endKm?: number
    @date('start_time') startTime!: number
    @date('end_time') endTime?: number
    @field('backend_id') backendId?: string
    @readonly @date('updated_at') updatedAt!: number
}
