import { Model, Relation } from '@nozbe/watermelondb'
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators'
import Journey from './Journey'

export default class Expense extends Model {
    static table = 'expenses'
    static associations = {
        journeys: { type: 'belongs_to', key: 'journey_id' },
    } as const

    @relation('journeys', 'journey_id') journey!: Relation<Journey>
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
