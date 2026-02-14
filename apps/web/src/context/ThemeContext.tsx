import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
    children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
    const [theme, setThemeState] = useState<Theme>(() => {
        // Initialize from localStorage or default to 'light'
        const stored = localStorage.getItem('frota-theme');
        // Handle migration from removed paraopeba theme
        if (stored === 'paraopeba' || !stored) return 'light';
        return stored as Theme;
    });

    useEffect(() => {
        const root = document.documentElement;

        // Apply theme classes
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        // Cleanup any legacy theme attribute
        root.removeAttribute('data-theme');

        // Persist to localStorage
        localStorage.setItem('frota-theme', theme);
    }, [theme]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
