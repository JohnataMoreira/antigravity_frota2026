import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState, useMemo } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import * as L from 'leaflet';

// Fix Leaflet icons - only on client
const fixLeafletIcons = () => {
    if (typeof window !== 'undefined' && L && L.Icon && L.Icon.Default) {
        // @ts-expect-error Leaflet prototype fix
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
    }
};

if (typeof window !== 'undefined') {
    fixLeafletIcons();
}

// Custom Car Icon Factory
const createCarIcon = (status: 'MOVING' | 'STOPPED' | 'OFFLINE', plate: string) => {
    const color = status === 'MOVING' ? '#10b981' : status === 'STOPPED' ? '#ef4444' : '#6b7280';

    try {
        if (!L || !L.divIcon) return undefined;
        return L.divIcon({
            className: 'custom-car-marker',
            html: `
                <div class="relative group">
                    <div class="w-10 h-10 rounded-full border-2 border-white shadow-lg flex items-center justify-center transition-transform hover:scale-110" style="background-color: ${color}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12a6 6 0 0 0 6 6h12a6 6 0 0 0 6-6c0-4-3.13-5.73-6-6Z"/>
                        </svg>
                    </div>
                    <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-black/75 text-white text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        ${plate}
                    </div>
                </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            popupAnchor: [0, -20]
        });
    } catch (e) {
        console.error('Error creating car icon', e);
        return undefined;
    }
};

interface VehicleLocation {
    vehicleId: string;
    lat: number;
    lng: number;
    plate?: string;
    speed?: number;
    status?: 'MOVING' | 'STOPPED' | 'OFFLINE';
    lastUpdate?: string;
}

// Auto Center Component
function AutoCenter({ vehicles }: { vehicles: VehicleLocation[] }) {
    const map = useMap();

    useEffect(() => {
        if (vehicles.length === 0) return;

        const bounds = L.latLngBounds(vehicles.map(v => [v.lat, v.lng]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }, [vehicles, map]);

    return null;
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
            console.log('LiveMap connected to locations namespace');
            socket.emit('join_organization', user.organizationId);
        });

        socket.on('vehicle_location_updated', (payload: VehicleLocation) => {
            setLocations(prev => ({
                ...prev,
                [payload.vehicleId]: {
                    ...payload,
                    status: (payload.speed || 0) > 0 ? 'MOVING' : 'STOPPED', // Simple logic for now
                    lastUpdate: new Date().toISOString()
                }
            }));
        });

        return () => {
            socket.disconnect();
        };
    }, [user]);

    const activeVehicles = Object.values(locations);

    return (
        <div className="h-[400px] w-full rounded-lg overflow-hidden border shadow-sm dark:border-gray-800 relative z-0">
            <MapContainer center={[-23.55052, -46.633309]} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                <AutoCenter vehicles={activeVehicles} />

                {activeVehicles.map(v => (
                    <Marker
                        key={v.vehicleId}
                        position={[v.lat, v.lng]}
                        icon={createCarIcon(v.status || 'STOPPED', v.plate || '???')}
                    >
                        <Popup className="custom-popup">
                            <div className="p-1">
                                <h3 className="font-bold text-sm mb-1">{v.plate || v.vehicleId}</h3>
                                <div className="space-y-1 text-xs">
                                    <div className="flex justify-between items-center gap-4">
                                        <span className="text-muted-foreground">Velocidade:</span>
                                        <span className="font-mono font-bold">{v.speed ? v.speed.toFixed(0) : 0} km/h</span>
                                    </div>
                                    <div className="flex justify-between items-center gap-4">
                                        <span className="text-muted-foreground">Status:</span>
                                        <span className={`font-bold ${v.status === 'MOVING' ? 'text-green-600' : 'text-red-600'}`}>
                                            {v.status === 'MOVING' ? 'Em Movimento' : 'Parado'}
                                        </span>
                                    </div>
                                    <div className="pt-2 border-t mt-2 text-[10px] text-muted-foreground text-right">
                                        {v.lastUpdate ? new Date(v.lastUpdate).toLocaleTimeString() : ''}
                                    </div>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {/* Legend/Controls Overlay */}
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur dark:bg-gray-900/90 p-2 rounded-lg shadow-lg border text-xs z-[400]">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                        <span>Em Movimento</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span>Parado</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
