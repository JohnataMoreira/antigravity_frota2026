import { Platform } from 'react-native';

// detect environment
const isLocal = __DEV__;

// Use your machine's local IP to allow physical device testing and stable web access
const DEV_IP = '192.168.68.114';

// Production API URL - Added /v1 for NestJS versioning
// Android emulator uses 10.0.2.2 to access localhost, 
// but using the machine IP is more consistent across all platforms.
const LOCAL_API_URL = Platform.OS === 'android' 
    ? `http://10.0.2.2:3000/api/v1` 
    : `http://${DEV_IP}:3000/api/v1`;

export const API_URL = isLocal 
    ? LOCAL_API_URL 
    : 'https://frota.johnatamoreira.com.br/api/v1';


interface LoginResponse {
    access_token: string;
    user: {
        id: string;
        email: string;
        role: string;
        organizationId: string;
    };
}

type UnauthorizedListener = () => void;

class ApiService {
    private token: string | null = null;
    private unauthorizedListeners: UnauthorizedListener[] = [];

    setToken(token: string | null) {
        this.token = token;
    }

    onUnauthorized(listener: UnauthorizedListener) {
        this.unauthorizedListeners.push(listener);
        return () => {
            this.unauthorizedListeners = this.unauthorizedListeners.filter(l => l !== listener);
        };
    }

    private notifyUnauthorized() {
        this.unauthorizedListeners.forEach(l => l());
    }

    private async request(endpoint: string, options: RequestInit = {}) {
        const method = options.method || 'GET';
        const body = options.body;
        const headers: any = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            console.log(`[API] 📡 ${method} ${endpoint}`, body ? '(with body)' : '');
            const response = await fetch(`${API_URL}${endpoint}`, {
                ...options,
                headers,
            });

            console.log(`[API] 📥 Response: ${response.status} ${response.statusText}`);

            if (response.status === 401) {
                this.notifyUnauthorized();
                const error: any = new Error('Unauthorized');
                error.status = 401;
                throw error;
            }

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    const errorText = await response.text();
                    errorData = { message: errorText || `Request failed with status ${response.status}` };
                }

                const error: any = new Error(errorData.message || 'Erro na requisição');
                error.status = response.status;
                error.data = errorData;
                throw error;
            }

            return await response.json();
        } catch (error: any) {
            console.error(`[API] ❌ Error in ${method} ${endpoint}:`, error);
            if (!error.status && (error.message === 'Failed to fetch' || error.message === 'Network request failed')) {
                error.status = 0; 
            }
            throw error;
        }
    }

    async login(email: string, password: string, organizationDocument: string): Promise<LoginResponse> {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password, document: organizationDocument }),
        });
    }

    async getActiveJourney() {
        try {
            return await this.request('/journeys/active', { method: 'GET' });
        } catch (e: any) {
            // 404 means no active journey — not an error
            if (e.message?.includes('404') || e.message?.includes('Not Found')) return null;
            throw e;
        }
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

    async reportIncident(data: {
        vehicleId: string;
        journeyId?: string;
        description: string;
        severity?: string;
        photoUrl?: string;
        lat?: string;
        lng?: string;
    }) {
        return this.request('/incidents', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async createFuelEntry(data: any) {
        return this.request('/fuel', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
    
    async createExpense(data: any) {
        return this.request('/finance', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async ingestTelemetry(vehicleId: string, data: {
        latitude: number;
        longitude: number;
        speed?: number;
        odometer?: number;
    }) {
        return this.request(`/telemetry/ingest/${vehicleId}`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getVehicles() {
        return this.request('/vehicles', { method: 'GET' });
    }

    async subscribePushToken(token: string) {
        return this.request('/notifications/subscribe', {
            method: 'POST',
            body: JSON.stringify(token),
        });
    }

    async getTasks() {
        return this.request('/tasks', { method: 'GET' });
    }

    async updateTaskStatus(taskId: string, status: string) {
        return this.request(`/tasks/${taskId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
    }

    async getDocuments() {
        return this.request('/documents/my', { method: 'GET' });
    }
}

export const api = new ApiService();
