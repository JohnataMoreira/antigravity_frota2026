import { Model, Relation } from '@nozbe/watermelondb'
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators'
import Journey from './Journey'

export default class Task extends Model {
    static table = 'tasks'
    static associations = {
        journeys: { type: 'belongs_to', key: 'journey_id' },
    } as const

    @relation('journeys', 'journey_id') journey!: Relation<Journey>
    @field('journey_id') journeyId!: string
    @field('title') title!: string
    @field('description') description?: string
    @field('status') status!: string
    @field('lat') lat?: number
    @field('lng') lng?: number
    @date('scheduled_at') scheduledAt?: number
    @date('completed_at') completedAt?: number
    @field('backend_id') backendId?: string
    @readonly @date('updated_at') updatedAt!: number
}
