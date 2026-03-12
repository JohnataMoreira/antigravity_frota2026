import { Database } from '@nozbe/watermelondb'
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'

import { mySchema } from './schema'
import migrations from './migrations'
import Vehicle from './Vehicle'
import Journey from './Journey'
import Checklist from './Checklist'
import SyncQueue from './SyncQueue'
import Expense from './Expense'
import Task from './Task'
import AppDocument from './AppDocument'

// First, create the adapter to the underlying database:
const adapter = new SQLiteAdapter({
    dbName: 'frota',
    schema: mySchema,
    migrations, // optional migrations
    jsi: true, /* Platform.OS === 'ios' */
    onSetUpError: error => {
        // Database failed to load -- offer the user to reload the app or log out
    }
})

// Then, make a Watermelon database from it!
export const database = new Database({
    adapter,
    modelClasses: [
        Vehicle,
        Journey,
        Checklist,
        SyncQueue,
        Expense,
        Task,
        AppDocument,
    ],
})
