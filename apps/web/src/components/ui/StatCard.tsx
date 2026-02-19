import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { cn, getHealthColor } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface StatCardProps {
    title: string;
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
    icon?: LucideIcon;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
    loading?: boolean;
}

/**
 * StatCard - KPI display card with optional trend indicator
 * Used for dashboard metrics display
 */
export const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    description,
    change,
    trend,
    icon: Icon,
    variant = 'default',
    loading = false,
}) => {
    const variantColors = {
        default: {
            bg: 'bg-neutral-50 dark:bg-neutral-800/50',
            text: 'text-neutral-600 dark:text-neutral-300',
            icon: 'text-neutral-500 dark:text-neutral-400',
        },
        success: {
            bg: 'bg-success-50 dark:bg-success-900/20',
            text: 'text-success-600 dark:text-success-400',
            icon: 'text-success-500 dark:text-success-400',
        },
        warning: {
            bg: 'bg-warning-50 dark:bg-warning-900/20',
            text: 'text-warning-600 dark:text-warning-400',
            icon: 'text-warning-500 dark:text-warning-400',
        },
        danger: {
            bg: 'bg-danger-50 dark:bg-danger-900/20',
            text: 'text-danger-600 dark:text-danger-400',
            icon: 'text-danger-500 dark:text-danger-400',
        },
        info: {
            bg: 'bg-accent-50 dark:bg-accent-900/20',
            text: 'text-accent-600 dark:text-accent-400',
            icon: 'text-accent-500 dark:text-accent-400',
        },
    };

    const colors = variantColors[variant];

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
        <Card variant="glass" className="hover:shadow-glass-lg transition-all duration-200">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-neutral-600">
                    {title}
                </CardTitle>
                {Icon && (
                    <div className={cn('p-2 rounded-lg', colors.bg)}>
                        <Icon className={cn('h-4 w-4', colors.icon)} />
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
