import { HTMLAttributes } from 'react';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
 className?: string;
}

/**
 * Skeleton Component - Premium Pulse Edition
 * 
 * A loading placeholder with a smooth pulse animation.
 * Optimized for glassmorphism layouts.
 */
export function Skeleton({ className = '', ...props }: SkeletonProps) {
 return (
 <div
 className={`
 animate-pulse 
 bg-gray-200 rounded-md 
 ${className}
 `}
 {...props}
 />
 );
}

