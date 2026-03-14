import { Database } from '@nozbe/watermelondb'
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'
import { Platform } from 'react-native'

import { mySchema } from './schema'
import migrations from './migrations'
import Vehicle from './Vehicle'
import Journey from './Journey'
import Checklist from './Checklist'
import SyncQueue from './SyncQueue'
import Expense from './Expense'
import Task from './Task'
import AppDocument from './AppDocument'

// Create the adapter
const adapter = new SQLiteAdapter({
    dbName: 'frota',
    schema: mySchema,
    migrations,
    jsi: true,
    onSetUpError: error => {
        console.error('Database setup error:', error);
    }
});

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
