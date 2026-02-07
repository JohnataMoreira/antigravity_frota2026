import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
// Context for Auth will be simple for now
import { createContext, useContext } from 'react';

const AuthContext = createContext<any>(null);

export function useAuth() {
    return useContext(AuthContext);
}

export default function RootLayout() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check local storage for token
        // For MVP, just simulate loading
        setTimeout(() => setLoading(false), 500);
    }, []);

    const login = (userData: any) => {
        setUser(userData);
    };

    const logout = () => {
        setUser(null);
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
            <Stack screenOptions={{ headerShown: false }}>
                {user ? (
                    <Stack.Screen name="(tabs)" />
                ) : (
                    <Stack.Screen name="login" />
                )}
            </Stack>
        </AuthContext.Provider>
    );
}
