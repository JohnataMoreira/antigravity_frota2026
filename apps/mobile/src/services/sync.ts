import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from '../model/database';

const API_URL = 'https://frota.johnatamoreira.com.br/api/sync';

export async function sync(token: string) {
    if (!token) return;

    await synchronize({
        database,
        pullChanges: async ({ lastPulledAt }) => {
            const response = await fetch(`${API_URL}?last_pulled_at=${lastPulledAt || 0}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Pull Error:', errorText);
                throw new Error(errorText);
            }
            const { changes, timestamp } = await response.json();
            return { changes, timestamp };
        },
        pushChanges: async ({ changes }) => {
            const response = await fetch(`${API_URL}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(changes),
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Push Error:', errorText);
                throw new Error(errorText);
            }
        },
        migrationsEnabledAtVersion: 1,
    });
}
