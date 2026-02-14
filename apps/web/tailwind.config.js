/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            colors: {
                // Frota2026 Design System Colors
                primary: {
                    DEFAULT: '#0F172A', // Slate 900 - Profissional, Sério
                    50: '#F8FAFC',
                    100: '#F1F5F9',
                    200: '#E2E8F0',
                    300: '#CBD5E1',
                    400: '#94A3B8',
                    500: '#64748B',
                    600: '#475569',
                    700: '#334155',
                    800: '#1E293B',
                    900: '#0F172A',
                },
                accent: {
                    DEFAULT: '#3B82F6', // Blue 500 - Confiança, Tecnologia
                    50: '#EFF6FF',
                    100: '#DBEAFE',
                    200: '#BFDBFE',
                    300: '#93C5FD',
                    400: '#60A5FA',
                    500: '#3B82F6',
                    600: '#2563EB',
                    700: '#1D4ED8',
                    800: '#1E40AF',
                    900: '#1E3A8A',
                },
                success: {
                    DEFAULT: '#10B981', // Emerald 500 - Sucesso, Seguro
                    50: '#ECFDF5',
                    100: '#D1FAE5',
                    200: '#A7F3D0',
                    300: '#6EE7B7',
                    400: '#34D399',
                    500: '#10B981',
                    600: '#059669',
                    700: '#047857',
                    800: '#065F46',
                    900: '#064E3B',
                },
                warning: {
                    DEFAULT: '#F59E0B', // Amber 500 - Atenção
                    50: '#FFFBEB',
                    100: '#FEF3C7',
                    200: '#FDE68A',
                    300: '#FCD34D',
                    400: '#FBBF24',
                    500: '#F59E0B',
                    600: '#D97706',
                    700: '#B45309',
                    800: '#92400E',
                    900: '#78350F',
                },
                danger: {
                    DEFAULT: '#EF4444', // Red 500 - Urgente, Crítico
                    50: '#FEF2F2',
                    100: '#FEE2E2',
                    200: '#FECACA',
                    300: '#FCA5A5',
                    400: '#F87171',
                    500: '#EF4444',
                    600: '#DC2626',
                    700: '#B91C1C',
                    800: '#991B1B',
                    900: '#7F1D1D',
                },
                neutral: {
                    DEFAULT: '#F8FAFC',
                    50: '#F8FAFC',
                    100: '#F1F5F9',
                    200: '#E2E8F0',
                    300: '#CBD5E1',
                    400: '#94A3B8',
                    500: '#64748B',
                    600: '#475569',
                    700: '#334155',
                    800: '#1E293B',
                    900: '#0F172A',
                },
                // Legacy compatibility
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "#3B82F6",
                background: "#F8FAFC",
                foreground: "#0F172A",
            },
            borderRadius: {
                lg: "16px",
                md: "12px",
                sm: "8px",
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                mono: ['JetBrains Mono', 'Consolas', 'monospace'],
            },
            fontSize: {
                'h1': ['36px', { lineHeight: '1.2', fontWeight: '700' }],
                'h2': ['24px', { lineHeight: '1.3', fontWeight: '600' }],
                'h3': ['20px', { lineHeight: '1.4', fontWeight: '500' }],
                'body': ['16px', { lineHeight: '1.5', fontWeight: '400' }],
                'small': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
            },
            backdropBlur: {
                xs: '2px',
            },
            keyframes: {
                "accordion-down": {
                    from: { height: '0' },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: '0' },
                },
                "fade-in": {
                    from: { opacity: '0', transform: 'translateY(10px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
                "shimmer": {
                    '0%': { backgroundPosition: '-1000px 0' },
                    '100%': { backgroundPosition: '1000px 0' },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "fade-in": "fade-in 0.3s ease-out",
                "shimmer": "shimmer 2s infinite linear",
            },
            boxShadow: {
                'glass': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                'glass-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            },
        },
    },
    plugins: [],
}
