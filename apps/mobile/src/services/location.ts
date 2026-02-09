import { io, Socket } from 'socket.io-client';
import { API_URL } from './api';

class LocationService {
    private socket: Socket | null = null;
    private interval: ReturnType<typeof setInterval> | null = null;

    connect(organizationId: string, token: string) {
        if (this.socket) return;

        // [12/10 STRATEGY] Use namespaced socket with auth
        this.socket = io(`${API_URL}/locations`, {
            auth: { token },
            transports: ['websocket']
        });

        this.socket.on('connect', () => {
            console.log('Mobile connected to Locations');
            // Assuming driver is part of organization
        });
    }

    startEmitting(vehicleId: string, organizationId: string, token: string) {
        if (!this.socket) this.connect(organizationId, token);

        if (this.interval) clearInterval(this.interval);

        // Simulate movement around São Paulo
        let lat = -23.55052;
        let lng = -46.633309;

        this.interval = setInterval(() => {
            // Jitter
            lat += (Math.random() - 0.5) * 0.001;
            lng += (Math.random() - 0.5) * 0.001;

            this.socket?.emit('update_location', {
                vehicleId,
                organizationId,
                lat,
                lng
            });
        }, 5000); // Every 5s
    }

    stopEmitting() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
}

export const locationService = new LocationService();
