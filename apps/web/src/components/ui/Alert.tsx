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
                container: 'bg-accent-50 border-accent-200 text-accent-900',
                icon: 'text-accent-600',
                title: 'text-accent-900',
            },
            success: {
                container: 'bg-success-50 border-success-200 text-success-900',
                icon: 'text-success-600',
                title: 'text-success-900',
            },
            warning: {
                container: 'bg-warning-50 border-warning-200 text-warning-900',
                icon: 'text-warning-600',
                title: 'text-warning-900',
            },
            danger: {
                container: 'bg-danger-50 border-danger-200 text-danger-900',
                icon: 'text-danger-600',
                title: 'text-danger-900',
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
