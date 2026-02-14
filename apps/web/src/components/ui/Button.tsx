import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
}

/**
 * Button component with multiple variants and loading state
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            variant = 'primary',
            size = 'md',
            loading = false,
            disabled,
            children,
            ...props
        },
        ref
    ) => {
        const variants = {
            primary:
                'bg-accent-600 text-white hover:bg-accent-700 active:bg-accent-800 shadow-sm',
            secondary:
                'bg-neutral-100 text-primary-900 hover:bg-neutral-200 active:bg-neutral-300',
            outline:
                'border-2 border-accent-600 text-accent-600 hover:bg-accent-50 active:bg-accent-100',
            danger:
                'bg-danger-600 text-white hover:bg-danger-700 active:bg-danger-800 shadow-sm',
            ghost: 'text-neutral-600 hover:bg-neutral-100 active:bg-neutral-200',
        };

        const sizes = {
            sm: 'px-3 py-1.5 text-sm',
            md: 'px-4 py-2 text-body',
            lg: 'px-6 py-3 text-lg',
        };

        return (
            <button
                ref={ref}
                className={cn(
                    'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all duration-200',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'active:scale-[0.98]',
                    variants[variant],
                    sizes[size],
                    className
                )}
                disabled={loading || disabled}
                {...props}
            >
                {loading && (
                    <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                )}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';
