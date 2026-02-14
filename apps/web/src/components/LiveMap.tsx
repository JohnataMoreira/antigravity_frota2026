import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState, useMemo } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import L from 'leaflet';
import { Clock } from 'lucide-react';

// Fix Leaflet icons - only on client
const fixLeafletIcons = (L_instance: any) => {
    if (typeof window !== 'undefined' && L_instance && L_instance.Icon && L_instance.Icon.Default) {
        try {
            if (L_instance.Icon.Default.prototype) {
                delete (L_instance.Icon.Default.prototype as any)._getIconUrl;
                L_instance.Icon.Default.mergeOptions({
                    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
                    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                });
            }
        } catch (e) {
            console.warn('Leaflet icon fix failed', e);
        }
    }
};

// Custom Car Icon Factory
const createCarIcon = (status: 'MOVING' | 'STOPPED' | 'OFFLINE', plate: string) => {
    const color = status === 'MOVING' ? '#10b981' : status === 'STOPPED' ? '#ef4444' : '#6b7280';

    if (typeof window === 'undefined') return undefined;

    try {
        // Try all possible ways to get Leaflet
        const leaflet = (window as any).L || L;

        // n is not a function error often happens when divIcon is missing or improperly bound
        const divIconFn = leaflet?.divIcon || (L as any)?.divIcon;

        if (typeof divIconFn !== 'function') {
            console.warn('Leaflet divIcon not found, using default marker');
            return undefined;
        }

        return divIconFn({
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
        if (typeof window === 'undefined' || vehicles.length === 0 || !map) return;

        try {
            const leaflet = (window as any).L || L;
            if (!leaflet || !leaflet.latLngBounds) return;

            const points = vehicles.map(v => [v.lat, v.lng] as L.LatLngExpression);
            if (points.length > 0) {
                const bounds = leaflet.latLngBounds(points);
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
            }
        } catch (e) {
            console.error('Error fitting bounds', e);
        }
    }, [vehicles, map]);

    return null;
}

export function LiveMap() {
    const { user } = useAuth();
    const [locations, setLocations] = useState<Record<string, VehicleLocation>>({});
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);

        const timer = setTimeout(() => {
            if (typeof window !== 'undefined') {
                fixLeafletIcons((window as any).L || L);
            }
        }, 100);

        if (!user?.organizationId) return () => clearTimeout(timer);

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
                [payload.vehicleId]: {
                    ...payload,
                    status: (payload.speed || 0) > 0 ? 'MOVING' : 'STOPPED',
                    lastUpdate: new Date().toISOString()
                }
            }));
        });

        return () => {
            clearTimeout(timer);
            socket.disconnect();
        };
    }, [user]);

    const activeVehicles = useMemo(() => {
        return Object.values(locations).filter(v =>
            typeof v.lat === 'number' &&
            typeof v.lng === 'number' &&
            !isNaN(v.lat) &&
            !isNaN(v.lng)
        );
    }, [locations]);

    if (!isMounted) return <div className="h-[400px] bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />;

    return (
        <div className="h-[400px] w-full rounded-lg overflow-hidden border shadow-sm dark:border-gray-800 relative z-0">
            {activeVehicles.length === 0 && (
                <div className="absolute inset-0 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
                    <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border dark:border-gray-700">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="font-bold text-sm">Aguardando sinais de GPS...</p>
                        <p className="text-[10px] text-muted-foreground uppercase mt-1 tracking-widest font-black">Organização #{user?.organizationId?.slice(0, 8)}</p>
                    </div>
                </div>
            )}

            <MapContainer center={[-23.55052, -46.633309]} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                <AutoCenter vehicles={activeVehicles} />

                {activeVehicles.map(v => {
                    const icon = createCarIcon(v.status || 'STOPPED', v.plate || '???');
                    if (!icon) return null;

                    return (
                        <Marker
                            key={v.vehicleId}
                            position={[v.lat, v.lng]}
                            icon={icon}
                        >
                            <Popup className="custom-popup">
                                <div className="p-1 min-w-[150px]">
                                    <h3 className="font-black text-base mb-1 text-primary">{v.plate || v.vehicleId}</h3>
                                    <div className="space-y-1.5 text-xs font-bold">
                                        <div className="flex justify-between items-center gap-4 py-1 border-b dark:border-gray-700">
                                            <span className="text-muted-foreground uppercase text-[10px]">Velocidade:</span>
                                            <span className="font-mono text-foreground">{v.speed ? v.speed.toFixed(0) : 0} km/h</span>
                                        </div>
                                        <div className="flex justify-between items-center gap-4 py-1 border-b dark:border-gray-700">
                                            <span className="text-muted-foreground uppercase text-[10px]">Status:</span>
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase ${v.status === 'MOVING' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                                {v.status === 'MOVING' ? 'Em Movimento' : 'Parado'}
                                            </span>
                                        </div>
                                        <div className="pt-2 text-[9px] text-muted-foreground/60 text-right flex items-center justify-end gap-1">
                                            <Clock size={10} /> {v.lastUpdate ? new Date(v.lastUpdate).toLocaleTimeString() : ''}
                                        </div>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>

            <div className="absolute top-4 right-4 bg-white/95 backdrop-blur dark:bg-gray-900/95 p-3 rounded-2xl shadow-2xl border dark:border-gray-700 text-[10px] z-[400] font-black uppercase tracking-widest">
                <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                        <span className="text-foreground/80 font-bold">Em Movimento</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                        <span className="text-foreground/80 font-bold">Parado</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
