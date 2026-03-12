import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export default class Task extends Model {
    static table = 'tasks'

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
