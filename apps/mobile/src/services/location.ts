import * as Location from 'expo-location';
import { io, Socket } from 'socket.io-client';
import { API_URL } from './api';

export interface LocationCoords {
    latitude: number;
    longitude: number;
}

class LocationService {
    private socket: Socket | null = null;
    private watchId: Location.LocationSubscription | null = null;
    private onLocationChange?: (coords: LocationCoords) => void;

    connect(organizationId: string, token: string) {
        if (this.socket) return;

        this.socket = io(`${API_URL}/locations`, {
            auth: { token },
            transports: ['websocket']
        });

        this.socket.on('connect', () => {
            console.log('Mobile connected to Locations');
        });
    }

    async getCurrentPosition(): Promise<{ lat: number; lng: number } | null> {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return null;

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

    async startTracking(
        vehicleId: string,
        journeyId: string,
        token?: string,
        organizationId?: string,
        onLocationChange?: (coords: LocationCoords) => void
    ) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        this.onLocationChange = onLocationChange;

        if (token && organizationId) {
            this.connect(organizationId, token);
        }

        this.watchId = await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.Balanced,
                timeInterval: 5000,
                distanceInterval: 10,
            },
            (location) => {
                const { latitude, longitude } = location.coords;

                if (this.onLocationChange) {
                    this.onLocationChange({ latitude, longitude });
                }

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
