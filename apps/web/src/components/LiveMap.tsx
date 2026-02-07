import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import L from 'leaflet';

// Fix Leaflet icons
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Car Icon
const carIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png', // Temporary car icon
    iconSize: [25, 25],
});

interface VehicleLocation {
    vehicleId: string;
    lat: number;
    lng: number;
    plate?: string; // Optional metadata
}

export function LiveMap() {
    const { user } = useAuth();
    const [locations, setLocations] = useState<Record<string, VehicleLocation>>({});

    useEffect(() => {
        // Connect to namespace
        const socket = io('http://localhost:3000/locations', {
            // auth: { token }
        });

        socket.on('connect', () => {
            console.log('Connected to Locations WS');
            if (user) {
                // Hardcoded org for MVP if not in user context properly yet
                // But AuthContext has it? We didn't persist orgId in AuthContext clearly in MVP
                // Assuming user has organizationId or we send what we have.
                // For now, let's join a test room 'org_123' or real one if available
                socket.emit('join_organization', '123'); // Demo ID
            }
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
        <div className="h-[400px] w-full rounded-lg overflow-hidden border shadow-sm">
            <MapContainer center={[-23.55052, -46.633309]} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {activeVehicles.map(v => (
                    <Marker key={v.vehicleId} position={[v.lat, v.lng]} icon={carIcon}>
                        <Popup>
                            Vehicle: {v.vehicleId}
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
