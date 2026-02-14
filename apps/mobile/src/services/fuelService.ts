import { API_URL } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FuelEntryData {
    vehicleId: string;
    journeyId?: string;
    km: number;
    liters: number;
    totalValue: number;
    pricePerLiter: number;
    fuelType?: string;
    paymentMethod: string;
    paymentProvider?: string;
    paymentReference?: string;
    photoUrl?: string;
    notes?: string;
}

export const fuelService = {
    async create(data: FuelEntryData) {
        const token = await AsyncStorage.getItem('token');
        if (!token) throw new Error('No token found');

        const response = await fetch(`${API_URL}/fuel`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error creating fuel entry');
        }

        return response.json();
    },

    async getStats(vehicleId?: string) {
        const token = await AsyncStorage.getItem('token');
        const response = await fetch(`${API_URL}/fuel/stats${vehicleId ? `?vehicleId=${vehicleId}` : ''}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Error fetching fuel stats');
        return response.json();
    }
};
