import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import L from 'leaflet';

// Fix Leaflet icons - only on client
if (typeof window !== 'undefined') {
    // @ts-expect-error Leaflet prototype fix
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
}

// Custom Car Icon
const carIcon = typeof window !== 'undefined' ? new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png',
    iconSize: [25, 25],
}) : null;

interface VehicleLocation {
    vehicleId: string;
    lat: number;
    lng: number;
    plate?: string;
}

export function LiveMap() {
    const { user } = useAuth();
    const [locations, setLocations] = useState<Record<string, VehicleLocation>>({});

    useEffect(() => {
        if (!user?.organizationId) return;

        const isProd = !window.location.host.includes('localhost');
        const SOCKET_URL = isProd ? window.location.origin : 'http://localhost:3000';

        const socket = io(`${SOCKET_URL}/locations`, {
            transports: ['websocket', 'polling'],
            auth: {
                token: localStorage.getItem('token')
            }
        });

        socket.on('connect', () => {
            socket.emit('join_organization', user.organizationId);
        });

        socket.on('vehicle_location_updated', (payload: VehicleLocation) => {
            setLocations(prev => ({
                ...prev,
                [payload.vehicleId]: payload
            }));
        });

        return () => {
            socket.disconnect();
        };
    }, [user]);

    const activeVehicles = Object.values(locations);

    return (
        <div className="h-[400px] w-full rounded-lg overflow-hidden border shadow-sm dark:border-gray-800">
            <MapContainer center={[-23.55052, -46.633309]} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {activeVehicles.map(v => (
                    <Marker key={v.vehicleId} position={[v.lat, v.lng]} icon={carIcon || undefined}>
                        <Popup>
                            <strong>Veículo:</strong> {v.plate || v.vehicleId}<br />
                            <strong>Status:</strong> Em movimento
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
