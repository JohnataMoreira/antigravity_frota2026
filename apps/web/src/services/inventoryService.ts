import { api } from '../lib/axios';

export const inventoryService = {
    getAll: async () => {
        const response = await api.get('/inventory');
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get(`/inventory/${id}`);
        return response.data;
    },

    create: async (data: any) => {
        const response = await api.post('/inventory', data);
        return response.data;
    },

    registerMovement: async (itemId: string, data: { type: 'IN' | 'OUT', quantity: number, reason: string, notes?: string }) => {
        const response = await api.post(`/inventory/${itemId}/movements`, data);
        return response.data;
    }
};
