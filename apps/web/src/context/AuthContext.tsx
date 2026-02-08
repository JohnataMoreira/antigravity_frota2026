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
        const token = localStorage.getItem('token');
        // In a real app, we would validate token validity with /auth/me
        // For MVP, we decode simple payload or trust storage until 401
        // Let's assume user info is not stored in localstorage securely, 
        // but for now we just check presence of token.
        // Ideally we should fetch user profile on load.

        if (token) {
            // Mock restoration or fetch from API
            // api.get('/auth/profile').then(...)
            // For MVP speed:
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, []);

    const login = (token: string, userData: User) => {
        console.log('AuthContext: login chamado', userData);
        localStorage.setItem('token', token);
        setUser(userData);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    };

    const logout = () => {
        localStorage.removeItem('token');
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
