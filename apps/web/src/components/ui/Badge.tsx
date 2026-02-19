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
 default: "bg-primary text-primary-foreground hover:bg-primary/80",
 secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
 danger: "bg-red-500/10 text-red-600 border-red-200 ",
 success: "bg-green-500/10 text-green-600 border-green-200 ",
 warning: "bg-yellow-500/10 text-yellow-600 border-yellow-200 ",
 info: "bg-blue-500/10 text-blue-600 border-blue-200 ",
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

