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

export interface DriverRanking {
    driverId: string;
    name: string;
    photoUrl?: string;
    totalKm: number;
    kmPerLiter: number;
    incidentCount: number;
    atFaultCount: number;
    checklistCount: number;
    checklistScore: number;
    safetyScore: number;
    efficiencyScore: number;
    complianceScore: number;
    overallScore: number;
}

export const reportsService = {
    getOverview: async (filters: any = {}) => {
        const response = await api.get('/reports/overview', { params: filters });
        return response.data;
    },

    getDriverPerformance: async (filters: any = {}) => {
        const response = await api.get<DriverPerformance[]>('/reports/drivers', { params: filters });
        return response.data;
    },

    getDriverRanking: async (filters: any = {}) => {
        const response = await api.get<DriverRanking[]>('/reports/driver-ranking', { params: filters });
        return response.data;
    },

    getVehicleUtilization: async (filters: any = {}) => {
        const response = await api.get<VehicleUtilization[]>('/reports/vehicles', { params: filters });
        return response.data;
    }
};

export const maintenanceService = {
    getAlerts: async () => {
        const response = await api.get('/maintenance/alerts');
        return response.data;
    }
};
