import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { cn, getHealthColor } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface StatCardProps {
    title: string;
    value: string | number;
    change?: {
        value: number;
        label: string;
        positive?: boolean;
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
    change,
    icon: Icon,
    variant = 'default',
    loading = false,
}) => {
    const variantColors = {
        default: {
            bg: 'bg-neutral-50',
            text: 'text-neutral-600',
            icon: 'text-neutral-500',
        },
        success: {
            bg: 'bg-success-50',
            text: 'text-success-600',
            icon: 'text-success-500',
        },
        warning: {
            bg: 'bg-warning-50',
            text: 'text-warning-600',
            icon: 'text-warning-500',
        },
        danger: {
            bg: 'bg-danger-50',
            text: 'text-danger-600',
            icon: 'text-danger-500',
        },
        info: {
            bg: 'bg-accent-50',
            text: 'text-accent-600',
            icon: 'text-accent-500',
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
                {change && (
                    <p className="text-xs text-neutral-500 mt-2 flex items-center gap-1">
                        <span
                            className={cn(
                                'font-medium',
                                change.positive !== undefined
                                    ? change.positive
                                        ? 'text-success-600'
                                        : 'text-danger-600'
                                    : 'text-neutral-600'
                            )}
                        >
                            {change.positive !== undefined && (change.positive ? '↑' : '↓')}
                            {change.value > 0 ? '+' : ''}
                            {change.value}%
                        </span>
                        <span>{change.label}</span>
                    </p>
                )}
            </CardContent>
        </Card>
    );
};
