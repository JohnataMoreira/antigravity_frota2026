import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'paraopeba';

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
        const stored = localStorage.getItem('frota-theme') as Theme;
        return stored || 'light';
    });

    useEffect(() => {
        const root = document.documentElement;

        // Remove all theme classes/attributes
        root.classList.remove('dark');
        root.removeAttribute('data-theme');

        // Apply the selected theme
        if (theme === 'dark') {
            root.classList.add('dark');
        } else if (theme === 'paraopeba') {
            root.setAttribute('data-theme', 'paraopeba');
            // Paraopeba has its own color scheme, don't apply dark mode
        }

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
