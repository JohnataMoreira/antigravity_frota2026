import { api } from '../lib/axios';

export const tyreService = {
    getAll: async (filters?: any) => {
        const response = await api.get('/tyres', { params: filters });
        return response.data;
    },

    getStats: async () => {
        const response = await api.get('/tyres/stats');
        return response.data;
    },

    create: async (data: any) => {
        const response = await api.post('/tyres', data);
        return response.data;
    },

    allocate: async (id: string, vehicleId: string, installKm: number) => {
        const response = await api.put(`/tyres/${id}/allocate`, { vehicleId, installKm });
        return response.data;
    },

    discard: async (id: string, currentVehicleKm: number, reason: string) => {
        const response = await api.put(`/tyres/${id}/discard`, { currentVehicleKm, reason });
        return response.data;
    }
};
