import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export default class AppDocument extends Model {
    static table = 'documents'

    @field('vehicle_id') vehicleId?: string
    @field('driver_id') driverId?: string
    @field('type') type!: string
    @field('name') name!: string
    @field('number') number?: string
    @date('expiry_date') expiryDate?: number
    @field('file_url') fileUrl!: string
    @field('backend_id') backendId?: string
    @readonly @date('updated_at') updatedAt!: number
}
