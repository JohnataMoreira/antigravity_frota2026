import { ReactNode } from 'react';

interface GlassCardProps {
    children: ReactNode;
    className?: string;
}

/**
 * GlassCard Component
 * 
 * Premium glassmorphism card with backdrop blur and subtle borders.
 * Automatically adapts to dark mode via CSS utilities.
 * 
 * @example
 * ```tsx
 * <GlassCard className="p-6">
 *   <h2>Content Here</h2>
 * </GlassCard>
 * ```
 */
export function GlassCard({ children, className = '' }: GlassCardProps) {
    return (
        <div className={`glass-card p-6 ${className}`}>
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
}

/**
 * StatCard Component
 * 
 * High-impact number display with optional trend indicator.
 * Uses fluid typography (clamp) for responsive scaling.
 * 
 * @example
 * ```tsx
 * <StatCard 
 *   label="Veículos Ativos"
 *   value={42}
 *   trend={{ value: 12, isPositive: true }}
 *   icon={<TruckIcon />}
 * />
 * ```
 */
export function StatCard({ label, value, trend, icon }: StatCardProps) {
    return (
        <GlassCard className="flex items-start justify-between">
            <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                    {label}
                </p>
                <p className="text-3xl font-bold tracking-tight">
                    {value}
                </p>
                {trend && (
                    <p className={`text-xs mt-2 flex items-center gap-1 ${trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                        <span>{trend.isPositive ? '↑' : '↓'}</span>
                        <span>{Math.abs(trend.value)}%</span>
                    </p>
                )}
            </div>
            {icon && (
                <div className="text-muted-foreground opacity-60">
                    {icon}
                </div>
            )}
        </GlassCard>
    );
}
