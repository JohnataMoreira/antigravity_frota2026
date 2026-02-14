import NetInfo from '@react-native-community/netinfo';
import { useState, useEffect } from 'react';

export function useNetworkStatus() {
    const [isOnline, setIsOnline] = useState(true);
    const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(true);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsOnline(state.isConnected ?? false);
            setIsInternetReachable(state.isInternetReachable ?? null);
        });

        // Check initial state
        NetInfo.fetch().then(state => {
            setIsOnline(state.isConnected ?? false);
            setIsInternetReachable(state.isInternetReachable ?? null);
        });

        return () => unsubscribe();
    }, []);

    return {
        isOnline,
        isInternetReachable,
        isFullyOnline: isOnline && isInternetReachable !== false,
    };
}
