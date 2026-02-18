import { api } from '../lib/axios';

export const fuelService = {
    getStats: async (filters: any = {}) => {
        const response = await api.get('/fuel/stats', { params: filters });
        return response.data;
    },
    getAllEntries: async (filters: any = {}) => {
        const response = await api.get('/fuel', { params: filters });
        return response.data;
    }
};
