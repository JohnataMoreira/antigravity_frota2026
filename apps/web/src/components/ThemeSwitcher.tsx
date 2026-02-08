import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Building2 } from 'lucide-react';

/**
 * ThemeSwitcher Component - Cycle Button (11/10 Design)
 * 
 * Premium single-button theme switcher that cycles through:
 * Light → Dark → Paraopeba → Light...
 * 
 * Shows only the CURRENT theme icon with smooth transitions.
 */
export function ThemeSwitcher() {
    const { theme, setTheme } = useTheme();

    const themes = [
        { id: 'light' as const, label: 'Tema Claro', icon: Sun },
        { id: 'dark' as const, label: 'Tema Escuro', icon: Moon },
        { id: 'paraopeba' as const, label: 'Tema Paraopeba', icon: Building2 },
    ];

    const currentThemeIndex = themes.findIndex(t => t.id === theme);
    const currentTheme = themes[currentThemeIndex];

    const cycleTheme = () => {
        const nextIndex = (currentThemeIndex + 1) % themes.length;
        setTheme(themes[nextIndex].id);
    };

    const Icon = currentTheme.icon;

    return (
        <button
            onClick={cycleTheme}
            className="
        group relative
        flex items-center justify-center
        w-10 h-10 rounded-lg
        bg-muted/50 hover:bg-muted
        transition-all duration-300 ease-out
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
        hover:scale-105 active:scale-95
      "
            aria-label={`Tema atual: ${currentTheme.label}. Clique para alternar`}
            title={currentTheme.label}
        >
            <Icon className="w-5 h-5 text-foreground transition-transform duration-300 group-hover:rotate-12" />

            {/* Tooltip on hover */}
            <span className="
        absolute -bottom-10 left-1/2 -translate-x-1/2
        px-2 py-1 rounded text-xs font-medium
        bg-popover text-popover-foreground
        opacity-0 group-hover:opacity-100
        transition-opacity duration-200
        pointer-events-none whitespace-nowrap
        shadow-md border border-border
      ">
                {currentTheme.label}
            </span>
        </button>
    );
}
