import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../lib/axios';

interface User {
    id: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'DRIVER';
    organizationId: string;
}

interface AuthContextType {
    user: User | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

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
                setUser(res.data);
                localStorage.setItem('user', JSON.stringify(res.data));
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
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        delete api.defaults.headers.common['Authorization'];
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading }}>
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
