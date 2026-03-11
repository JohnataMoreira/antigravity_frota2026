import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export default class Journey extends Model {
    static table = 'journeys'

    @field('vehicle_id') vehicleId: string = ''
    @field('driver_id') driverId: string = ''
    @field('status') status: string = ''
    @field('start_km') startKm: number = 0
    @field('end_km') endKm: number | undefined = undefined
    @date('start_time') startTime: number = 0
    @date('end_time') endTime: number | undefined = undefined
    @field('start_lat') startLat: number | undefined = undefined
    @field('start_lng') startLng: number | undefined = undefined
    @field('end_lat') endLat: number | undefined = undefined
    @field('end_lng') endLng: number | undefined = undefined
    @field('backend_id') backendId: string | undefined = undefined
    @field('start_photo_url') startPhotoUrl: string | undefined = undefined
    @readonly @date('updated_at') updatedAt: number = 0
}
