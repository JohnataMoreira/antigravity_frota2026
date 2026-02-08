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
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check local storage for token in next step
        setLoading(false);
    }, []);

    const login = (userData: any, jwtToken: string) => {
        setUser(userData);
        setToken(jwtToken);
    };

    const logout = () => {
        setUser(null);
        setToken(null);
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
            <Stack screenOptions={{ headerShown: false }}>
                {token ? (
                    <Stack.Screen name="(tabs)" />
                ) : (
                    <Stack.Screen name="login" />
                )}
            </Stack>
        </AuthContext.Provider>
    );
}
