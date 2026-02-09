import { ReactNode } from 'react';

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    gradient?: boolean;
    transition?: boolean;
}

/**
 * GlassCard Component - Premium Edition
 * 
 * Enhanced glassmorphism card with optional gradient background.
 * Optimized for vibrant purple theme.
 */
export function GlassCard({ children, className = '', gradient = false, transition = false }: GlassCardProps) {
    return (
        <div className={`
            glass-card p-6 
            ${gradient ? 'gradient-card' : ''} 
            ${transition ? 'transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl' : ''}
            ${className}
        `}>
            {children}
        </div>
    );
}

interface StatCardProps {
    label: string;
    value: string | number;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    icon?: ReactNode;
    gradient?: boolean;
}

/**
 * StatCard Component - Premium Edition
 * 
 * High-impact number display with gradients and micro-animations.
 * Designed for maximum visual impact.
 */
export function StatCard({ label, value, trend, icon, gradient = false }: StatCardProps) {
    return (
        <GlassCard
            className={`
        flex items-start justify-between 
        transition-all duration-300 
        hover:scale-105 hover:shadow-2xl
        ${gradient ? 'gradient-card border-primary/20' : ''}
      `}
            gradient={gradient}
        >
            <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-2">
                    {label}
                </p>
                <p className={`
          text-4xl font-bold tracking-tight
          ${gradient ? 'gradient-text' : ''}
        `}>
                    {value}
                </p>
                {trend && (
                    <p className={`text-sm mt-3 flex items-center gap-1.5 font-medium ${trend.isPositive
                        ? 'text-green-500 dark:text-green-400'
                        : 'text-red-500 dark:text-red-400'
                        }`}>
                        <span className="text-lg">{trend.isPositive ? '↑' : '↓'}</span>
                        <span>{Math.abs(trend.value)}% vs. semana passada</span>
                    </p>
                )}
            </div>
            {icon && (
                <div className={`
          text-muted-foreground/60 
          transition-all duration-300 
          group-hover:scale-110
          ${gradient ? 'text-primary/40' : ''}
        `}>
                    {icon}
                </div>
            )}
        </GlassCard>
    );
}
