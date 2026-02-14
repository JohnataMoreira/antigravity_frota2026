import { api } from '../lib/api';
import { StockItem, StockMovement } from '../types/stock';

export const stockService = {
    getAll: async () => {
        const response = await api.get<StockItem[]>('/stock');
        return response.data;
    },

    create: async (data: Partial<StockItem>) => {
        const response = await api.post<StockItem>('/stock', data);
        return response.data;
    },

    registerMovement: async (data: Partial<StockMovement>) => {
        const response = await api.post<StockMovement>('/stock/movement', data);
        return response.data;
    },

    getAlerts: async () => {
        const response = await api.get<StockItem[]>('/stock/alerts');
        return response.data;
    }
};
