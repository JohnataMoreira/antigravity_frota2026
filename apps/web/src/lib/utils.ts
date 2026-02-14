import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility to merge Tailwind CSS classes safely
 * Prevents class conflicts and duplicates
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Format number as currency (BRL)
 */
export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value || 0);
}

/**
 * Format number as kilometers (KM) with mile separators
 */
export function formatKm(value: number): string {
    return `${new Intl.NumberFormat('pt-BR').format(value || 0)} KM`;
}

/**
 * Format datetime for Brazil
 */
export function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(d);
}

/**
 * Format datetime with time
 */
export function formatDateTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(d);
}

/**
 * Format duration in minutes to human readable
 */
export function formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) {
        return `${mins}min`;
    }

    if (mins === 0) {
        return `${hours}h`;
    }

    return `${hours}h ${mins}min`;
}

/**
 * Calculate Fleet Health Score (0-100)
 * Based on: vehicles available, low maintenance alerts, safe drivers
 */
export function calculateFleetHealth(data: {
    vehiclesAvailable: number;
    totalVehicles: number;
    lowMaintenancePercent: number;
    safeDriversPercent: number;
}): number {
    const availabilityScore = (data.vehiclesAvailable / data.totalVehicles) * 100;
    const maintenanceScore = data.lowMaintenancePercent;
    const safetyScore = data.safeDriversPercent;

    // Weighted average: 40% availability, 30% maintenance, 30% safety
    const health = (
        (availabilityScore * 0.4) +
        (maintenanceScore * 0.3) +
        (safetyScore * 0.3)
    );

    return Math.round(health);
}

/**
 * Get health status color
 */
export function getHealthColor(score: number): string {
    if (score >= 85) return 'success';
    if (score >= 70) return 'warning';
    return 'danger';
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    return function executedFunction(...args: Parameters<T>) {
        const later = () => {
            timeout = null;
            func(...args);
        };

        if (timeout !== null) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(later, wait);
    };
}
