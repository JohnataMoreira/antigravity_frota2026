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

/**
 * Convert HEX color to HSL string compatible with Tailwind CSS variables,
 * check luminance, and apply dynamically to :root
 * Example: "#2563EB" -> "221.2 83.2% 53.3%"
 */
export function applyThemeColor(hex: string | undefined | null) {
    if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) {
        document.documentElement.style.removeProperty('--primary');
        document.documentElement.style.removeProperty('--primary-foreground');
        return;
    }

    // Convert hex to rgb
    const hexVal = hex.replace(/^#/, '');
    const r = parseInt(hexVal.substring(0, 2), 16) / 255;
    const g = parseInt(hexVal.substring(2, 4), 16) / 255;
    const b = parseInt(hexVal.substring(4, 6), 16) / 255;

    // Calculate luminance for foreground color (relative luminance in grayscale)
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    const hMath = Math.round(h * 360 * 10) / 10;
    const sMath = Math.round(s * 100 * 10) / 10;
    const lMath = Math.round(l * 100 * 10) / 10;

    // Apply primary color variable
    document.documentElement.style.setProperty('--primary', `${hMath} ${sMath}% ${lMath}%`);

    // Set appropriate foreground based on luminance (above 0.5 means color is too light, needs dark text)
    if (luminance > 0.6) {
        document.documentElement.style.setProperty('--primary-foreground', '222.2 47.4% 11.2%'); // Dark text
    } else {
        document.documentElement.style.setProperty('--primary-foreground', '210 40% 98%'); // Light text
    }
}

/**
 * Format string as CNPJ (00.000.000/0000-00)
 */
export function formatCNPJ(value: string): string {
    let v = value.replace(/\D/g, "");
    if (v.length > 14) v = v.substring(0, 14);

    v = v.replace(/^(\d{2})(\d)/, "$1.$2");
    v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
    v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
    v = v.replace(/(\d{4})(\d)/, "$1-$2");

    return v;
}
