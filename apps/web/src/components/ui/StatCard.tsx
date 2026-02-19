import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface StatCardProps {
    title?: string;
    label?: string; // Support both for backward compatibility
    value: string | number;
    description?: string;
    change?: {
        value: number;
        label: string;
        positive?: boolean;
    };
    trend?: {
        value: number;
        isPositive: boolean;
    };
    icon?: React.ReactNode | LucideIcon;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
    loading?: boolean;
    gradient?: boolean;
}

/**
 * StatCard - KPI display card with optional trend indicator
 * Used for dashboard metrics display
 */
export const StatCard: React.FC<StatCardProps> = ({
    title,
    label,
    value,
    description,
    change,
    trend,
    icon,
    variant = 'default',
    loading = false,
    gradient = false,
}) => {
    const variantColors = {
        default: {
            bg: 'bg-neutral-50 ',
            text: 'text-neutral-600 ',
            icon: 'text-neutral-500 ',
        },
        success: {
            bg: 'bg-success-50 ',
            text: 'text-success-600 ',
            icon: 'text-success-500 ',
        },
        warning: {
            bg: 'bg-warning-50 ',
            text: 'text-warning-600 ',
            icon: 'text-warning-500 ',
        },
        danger: {
            bg: 'bg-danger-50 ',
            text: 'text-danger-600 ',
            icon: 'text-danger-500 ',
        },
        info: {
            bg: 'bg-accent-50 ',
            text: 'text-accent-600 ',
            icon: 'text-accent-500 ',
        },
    };

    const colors = variantColors[variant];
    // Support label prop or legacy title prop
    const displayTitle = label || title;

    if (loading) {
        return (
            <Card variant="glass">
                <div className="animate-pulse">
                    <div className="h-4 bg-neutral-200 rounded w-1/2 mb-4" />
                    <div className="h-8 bg-neutral-300 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-neutral-200 rounded w-1/3" />
                </div>
            </Card>
        );
    }

    return (
        <Card
            variant="glass"
            className={cn(
                "hover:shadow-glass-lg transition-all duration-200",
                gradient && "bg-gradient-to-br from-white/80 to-white/40"
            )}
        >
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-neutral-600">
                    {displayTitle}
                </CardTitle>
                {icon && (
                    <div className={cn('p-2 rounded-lg', colors.bg)}>
                        {/* If it's a raw element (JSX), render it. If it's a Component, render it as element. */}
                        {React.isValidElement(icon) ? (
                            // Clone element to inject class if needed, or just render as is if caller handles style
                            icon
                        ) : (
                            // Legacy: if icon was passed as component (e.g. icon={User})
                            // We cast to any to avoid TS issues if standard LucideIcon type mismatch
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            React.createElement(icon as any, { className: cn('h-4 w-4', colors.icon) })
                        )}
                    </div>
                )}
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold text-primary-900">{value}</div>
                {description && (
                    <p className="text-xs text-neutral-500 mt-1">{description}</p>
                )}
                {(change || trend) && (
                    <p className="text-xs text-neutral-500 mt-2 flex items-center gap-1">
                        <span
                            className={cn(
                                'font-medium',
                                (change?.positive ?? trend?.isPositive) !== undefined
                                    ? (change?.positive ?? trend?.isPositive)
                                        ? 'text-success-600'
                                        : 'text-danger-600'
                                    : 'text-neutral-600'
                            )}
                        >
                            {(change?.positive ?? trend?.isPositive) !== undefined && ((change?.positive ?? trend?.isPositive) ? '↑' : '↓')}
                            {(change?.value ?? trend?.value ?? 0) > 0 ? '+' : ''}
                            {change?.value ?? trend?.value}%
                        </span>
                        <span>{change?.label || 'em relação ao mês anterior'}</span>
                    </p>
                )}
            </CardContent>
        </Card>
    );
};
