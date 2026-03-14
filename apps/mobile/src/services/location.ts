import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io, Socket } from 'socket.io-client';
import { Platform } from 'react-native';
import { API_URL } from './api';
import { outboxService } from './OutboxService';

export interface LocationCoords {
    latitude: number;
    longitude: number;
}

export const LOCATION_TRACKING_TASK = 'LOCATION_TRACKING_TASK';
const STORAGE_KEY_VEHICLE_ID = '@active_vehicle_id';

// Define the background task
if (Platform.OS !== 'web') {
    TaskManager.defineTask(LOCATION_TRACKING_TASK, async ({ data, error }: any) => {
        if (error) {
            console.error('[BackgroundLocation] Task error:', error);
            return;
        }
        if (data) {
            const { locations } = data;
            const location = locations[0];
            if (location) {
                const { latitude, longitude, speed } = location.coords;
                console.log(`[BackgroundLocation] 📍 Coords: ${latitude}, ${longitude}`);

                try {
                    const vehicleId = await AsyncStorage.getItem(STORAGE_KEY_VEHICLE_ID);
                    if (vehicleId) {
                        await outboxService.enqueue('INGEST_TELEMETRY', {
                            vehicleId,
                            data: {
                                latitude,
                                longitude,
                                speed,
                            }
                        });
                    }
                } catch (err) {
                    console.error('[BackgroundLocation] Failed to enqueue telemetry:', err);
                }
            }
        }
    });
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

    async startBackgroundTracking(vehicleId: string) {
        if (Platform.OS === 'web') return;
        try {
            // Check both foreground and background permissions
            const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
            if (foregroundStatus !== 'granted') {
                console.warn('[BackgroundLocation] Foreground permission denied');
                return;
            }

            const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
            if (backgroundStatus !== 'granted') {
                console.warn('[BackgroundLocation] Background permission denied');
                // We proceed if foreground is granted, but it might not work when app is closed.
            }

            // Persist vehicleId for the task context
            await AsyncStorage.setItem(STORAGE_KEY_VEHICLE_ID, vehicleId);

            const isStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TRACKING_TASK);
            if (isStarted) {
                await Location.stopLocationUpdatesAsync(LOCATION_TRACKING_TASK);
            }

            await Location.startLocationUpdatesAsync(LOCATION_TRACKING_TASK, {
                accuracy: Location.Accuracy.Balanced,
                timeInterval: 10000, // 10 seconds
                distanceInterval: 15, // 15 meters
                foregroundService: {
                    notificationTitle: "Rastreamento Ativo",
                    notificationBody: "Sua jornada está sendo monitorada.",
                    notificationColor: "#2563eb",
                },
                pausesUpdatesAutomatically: true,
            });

            console.log('[BackgroundLocation] ✅ Started background tracking');
        } catch (err) {
            console.error('[BackgroundLocation] ❌ Failed to start:', err);
        }
    }

    async stopBackgroundTracking() {
        if (Platform.OS === 'web') {
            await AsyncStorage.removeItem(STORAGE_KEY_VEHICLE_ID);
            return;
        }
        try {
            const isStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TRACKING_TASK);
            if (isStarted) {
                await Location.stopLocationUpdatesAsync(LOCATION_TRACKING_TASK);
                console.log('[BackgroundLocation] 🛑 Stopped background tracking');
            }
            await AsyncStorage.removeItem(STORAGE_KEY_VEHICLE_ID);
        } catch (err) {
            console.error('[BackgroundLocation] ❌ Failed to stop:', err);
        }
    }

    stopTracking() {
        if (this.watchId) {
            this.watchId.remove();
            this.watchId = null;
        }
    }

    disconnect() {
        this.stopTracking();
        this.stopBackgroundTracking();
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

export const locationService = new LocationService();
