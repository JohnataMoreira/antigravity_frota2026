import * as Location from 'expo-location';
import { io, Socket } from 'socket.io-client';
import { API_URL } from './api';

class LocationService {
    private socket: Socket | null = null;
    private interval: ReturnType<typeof setInterval> | null = null;
    private watchId: Location.LocationSubscription | null = null;

    connect(organizationId: string, token: string) {
        if (this.socket) return;

        // Use namespaced socket with auth
        this.socket = io(`${API_URL}/locations`, {
            auth: { token },
            transports: ['websocket']
        });

        this.socket.on('connect', () => {
            console.log('Mobile connected to Locations WebSocket');
        });

        this.socket.on('disconnect', () => {
            console.log('Mobile disconnected from Locations');
        });
    }

    async getCurrentPosition(): Promise<{ lat: number; lng: number } | null> {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== 'granted') {
                console.warn('Location permission not granted');
                return null;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            return {
                lat: location.coords.latitude,
                lng: location.coords.longitude,
            };
        } catch (error) {
            console.error('Error getting current position:', error);
            return null;
        }
    }

    async startTracking(vehicleId: string, journeyId: string, token?: string, organizationId?: string) {
        // Request permission
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
            console.warn('Location permission not granted for tracking');
            return;
        }

        // Connect WebSocket if credentials provided
        if (token && organizationId) {
            this.connect(organizationId, token);
        }

        // Watch position changes
        this.watchId = await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.Balanced,
                timeInterval: 5000, // Update every 5s
                distanceInterval: 10, // Or when moved 10m
            },
            (location) => {
                const { latitude, longitude } = location.coords;

                console.log('Location update:', { latitude, longitude });

                // Emit to WebSocket if connected
                this.socket?.emit('update_location', {
                    vehicleId,
                    journeyId,
                    lat: latitude,
                    lng: longitude,
                });
            }
        );
    }

    stopTracking() {
        if (this.watchId) {
            this.watchId.remove();
            this.watchId = null;
        }

        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    disconnect() {
        this.stopTracking();

        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

export const locationService = new LocationService();
