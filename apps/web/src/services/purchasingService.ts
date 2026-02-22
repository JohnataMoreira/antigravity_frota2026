import { api } from '../lib/axios';

export const purchasingService = {
    getSuppliers: async () => {
        const response = await api.get('/purchasing/suppliers');
        return response.data;
    },

    createSupplier: async (data: any) => {
        const response = await api.post('/purchasing/suppliers', data);
        return response.data;
    },

    getOrders: async (filters?: any) => {
        const response = await api.get('/purchasing/orders', { params: filters });
        return response.data;
    },

    getOrderById: async (id: string) => {
        const response = await api.get(`/purchasing/orders/${id}`);
        return response.data;
    },

    createOrder: async (data: any) => {
        const response = await api.post('/purchasing/orders', data);
        return response.data;
    },

    approveOrder: async (id: string, data: { totalValue: number, notes?: string }) => {
        const response = await api.post(`/purchasing/orders/${id}/approve`, data);
        return response.data;
    },

    completeOrder: async (id: string) => {
        const response = await api.post(`/purchasing/orders/${id}/complete`);
        return response.data;
    },

    cancelOrder: async (id: string) => {
        const response = await api.post(`/purchasing/orders/${id}/cancel`);
        return response.data;
    }
};
