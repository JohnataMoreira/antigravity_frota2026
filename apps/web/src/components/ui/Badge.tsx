import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
    size?: 'sm' | 'md';
}

/**
 * Badge component for status indicators and labels
 */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
    ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
        const variants = {
            default: 'bg-neutral-100 text-neutral-700 border-neutral-200',
            success: 'bg-success-50 text-success-700 border-success-200',
            warning: 'bg-warning-50 text-warning-700 border-warning-200',
            danger: 'bg-danger-50 text-danger-700 border-danger-200',
            info: 'bg-accent-50 text-accent-700 border-accent-200',
        };

        const sizes = {
            sm: 'px-2 py-0.5 text-xs',
            md: 'px-2.5 py-1 text-sm',
        };

        return (
            <span
                ref={ref}
                className={cn(
                    'inline-flex items-center gap-1 rounded-full border font-medium',
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            >
                {children}
            </span>
        );
    }
);

Badge.displayName = 'Badge';
