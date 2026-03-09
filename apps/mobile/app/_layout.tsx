import { Stack } from 'expo-router';
import { api } from '../src/services/api';
import { useEffect, useState, createContext, useContext, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ChecklistProvider } from '../src/context/ChecklistContext';
import * as SecureStore from 'expo-secure-store';
import { useFonts, Lexend_400Regular, Lexend_700Bold } from '@expo-google-fonts/lexend';
import NetInfo from '@react-native-community/netinfo';
import { photoService } from '../src/services/photoService';
import { syncService } from '../src/services/SyncService';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import '../global.css';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

async function registerForPushNotificationsAsync() {
    if (!Device.isDevice) {
        console.log('Must use physical device for Push Notifications');
        return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }
    if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
    })).data;

    return token;
}

const AuthContext = createContext<any>(null);

export function useAuth() {
    return useContext(AuthContext);
}

export default function RootLayout() {
    const [user, setUser] = useState<any>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const [fontsLoaded] = useFonts({
        Lexend_400Regular,
        Lexend_700Bold,
    });

    useEffect(() => {
        const loadStoredAuth = async () => {
            try {
                const storedToken = await SecureStore.getItemAsync('userToken');
                const storedUser = await SecureStore.getItemAsync('userData');

                if (storedToken && storedUser) {
                    setToken(storedToken);
                    const parsedUser = JSON.parse(storedUser);
                    setUser(parsedUser);
                    api.setToken(storedToken);
                }
            } catch (e) {
                console.error('Failed to load auth', e);
            } finally {
                setLoading(false);
            }
        };

        loadStoredAuth();
    }, []);

    useEffect(() => {
        if (!token) return;

        // Push notification registration
        registerForPushNotificationsAsync().then(pushToken => {
            if (pushToken) {
                console.log('Push token registered:', pushToken);
                api.subscribePushToken(pushToken).catch(err => console.error('Failed to sync push token with API', err));
            }
        });

        // Notification listeners
        const notificationListener = Notifications.addNotificationReceivedListener(notification => {
            console.log('Notification Received:', notification);
        });

        const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
            console.log('Notification Response:', response);
            const data = response.notification.request.content.data;
            if (data?.url) {
                // Navigate to the requested screen
                setTimeout(() => {
                    router.push(data.url);
                }, 500);
            }
        });

        // Network status listener
        const unsubscribe = NetInfo.addEventListener(state => {
            if (state.isConnected) {
                console.log('Network connected, processing offline queue...');
                photoService.processOfflineQueue(token);
            }
        });

        syncService.setToken(token);
        syncService.sync();

        return () => {
            notificationListener.remove();
            responseListener.remove();
            unsubscribe();
        };
    }, [token]);

    const login = async (userData: any, jwtToken: string) => {
        setUser(userData);
        setToken(jwtToken);
        api.setToken(jwtToken);

        await SecureStore.setItemAsync('userToken', jwtToken);
        await SecureStore.setItemAsync('userData', JSON.stringify(userData));
    };

    const logout = async () => {
        setUser(null);
        setToken(null);
        api.setToken('');

        await SecureStore.deleteItemAsync('userToken');
        await SecureStore.deleteItemAsync('userData');
    };

    if (loading || !fontsLoaded) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#2463eb" />
            </View>
        );
    }

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
            <ChecklistProvider>
                <Stack screenOptions={{ headerShown: false }}>
                    {token ? (
                        <Stack.Screen name="(tabs)" />
                    ) : (
                        <Stack.Screen name="login" />
                    )}
                </Stack>
            </ChecklistProvider>
        </AuthContext.Provider>
    );
}
