import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as SecureStore from 'expo-secure-store';
import { outboxService } from './outboxService';

export const SYNC_OUTBOX_TASK = 'SYNC_OUTBOX_TASK';

// Define the background task
TaskManager.defineTask(SYNC_OUTBOX_TASK, async () => {
    try {
        console.log('[BackgroundFetch] 🔄 Running background sync task...');
        
        // Background tasks run in a separate process, so we need to get the token directly
        const token = await SecureStore.getItemAsync('userToken');
        
        if (!token) {
            console.log('[BackgroundFetch] ⚠️ No token found. Skipping sync.');
            return BackgroundFetch.BackgroundFetchResult.NoData;
        }

        // Process the outbox
        // Note: outboxService.processQueue already checks for network connectivity
        await outboxService.processQueue(token);
        
        console.log('[BackgroundFetch] ✅ Sync task finished.');
        return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch (error) {
        console.error('[BackgroundFetch] ❌ Task failed:', error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
    }
});

/**
 * Register the background sync task
 */
export async function registerBackgroundSync() {
    try {
        const isRegistered = await TaskManager.isTaskRegisteredAsync(SYNC_OUTBOX_TASK);
        if (isRegistered) {
            console.log(`[BackgroundFetch] Task ${SYNC_OUTBOX_TASK} already registered.`);
            return;
        }

        await BackgroundFetch.registerTaskAsync(SYNC_OUTBOX_TASK, {
            minimumInterval: 15 * 60, // 15 minutes (minimum allowed by OS)
            stopOnTerminate: false,    // keep running after app is closed
            startOnBoot: true,         // restart after device reboot
        });
        
        console.log(`[BackgroundFetch] Task ${SYNC_OUTBOX_TASK} registered successfully.`);
    } catch (err) {
        console.error(`[BackgroundFetch] Registration failed:`, err);
    }
}
