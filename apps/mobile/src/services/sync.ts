import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from '../model/database';

const API_URL = 'https://api.johnatamoreira.com.br/sync'; // Production API URL

export async function sync() {
    await synchronize({
        database,
        pullChanges: async ({ lastPulledAt }) => {
            const response = await fetch(`${API_URL}?last_pulled_at=${lastPulledAt || 0}`, {
                headers: {
                    // 'Authorization': `Bearer ${token}` // TODO: Add Auth
                }
            });
            if (!response.ok) {
                throw new Error(await response.text());
            }
            const { changes, timestamp } = await response.json();
            return { changes, timestamp };
        },
        pushChanges: async ({ changes, lastPulledAt }) => {
            const response = await fetch(`${API_URL}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(changes),
            });
            if (!response.ok) {
                throw new Error(await response.text());
            }
        },
        migrationsEnabledAtVersion: 1,
    });
}
