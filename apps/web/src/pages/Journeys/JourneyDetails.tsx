import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { ArrowLeft, MapPin, Clock, Truck, User, Navigation, AlertTriangle, CheckCircle, AlertCircle, ClipboardList, Flag } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { PhotoGallery } from '../../components/PhotoGallery';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { formatKm, formatDateTime, formatDuration } from '../../lib/utils';

// Fix Leaflet marker icons
const icon = L.icon({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

export function JourneyDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: journey, isLoading } = useQuery({
        queryKey: ['journey', id],
        queryFn: async () => {
            const res = await api.get(`/journeys/${id}`);
            return res.data;
        }
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!journey) {
        return <div className="p-20 text-center font-bold">Jornada não encontrada</div>;
    }

    const checkout = journey.checklists?.find((c: any) => c.type === 'CHECKOUT');
    const checkin = journey.checklists?.find((c: any) => c.type === 'CHECKIN');

    const duration = journey.endTime
        ? Math.floor((new Date(journey.endTime).getTime() - new Date(journey.startTime).getTime()) / (1000 * 60))
        : Math.floor((new Date().getTime() - new Date(journey.startTime).getTime()) / (1000 * 60));

    // Coordinates for the map
    const startPoint = journey.startLocation ? [journey.startLocation.lat, journey.startLocation.lng] as L.LatLngExpression : null;
    const endPoint = journey.endLocation ? [journey.endLocation.lat, journey.endLocation.lng] as L.LatLngExpression : null;
    const mapCenter = startPoint || [-23.55052, -46.633309];

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => navigate('/journeys')}>
                        <ArrowLeft size={24} />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Detalhes da Jornada</h1>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">#{journey.id.slice(0, 8)}</span>
                            <span>•</span>
                            <span className="text-sm">{new Date(journey.startTime).toLocaleDateString('pt-BR', { dateStyle: 'long' })}</span>
                        </div>
                    </div>
                </div>
                <div className="md:ml-auto">
                    <Badge variant={journey.status === 'IN_PROGRESS' ? 'info' : 'success'} size="md" className="px-4 py-1.5 text-base font-black">
                        {journey.status === 'IN_PROGRESS' ? 'EM ANDAMENTO' : 'FINALIZADA'}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="border-none shadow-sm bg-white/50 dark:bg-gray-800/50 backdrop-blur">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
                                        <Truck size={20} />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Veículo</span>
                                </div>
                                <div className="text-2xl font-black">{journey.vehicle?.plate}</div>
                                <div className="text-sm text-muted-foreground">{journey.vehicle?.model}</div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm bg-white/50 dark:bg-gray-800/50 backdrop-blur">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-xl">
                                        <User size={20} />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Motorista</span>
                                </div>
                                <div className="text-2xl font-black truncate">{journey.driver?.name}</div>
                                <div className="text-sm text-green-500 font-bold uppercase text-[10px]">Documentação em dia</div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm bg-white/50 dark:bg-gray-800/50 backdrop-blur">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
                                        <Navigation size={20} />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Operação</span>
                                </div>
                                <div className="text-2xl font-black">
                                    {journey.endKm ? formatKm(journey.endKm - journey.startKm) : 'Ativa'}
                                </div>
                                <div className="text-sm text-muted-foreground font-medium">
                                    {formatDuration(duration)} de jornada
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Timeline & Route Map */}
                    <Card className="border-none shadow-sm overflow-hidden">
                        <CardHeader className="bg-gray-50/50 dark:bg-gray-800/50 border-b dark:border-gray-800">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <MapPin size={20} className="text-blue-600" />
                                Monitoramento de Trajeto e Timeline
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="grid grid-cols-1 md:grid-cols-2">
                                {/* Timeline Side */}
                                <div className="p-6 space-y-8 border-r dark:border-gray-800">
                                    <div className="relative pl-8 space-y-1">
                                        <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-blue-600 border-2 border-white dark:border-gray-900 shadow-sm z-10" />
                                        <div className="absolute left-[7px] top-4 w-0.5 h-[calc(100%+20px)] bg-gray-200 dark:bg-gray-700" />

                                        <h4 className="text-sm font-black uppercase text-blue-600">Partida</h4>
                                        <p className="text-xl font-bold">{formatDateTime(journey.startTime)}</p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <MapPin size={12} /> {journey.startLocation ? `${journey.startLocation.lat.toFixed(4)}, ${journey.startLocation.lng.toFixed(4)}` : 'GPS Indisponível'}
                                        </p>
                                        <div className="mt-2 inline-flex items-center px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-[10px] font-black uppercase tracking-tighter">
                                            Odômetro: {formatKm(journey.startKm)}
                                        </div>
                                    </div>

                                    {journey.endTime && (
                                        <div className="relative pl-8 space-y-1">
                                            <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-green-500 border-2 border-white dark:border-gray-900 shadow-sm z-10" />
                                            <h4 className="text-sm font-black uppercase text-green-500">Chegada</h4>
                                            <p className="text-xl font-bold">{formatDateTime(journey.endTime)}</p>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                <MapPin size={12} /> {journey.endLocation ? `${journey.endLocation.lat.toFixed(4)}, ${journey.endLocation.lng.toFixed(4)}` : 'GPS Indisponível'}
                                            </p>
                                            <div className="mt-2 inline-flex items-center px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-[10px] font-black uppercase tracking-tighter">
                                                Odômetro: {formatKm(journey.endKm!)}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Map Side */}
                                <div className="h-full min-h-[300px] z-0">
                                    <MapContainer
                                        center={mapCenter}
                                        zoom={14}
                                        style={{ height: '100%', width: '100%' }}
                                        scrollWheelZoom={false}
                                    >
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                                        {startPoint && (
                                            <Marker position={startPoint} icon={icon}>
                                                <Popup>Início da Jornada</Popup>
                                            </Marker>
                                        )}

                                        {endPoint && (
                                            <Marker position={endPoint} icon={icon}>
                                                <Popup>Fim da Jornada</Popup>
                                            </Marker>
                                        )}

                                        {startPoint && endPoint && (
                                            <Polyline
                                                positions={[startPoint, endPoint]}
                                                color="#3b82f6"
                                                weight={4}
                                                opacity={0.7}
                                                dashArray="10, 10"
                                            />
                                        )}
                                    </MapContainer>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Detailed Checklists Table */}
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <ClipboardList size={20} className="text-blue-600" />
                                Relatório de Itens Verificados
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Checkout Column */}
                                <div>
                                    <h3 className="font-black text-sm uppercase text-muted-foreground mb-4 pb-2 border-b">Check-out (Saída)</h3>
                                    {checkout ? (
                                        <div className="space-y-2">
                                            {checkout.items.map((item: any) => (
                                                <div key={item.itemName} className="flex items-center justify-between p-2 rounded-lg bg-gray-50/50 dark:bg-gray-800/30">
                                                    <span className="text-sm font-medium">{item.itemName}</span>
                                                    <div className="flex items-center gap-2">
                                                        {item.status === 'OK' ? (
                                                            <CheckCircle size={16} className="text-green-500" />
                                                        ) : (
                                                            <AlertTriangle size={16} className="text-amber-500" />
                                                        )}
                                                        <span className={`text-[10px] font-bold uppercase ${item.status === 'OK' ? 'text-green-600' : 'text-amber-600'}`}>{item.status}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : <p className="text-sm italic text-muted-foreground">Não realizado</p>}
                                </div>

                                {/* Checkin Column */}
                                <div>
                                    <h3 className="font-black text-sm uppercase text-muted-foreground mb-4 pb-2 border-b">Check-in (Retorno)</h3>
                                    {checkin ? (
                                        <div className="space-y-2">
                                            {checkin.items.map((item: any) => (
                                                <div key={item.itemName} className="flex items-center justify-between p-2 rounded-lg bg-gray-50/50 dark:bg-gray-800/30">
                                                    <span className="text-sm font-medium">{item.itemName}</span>
                                                    <div className="flex items-center gap-2">
                                                        {item.status === 'OK' ? (
                                                            <CheckCircle size={16} className="text-green-500" />
                                                        ) : (
                                                            <AlertTriangle size={16} className="text-amber-500" />
                                                        )}
                                                        <span className={`text-[10px] font-bold uppercase ${item.status === 'OK' ? 'text-green-600' : 'text-amber-600'}`}>{item.status}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : <p className="text-sm italic text-muted-foreground">{journey.status === 'IN_PROGRESS' ? 'Aguardando retorno...' : 'Não realizado'}</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar - Photos Only */}
                <div className="space-y-6">
                    <Card className="border-none shadow-sm h-full">
                        <CardHeader className="border-b dark:border-gray-800">
                            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                <AlertCircle size={18} className="text-amber-500" />
                                Evidências Fotográficas
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-8">
                            <div>
                                <h3 className="text-xs font-black uppercase text-blue-600 mb-4 tracking-tighter">Fotos de Saída</h3>
                                <PhotoGallery photos={[
                                    ...(checkout?.items.filter((i: any) => i.photoUrl).map((i: any) => ({ url: i.photoUrl, caption: i.itemName, status: i.status })) || []),
                                    ...(checkout?.attachments?.filter((a: any) => a.type === 'IMAGE').map((a: any) => ({ url: a.url, caption: 'Evidência Fotográfica', status: 'PROBLEM' })) || [])
                                ]} />
                            </div>

                            <div className="pt-8 border-t dark:border-gray-800">
                                <h3 className="text-xs font-black uppercase text-green-500 mb-4 tracking-tighter">Fotos de Retorno</h3>
                                <PhotoGallery photos={[
                                    ...(checkin?.items.filter((i: any) => i.photoUrl).map((i: any) => ({ url: i.photoUrl, caption: i.itemName, status: i.status })) || []),
                                    ...(checkin?.attachments?.filter((a: any) => a.type === 'IMAGE').map((a: any) => ({ url: a.url, caption: 'Evidência Fotográfica', status: 'PROBLEM' })) || [])
                                ]} />
                            </div>

                            {/* Digital Signature */}
                            {journey.attachments?.some((a: any) => a.type === 'SIGNATURE') && (
                                <div className="pt-8 border-t dark:border-gray-800">
                                    <h3 className="text-xs font-black uppercase text-neutral-900 mb-4 tracking-tighter">Assinatura Digital</h3>
                                    <div className="bg-white p-4 rounded-xl border border-neutral-100 shadow-sm">
                                        <img
                                            src={journey.attachments.find((a: any) => a.type === 'SIGNATURE')?.url}
                                            alt="Signature"
                                            className="w-full max-h-24 object-contain grayscale contrast-125"
                                        />
                                        <p className="text-[10px] text-center mt-2 text-neutral-400 font-bold uppercase">Validado via App Frota2026</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
