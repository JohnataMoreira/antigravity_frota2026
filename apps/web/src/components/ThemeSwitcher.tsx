import { useTheme } from '../context/ThemeContext';
import { Zap, Ghost } from 'lucide-react';

/**
 * ThemeSwitcher Component - The Portal Switcher (11/10 Design)
 * 
 * Premium single-button theme switcher that uses Zap (Light) and Ghost (Dark)
 * for a creative and unexpected experience.
 */
export function ThemeSwitcher() {
    const { theme, setTheme } = useTheme();

    const isDark = theme === 'dark';

    const toggleTheme = () => {
        setTheme(isDark ? 'light' : 'dark');
    };

    return (
        <button
            onClick={toggleTheme}
            className={`
                group relative
                flex items-center justify-center
                w-12 h-12 rounded-2xl
                transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                active:scale-90 overflow-hidden
                ${isDark
                    ? 'bg-emerald-500/10 hover:bg-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                    : 'bg-amber-500/10 hover:bg-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]'}
            `}
            aria-label={`Mudar para modo ${isDark ? 'claridade' : 'stealth'}`}
            title={`Modo ${isDark ? 'Energia (Light)' : 'Fantasma (Dark)'}`}
        >
            <div className="relative w-6 h-6 flex items-center justify-center">
                {/* Zap Icon (Light Mode) */}
                <Zap
                    className={`
                        absolute w-6 h-6 transition-all duration-500
                        ${isDark
                            ? 'translate-y-12 opacity-0 rotate-45'
                            : 'translate-y-0 opacity-100 rotate-0 text-amber-500'}
                    `}
                />

                {/* Ghost Icon (Dark Mode) */}
                <Ghost
                    className={`
                        absolute w-6 h-6 transition-all duration-500
                        ${isDark
                            ? 'translate-y-0 opacity-100 rotate-0 text-emerald-500'
                            : '-translate-y-12 opacity-0 -rotate-45'}
                    `}
                />
            </div>

            {/* Premium Particles/Glow */}
            <div className={`
                absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none
                ${isDark ? 'bg-gradient-to-tr from-emerald-500/5 to-transparent' : 'bg-gradient-to-tr from-amber-500/5 to-transparent'}
            `} />
        </button>
    );
}

