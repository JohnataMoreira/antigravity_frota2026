import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export default class SyncQueue extends Model {
    static table = 'sync_queue'

    @field('action_type') actionType!: string
    @field('payload') payload!: string
    @field('photo_uri') photoUri?: string
    @field('status') status!: string // 'pending' | 'processing' | 'failed' | 'completed'
    @field('retries') retries!: number
    @field('error') error?: string
    @readonly @date('updated_at') updatedAt!: number
}
