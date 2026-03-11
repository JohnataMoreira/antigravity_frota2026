import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export default class Checklist extends Model {
    static table = 'checklists'

    @field('journey_id') journeyId: string = ''
    @field('type') type: string = ''
    @field('items') items: string = '' // JSON string
    @readonly @date('updated_at') updatedAt: number = 0
}
