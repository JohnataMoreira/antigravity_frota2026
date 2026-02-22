import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'silver' | 'emerald' | 'secondary';
    size?: 'sm' | 'md';
}

/**
 * Badge component for status indicators and labels
 */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
    ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
        const variants = {
            default: "bg-primary text-primary-foreground hover:bg-primary/80 border-primary/20",
            secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-secondary/20",
            danger: "bg-red-500/10 text-red-500 border-red-500/20",
            success: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
            warning: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
            info: "bg-blue-500/10 text-blue-500 border-blue-500/20",
            silver: "bg-muted text-muted-foreground border-border/50",
            emerald: "bg-emerald-600/10 text-emerald-400 border-emerald-600/20",
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

