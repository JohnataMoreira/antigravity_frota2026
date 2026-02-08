import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Building2 } from 'lucide-react';

/**
 * ThemeSwitcher Component
 * 
 * A compact, accessible button group for switching between themes.
 * Implements WCAG 2.2 AA standards with proper focus states and keyboard navigation.
 */
export function ThemeSwitcher() {
    const { theme, setTheme } = useTheme();

    const themes = [
        { id: 'light' as const, label: 'Claro', icon: Sun },
        { id: 'dark' as const, label: 'Escuro', icon: Moon },
        { id: 'paraopeba' as const, label: 'Paraopeba', icon: Building2 },
    ];

    return (
        <div className="inline-flex items-center gap-1 p-1 bg-muted/50 rounded-lg" role="group" aria-label="Seletor de Tema">
            {themes.map(({ id, label, icon: Icon }) => (
                <button
                    key={id}
                    onClick={() => setTheme(id)}
                    className={`
            flex items-center gap-2 px-3 py-2
            text-sm font-medium rounded-md
            transition-all duration-200 ease-out
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
            ${theme === id
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }
          `}
                    aria-label={`Tema ${label}`}
                    aria-pressed={theme === id}
                >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{label}</span>
                </button>
            ))}
        </div>
    );
}
