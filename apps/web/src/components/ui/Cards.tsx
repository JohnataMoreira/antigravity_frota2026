import { ReactNode } from 'react';
import { Skeleton } from './Skeleton';

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
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
    isLoading?: boolean;
    children?: ReactNode;
}

/**
 * StatCard Component - Premium Edition
 * 
 * High-impact number display with gradients and micro-animations.
 * Designed for maximum visual impact.
 */
export function StatCard({ label, value, trend, icon, gradient = false, variant = 'default', isLoading = false, children }: StatCardProps) {
    const variantClasses = {
        default: '',
        success: 'border-green-500/30 bg-green-500/5',
        warning: 'border-amber-500/30 bg-amber-500/5',
        danger: 'border-red-500/30 bg-red-500/5',
        info: 'border-blue-500/30 bg-blue-500/5',
    };

    return (
        <GlassCard
            className={`
        flex items-start justify-between 
        transition-all duration-300 
        hover:scale-105 hover:shadow-2xl
        min-h-[140px]
        ${variantClasses[variant]}
        ${gradient ? 'gradient-card border-primary/20' : ''}
      `}
            gradient={gradient}
        >
            <div className="flex-1">
                <p className="text-sm font-bold text-muted-foreground/90 dark:text-muted-foreground mb-2 uppercase tracking-wider">
                    {label}
                </p>
                {isLoading ? (
                    <Skeleton className="h-10 w-24 mt-1" />
                ) : (
                    <p className={`
              text-4xl font-bold tracking-tight
              ${gradient ? 'gradient-text' : ''}
            `}>
                        {value}
                    </p>
                )}
                {trend && !isLoading && (
                    <p className={`text-sm mt-3 flex items-center gap-1.5 font-medium ${trend.isPositive
                        ? 'text-green-500 dark:text-green-400'
                        : 'text-red-500 dark:text-red-400'
                        }`}>
                        <span className="text-lg">{trend.isPositive ? '↑' : '↓'}</span>
                        <span>{Math.abs(trend.value)}% vs. semana passada</span>
                    </p>
                )}
                {isLoading && <Skeleton className="h-4 w-32 mt-4 opacity-50" />}
            </div>
            {icon && (
                <div className={`
          text-foreground/40 
          transition-all duration-300 
          group-hover:scale-110 group-hover:text-primary/60
          ${gradient ? 'text-primary/40' : ''}
        `}>
                    {icon}
                </div>
            )}
            {children && !isLoading && (
                <div className="absolute bottom-0 left-0 right-0 p-4 pt-0">
                    {children}
                </div>
            )}
        </GlassCard>
    );
}
