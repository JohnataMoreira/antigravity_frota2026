// Production API URL
export const API_URL = 'https://frota.johnatamoreira.com.br/api';
// Fallback for local development (uncomment if needed)
// export const API_URL = 'http://192.168.1.10:3000/api';

interface LoginResponse {
    access_token: string;
    user: {
        id: string;
        email: string;
        role: string;
        organizationId: string;
    };
}

class ApiService {
    private token: string | null = null;

    setToken(token: string | null) {
        this.token = token;
    }

    private async request(endpoint: string, options: RequestInit = {}) {
        const headers: any = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'API Request Failed');
        }

        return response.json();
    }

    async login(email: string, password: string, organizationDocument: string): Promise<LoginResponse> {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password, document: organizationDocument }),
        });
    }

    async getActiveJourney() {
        return this.request('/journeys/active', { method: 'GET' });
    }

    async startJourney(
        vehicleId: string,
        startKm: number,
        checklistItems?: Array<{
            itemId: string;
            status: 'OK' | 'PROBLEM';
            photoUrl?: string;
            notes?: string;
        }>,
        location?: { lat: number; lng: number }
    ) {
        return this.request('/journeys/start', {
            method: 'POST',
            body: JSON.stringify({
                vehicleId,
                startKm,
                checklistItems,
                lat: location?.lat,
                lng: location?.lng,
            }),
        });
    }

    async endJourney(
        journeyId: string,
        endKm: number,
        checklistItems?: Array<{
            itemId: string;
            status: 'OK' | 'PROBLEM';
            photoUrl?: string;
            notes?: string;
        }>,
        location?: { lat: number; lng: number }
    ) {
        return this.request(`/journeys/${journeyId}/end`, {
            method: 'PATCH',
            body: JSON.stringify({
                endKm,
                checklistItems,
                lat: location?.lat,
                lng: location?.lng,
            }),
        });
    }
}

export const api = new ApiService();
