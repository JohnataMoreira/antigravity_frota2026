import { Database } from '@nozbe/watermelondb'
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs'
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
const adapter = new LokiJSAdapter({
    schema: mySchema,
    migrations,
    useWebWorker: false,
    useIncrementalIndexedDB: true,
    dbName: 'frota-web',
    onSetUpError: (error: any) => {
        console.error('[Database] Web Setup Error:', error);
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
