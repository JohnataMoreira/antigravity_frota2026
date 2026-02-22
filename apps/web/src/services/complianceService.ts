import { api } from '../lib/axios';

export const complianceService = {
    getDocuments: async (filters?: any) => {
        const response = await api.get('/compliance/documents', { params: filters });
        return response.data;
    },

    createDocument: async (data: any) => {
        const response = await api.post('/compliance/documents', data);
        return response.data;
    },

    getAlerts: async (vehicleId?: string, driverId?: string) => {
        const response = await api.get('/compliance/alerts', {
            params: { vehicleId, driverId }
        });
        return response.data;
    },

    deleteDocument: async (id: string) => {
        const response = await api.delete(`/compliance/documents/${id}`);
        return response.data;
    }
};
