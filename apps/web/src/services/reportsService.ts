import { api } from '../lib/axios';

export interface DashboardStats {
    stats: {
        totalVehicles: number;
        availableVehicles: number;
        inUseVehicles: number;
        maintenanceVehicles: number;
        criticalVehicles: number;
        activeJourneys: number;
        journeysWithIncidents: number;
        journeysWithoutIncidents: number;
        totalDrivers: number;
        monthlyCosts: number;
        totalKm: number;
        avgFuelLevel: number;
        issuesReported: number;
        recentIncidents: any[];
    };
    history: any[];
    recentActivity: any[];
}

export const reportsApi = {
    getOverview: () => api.get<DashboardStats>('/reports/overview'),
    getDriverRanking: (params?: any) => api.get<any[]>('/reports/driver-ranking', { params }).then(res => res.data),
    getVehicleUtilization: (params?: any) => api.get<any[]>('/reports/vehicles', { params }).then(res => res.data),
};

// Aliasing for compatibility with existing components
export const reportsService = reportsApi;
