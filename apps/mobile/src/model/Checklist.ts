import { Model, Relation } from '@nozbe/watermelondb'
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators'
import Journey from './Journey'

export default class Checklist extends Model {
    static table = 'checklists'
    static associations = {
        journeys: { type: 'belongs_to', key: 'journey_id' },
    } as const

    @relation('journeys', 'journey_id') journey!: Relation<Journey>
    @field('journey_id') journeyId!: string
    @field('type') type!: string
    @field('items') items!: string // JSON string
    @readonly @date('updated_at') updatedAt!: number
}
