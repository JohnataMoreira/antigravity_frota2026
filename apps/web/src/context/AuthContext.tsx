import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../lib/axios';
import { applyThemeColor } from '../lib/utils';
import { usePushNotifications } from '../hooks/usePushNotifications';

interface User {
    id: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'DRIVER';
    organizationId: string;
    organization?: {
        name: string;
        logoUrl?: string | null;
        primaryColor?: string | null;
    };
}

interface AuthContextType {
    user: User | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    refreshUser: () => Promise<void>;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { subscribeToPush } = usePushNotifications();

    useEffect(() => {
        const validateSession = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                // Set default header for the initial validation
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                const res = await api.get('/auth/me');
                const userData = res.data;
                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));

                // Apply white-label branding if available
                if (userData?.organization?.primaryColor) {
                    applyThemeColor(userData.organization.primaryColor);
                }
            } catch (error) {
                console.error('Invalid session:', error);
                logout();
            } finally {
                setIsLoading(false);
            }
        };

        validateSession();
    }, []);

    const login = (token: string, userData: User) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Apply white-label branding if available
        if (userData?.organization?.primaryColor) {
            applyThemeColor(userData.organization.primaryColor);
        }

        // Ask for push notifications
        subscribeToPush().catch(err => console.error("Falha ao registrar push:", err));
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        delete api.defaults.headers.common['Authorization'];
        applyThemeColor(null); // Reset theme
    };

    const refreshUser = async () => {
        try {
            const res = await api.get('/auth/me');
            const userData = res.data;
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));

            if (userData?.organization?.primaryColor) {
                applyThemeColor(userData.organization.primaryColor);
            }
        } catch (error) {
            console.error('Failed to refresh user:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, refreshUser, isAuthenticated: !!user, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
