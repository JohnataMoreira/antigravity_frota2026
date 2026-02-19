import { api } from '../lib/axios';

export const tyreService = {
    getAll: async () => {
        const response = await api.get('/tyres');
        return response.data;
    },

    getStats: async () => {
        const response = await api.get('/tyres/stats');
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get(`/tyres/${id}`);
        return response.data;
    },

    create: async (data: any) => {
        const response = await api.post('/tyres', data);
        return response.data;
    },

    install: async (id: string, data: any) => {
        const response = await api.post(`/tyres/${id}/install`, data);
        return response.data;
    },

    recordMeasurement: async (id: string, data: any) => {
        const response = await api.post(`/tyres/${id}/measure`, data);
        return response.data;
    },

    remove: async (id: string, data: { km: number, notes?: string }) => {
        const response = await api.patch(`/tyres/${id}/remove`, data);
        return response.data;
    }
};
