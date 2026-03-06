import { useState, useCallback } from 'react';
import { api } from '../lib/axios';

export function usePushNotifications() {
    const [isSupported] = useState(
        'serviceWorker' in navigator && 'PushManager' in window
    );
    const [permission, setPermission] = useState<NotificationPermission>(
        typeof Notification !== 'undefined' ? Notification.permission : 'default'
    );

    const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    const subscribeToPush = useCallback(async () => {
        if (!isSupported) {
            console.warn('Push Notifications are not supported in this browser.');
            return false;
        }

        try {
            const perm = await Notification.requestPermission();
            setPermission(perm);

            if (perm !== 'granted') {
                console.warn('Push permission denied.');
                return false;
            }

            const registration = await navigator.serviceWorker.ready;
            if (!registration) {
                console.error('No service worker registered yet.');
                return false;
            }

            // We get the VAPID Public Key from env
            const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
            if (!vapidPublicKey) {
                console.warn('VITE_VAPID_PUBLIC_KEY is missing');
                return false;
            }
            const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidKey,
            });

            // Send to backend
            await api.post('/notifications/subscribe', subscription);
            console.log('Push subscription successful and sent to backend.');

            return true;
        } catch (error) {
            console.error('Error subscribing to push notifications', error);
            return false;
        }
    }, [isSupported]);

    return { isSupported, permission, subscribeToPush };
}
