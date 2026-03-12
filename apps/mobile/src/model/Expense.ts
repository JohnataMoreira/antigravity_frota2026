import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export default class Expense extends Model {
    static table = 'expenses'

    @field('journey_id') journeyId!: string
    @field('type') type!: string
    @field('amount') amount!: number
    @field('payment_method') paymentMethod!: string
    @field('description') description?: string
    @field('receipt_photo_url') receiptPhotoUrl?: string
    @field('status') status!: string
    @field('backend_id') backendId?: string
    @readonly @date('updated_at') updatedAt!: number
}
