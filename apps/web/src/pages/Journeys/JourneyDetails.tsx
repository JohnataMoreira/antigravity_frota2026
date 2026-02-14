import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { ArrowLeft, MapPin, Calendar, Clock, Truck, User, Navigation, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { PhotoGallery } from '../../components/PhotoGallery';
import { GlassCard } from '../../components/ui/Cards'; // Assuming this exists or I should use Card
// But JourneysList used GlassCard. Let's stick to consistent UI. 
// Actually I created Card.tsx recently (Step 294), let's use that for consistency with new design system.
import { formatKm } from '../../lib/utils';

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
        return <div>Jornada não encontrada</div>;
    }

    // Process checklists
    const checkout = journey.checklists?.find((c: any) => c.type === 'CHECKOUT');
    const checkin = journey.checklists?.find((c: any) => c.type === 'CHECKIN');

    const checkoutPhotos = checkout?.items
        .filter((item: any) => item.photoUrl)
        .map((item: any) => ({
            url: item.photoUrl,
            caption: item.itemName,
            status: item.status,
            notes: item.notes
        })) || [];

    const checkinPhotos = checkin?.items
        .filter((item: any) => item.photoUrl)
        .map((item: any) => ({
            url: item.photoUrl,
            caption: item.itemName,
            status: item.status,
            notes: item.notes
        })) || [];

    const duration = journey.endTime
        ? Math.floor((new Date(journey.endTime).getTime() - new Date(journey.startTime).getTime()) / (1000 * 60))
        : null;

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => navigate('/journeys')}>
                    <ArrowLeft size={24} />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Detalhes da Jornada</h1>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="font-mono text-sm">#{journey.id.slice(0, 8)}</span>
                        <span>•</span>
                        <span>{new Date(journey.startTime).toLocaleDateString('pt-BR', { dateStyle: 'long' })}</span>
                    </div>
                </div>
                <div className="ml-auto">
                    <Badge variant={journey.status === 'IN_PROGRESS' ? 'info' : 'success'} size="md" className="px-4 py-1.5 text-base">
                        {journey.status === 'IN_PROGRESS' ? 'EM ANDAMENTO' : 'FINALIZADA'}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                                        <Truck size={20} />
                                    </div>
                                    <span className="text-sm font-medium text-muted-foreground">Veículo</span>
                                </div>
                                <div className="text-2xl font-bold">{journey.vehicle?.plate}</div>
                                <div className="text-sm text-muted-foreground">{journey.vehicle?.model}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg">
                                        <User size={20} />
                                    </div>
                                    <span className="text-sm font-medium text-muted-foreground">Motorista</span>
                                </div>
                                <div className="text-2xl font-bold truncate">{journey.driver?.name}</div>
                                <div className="text-sm text-muted-foreground">CNH Ativa</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg">
                                        <Navigation size={20} />
                                    </div>
                                    <span className="text-sm font-medium text-muted-foreground">Distância</span>
                                </div>
                                <div className="text-2xl font-bold uppercase">
                                    {journey.endKm ? formatKm(journey.endKm - journey.startKm) : 'Em andamento'}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {duration ? `${Math.floor(duration / 60)}h ${duration % 60}min` : 'Calculando...'}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Timeline & Route Mockup */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin size={20} className="text-primary" />
                                Rota e Linha do Tempo
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative border-l-2 border-muted pl-8 ml-4 space-y-10 py-2">
                                {/* Start Point */}
                                <div className="relative">
                                    <div className="absolute -left-[41px] p-2 bg-blue-500 rounded-full border-4 border-background text-white">
                                        <Navigation size={16} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">Início da Jornada</h3>
                                        <p className="text-muted-foreground text-sm flex items-center gap-2">
                                            <Calendar size={14} /> {new Date(journey.startTime).toLocaleString('pt-BR')}
                                        </p>
                                        <div className="mt-2 text-sm font-mono bg-muted/50 p-2 rounded inline-block uppercase font-bold">
                                            KM Inicial: {formatKm(journey.startKm)}
                                        </div>
                                    </div>
                                </div>

                                {/* End Point */}
                                {journey.endTime && (
                                    <div className="relative">
                                        <div className="absolute -left-[41px] p-2 bg-green-500 rounded-full border-4 border-background text-white">
                                            <Flag size={16} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">Fim da Jornada</h3>
                                            <p className="text-muted-foreground text-sm flex items-center gap-2">
                                                <Calendar size={14} /> {new Date(journey.endTime).toLocaleString('pt-BR')}
                                            </p>
                                            <div className="mt-2 text-sm font-mono bg-muted/50 p-2 rounded inline-block uppercase font-bold">
                                                KM Final: {formatKm(journey.endKm)}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Map Placeholder - To be replaced with Leaflet in "Real-time Map" task */}
                            <div className="mt-8 h-64 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center border border-dashed border-slate-300 dark:border-slate-600">
                                <div className="text-center text-muted-foreground">
                                    <MapPin size={32} className="mx-auto mb-2 opacity-50" />
                                    <p>Mapa da rota será exibido aqui</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar - Checklists */}
                <div className="space-y-6">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Auditoria Visual</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div>
                                <h3 className="font-bold mb-4 flex items-center gap-2">
                                    <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
                                    Check-out (Saída)
                                </h3>
                                {checkout ? (
                                    <PhotoGallery photos={checkoutPhotos} />
                                ) : (
                                    <div className="text-sm text-muted-foreground italic">Pendente</div>
                                )}
                            </div>

                            <div className="border-t border-muted pt-8">
                                <h3 className="font-bold mb-4 flex items-center gap-2">
                                    <div className="w-2 h-8 bg-green-500 rounded-full"></div>
                                    Check-in (Retorno)
                                </h3>
                                {checkin ? (
                                    <PhotoGallery photos={checkinPhotos} />
                                ) : (
                                    <div className="text-sm text-muted-foreground italic">
                                        {journey.status === 'IN_PROGRESS' ? 'Aguardando retorno...' : 'Não realizado'}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function Flag({ size }: { size: number }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
            <line x1="4" y1="22" x2="4" y2="15"></line>
        </svg>
    );
}
