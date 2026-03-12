import { Stack } from 'expo-router';
import { api } from '../src/services/api';
import { useEffect, useState, createContext, useContext } from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ChecklistProvider } from '../src/context/ChecklistContext';
import { useFonts, Lexend_400Regular, Lexend_700Bold } from '@expo-google-fonts/lexend';
import '../global.css';

// ── Web-safe storage shim ──────────────────────────────────────────────────
const storage = {
    getItem: async (key: string) => {
        if (Platform.OS === 'web') return localStorage.getItem(key);
        const SecureStore = await import('expo-secure-store');
        return SecureStore.getItemAsync(key);
    },
    setItem: async (key: string, value: string) => {
        if (Platform.OS === 'web') { localStorage.setItem(key, value); return; }
        const SecureStore = await import('expo-secure-store');
        return SecureStore.setItemAsync(key, value);
    },
    deleteItem: async (key: string) => {
        if (Platform.OS === 'web') { localStorage.removeItem(key); return; }
        const SecureStore = await import('expo-secure-store');
        return SecureStore.deleteItemAsync(key);
    },
};

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
                const storedToken = await storage.getItem('userToken');
                const storedUser = await storage.getItem('userData');

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

    // Auto-logout on 401 — any expired token detected anywhere triggers a clean logout
    useEffect(() => {
        const unsubscribe = api.onUnauthorized(() => {
            logout().then(() => {
                router.replace('/login');
            });
        });
        return unsubscribe;
    }, []);

    // Native-only side effects (push notifications, background sync, network watch)
    useEffect(() => {
        if (!token || Platform.OS === 'web') return;

        let cleanup: (() => void) | undefined;

        (async () => {
            const [Notifications, Device, Constants, NetInfo, { photoService }, { syncService }, { registerBackgroundSync }] = await Promise.all([
                import('expo-notifications'),
                import('expo-device'),
                import('expo-constants'),
                import('@react-native-community/netinfo'),
                import('../src/services/photoService'),
                import('../src/services/SyncService'),
                import('../src/services/BackgroundService'),
            ]);

            // Register background sync task
            registerBackgroundSync().catch(err => console.error('[BackgroundSync] Registration error:', err));

            Notifications.setNotificationHandler({
                handleNotification: async () => ({
                    shouldShowAlert: true,
                    shouldPlaySound: true,
                    shouldSetBadge: false,
                }),
            });

            if (Device.isDevice) {
                const { status: existingStatus } = await Notifications.getPermissionsAsync();
                let finalStatus = existingStatus;
                if (existingStatus !== 'granted') {
                    const { status } = await Notifications.requestPermissionsAsync();
                    finalStatus = status;
                }
                if (finalStatus === 'granted') {
                    const pushToken = (await Notifications.getExpoPushTokenAsync({
                        projectId: Constants.default.expoConfig?.extra?.eas?.projectId,
                    })).data;
                    if (pushToken) {
                        api.subscribePushToken(pushToken).catch(console.error);
                    }
                }
            }

            const notificationListener = Notifications.addNotificationReceivedListener(n => {
                console.log('Notification Received:', n);
            });

            const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
                const data = response.notification.request.content.data;
                if (data?.url) setTimeout(() => router.push(data.url), 500);
            });

            const unsubscribeNet = NetInfo.default.addEventListener(state => {
                if (state.isConnected) {
                    import('../src/services/outboxService').then(({ outboxService }) => {
                        outboxService.processQueue(token);
                    });
                }
            });

            syncService.setToken(token);
            syncService.sync();

            cleanup = () => {
                notificationListener.remove();
                responseListener.remove();
                unsubscribeNet();
            };
        })();

        return () => { cleanup?.(); };
    }, [token]);

    const login = async (userData: any, jwtToken: string) => {
        setUser(userData);
        setToken(jwtToken);
        api.setToken(jwtToken);
        await storage.setItem('userToken', jwtToken);
        await storage.setItem('userData', JSON.stringify(userData));
    };

    const logout = async () => {
        setUser(null);
        setToken(null);
        api.setToken('');
        await storage.deleteItem('userToken');
        await storage.deleteItem('userData');
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
