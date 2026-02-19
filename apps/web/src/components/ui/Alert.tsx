import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, X } from 'lucide-react';
import { Button } from './Button';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'info' | 'success' | 'warning' | 'danger';
    title?: string;
    icon?: LucideIcon;
    dismissible?: boolean;
    onDismiss?: () => void;
}

/**
 * Alert component for notifications and important messages
 */
export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
    (
        {
            className,
            variant = 'info',
            title,
            icon: Icon,
            dismissible = false,
            onDismiss,
            children,
            ...props
        },
        ref
    ) => {
        const variants = {
            info: {
                container: 'bg-accent-50 dark:bg-accent-900/20 border-accent-200 dark:border-accent-800 text-accent-900 dark:text-accent-100',
                icon: 'text-accent-600 dark:text-accent-400',
                title: 'text-accent-900 dark:text-accent-100',
            },
            success: {
                container: 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800 text-success-900 dark:text-success-100',
                icon: 'text-success-600 dark:text-success-400',
                title: 'text-success-900 dark:text-success-100',
            },
            warning: {
                container: 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800 text-warning-900 dark:text-warning-100',
                icon: 'text-warning-600 dark:text-warning-400',
                title: 'text-warning-900 dark:text-warning-100',
            },
            danger: {
                container: 'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800 text-danger-900 dark:text-danger-100',
                icon: 'text-danger-600 dark:text-danger-400',
                title: 'text-danger-900 dark:text-danger-100',
            },
        };

        const colors = variants[variant];

        return (
            <div
                ref={ref}
                className={cn(
                    'relative flex gap-3 rounded-lg border p-4',
                    colors.container,
                    className
                )}
                {...props}
            >
                {Icon && (
                    <div className="flex-shrink-0">
                        <Icon className={cn('h-5 w-5', colors.icon)} />
                    </div>
                )}
                <div className="flex-1">
                    {title && (
                        <h5 className={cn('mb-1 font-semibold', colors.title)}>{title}</h5>
                    )}
                    <div className="text-sm">{children}</div>
                </div>
                {dismissible && onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="absolute top-3 right-3 p-1 rounded hover:bg-black/5 transition-colors"
                        aria-label="Dismiss"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>
        );
    }
);

Alert.displayName = 'Alert';
