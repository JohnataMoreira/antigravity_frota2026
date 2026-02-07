import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export default class Vehicle extends Model {
    static table = 'vehicles'

    @field('plate') plate!: string
    @field('model') model!: string
    @field('brand') brand!: string
    @field('status') status!: string
    @field('current_km') currentKm!: number
    @readonly @date('updated_at') updatedAt!: number
}
