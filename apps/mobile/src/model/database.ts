import { Database } from '@nozbe/watermelondb'
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'

import { mySchema } from './schema'
import Vehicle from './Vehicle'
import Journey from './Journey'

// First, create the adapter to the underlying database:
const adapter = new SQLiteAdapter({
    schema: mySchema,
    // (You might want to comment out the following line for production)
    // schemaVersion: 1, 
    // migrations, // optional migrations
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
    ],
})
