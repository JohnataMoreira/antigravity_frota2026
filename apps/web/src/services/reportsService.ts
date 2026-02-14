import { api } from '../lib/axios';

export interface ReportStats {
    totalVehicles: number;
    availableVehicles: number;
    activeJourneys: number;
    totalDrivers: number;
    monthlyCosts: number;
    totalKm: number;
    issuesReported: number;
}

export interface DriverPerformance {
    driverName: string;
    totalJourneys: number;
    totalKm: number;
    avgKmPerJourney: number;
}

export interface VehicleUtilization {
    plate: string;
    model: string;
    totalKm: number;
    trips: number;
    maintenanceCost: number;
    costPerKm: number; // string in JSON, number here? check backend
}

export const reportsService = {
    getOverview: async () => {
        const response = await api.get('/reports/overview');
        return response.data;
    },

    getDriverPerformance: async (start?: string, end?: string) => {
        const params = new URLSearchParams();
        if (start) params.append('start', start);
        if (end) params.append('end', end);

        const response = await api.get<DriverPerformance[]>(`/reports/drivers?${params.toString()}`);
        return response.data;
    },

    getVehicleUtilization: async (start?: string, end?: string) => {
        const params = new URLSearchParams();
        if (start) params.append('start', start);
        if (end) params.append('end', end);

        const response = await api.get<VehicleUtilization[]>(`/reports/vehicles?${params.toString()}`);
        return response.data;
    }
};

export const maintenanceService = {
    getAlerts: async () => {
        const response = await api.get('/maintenance/alerts');
        return response.data;
    }
};
