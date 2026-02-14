import { api } from '../lib/axios';

export const fuelService = {
    getStats: async (vehicleId?: string) => {
        const response = await api.get(`/fuel/stats${vehicleId ? `?vehicleId=${vehicleId}` : ''}`);
        return response.data;
    },
    getAllEntries: async () => {
        const response = await api.get('/fuel');
        return response.data;
    }
};
