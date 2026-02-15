import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/axios';
import { GlassCard } from '../../../components/ui/Cards';
import { X, Play, MapPin, Gauge, User, CheckCircle2 } from 'lucide-react';
import { RouteSelector } from '../../../components/RouteSelector';
import { formatKm } from '../../../lib/utils';

interface StartJourneyModalProps {
    isOpen: boolean;
    onClose: () => void;
    vehicle: any;
}

export function StartJourneyModal({ isOpen, onClose, vehicle }: StartJourneyModalProps) {
    const queryClient = useQueryClient();
    const [startKm, setStartKm] = useState(vehicle?.currentKm || 0);
    const [plannedRoute, setPlannedRoute] = useState<[number, number][] | null>(null);
    const [destinationName, setDestinationName] = useState('');

    const startMutation = useMutation({
        mutationFn: (data: any) => api.post('/journeys/start', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['journeys'] });
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
            onClose();
        }
    });

    if (!isOpen) return null;

    const handleStart = () => {
        startMutation.mutate({
            vehicleId: vehicle.id,
            startKm,
            plannedRoute,
            destinationName
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <GlassCard className="w-full max-w-2xl relative z-10 animate-in zoom-in-95 duration-200 !p-0 overflow-hidden border shadow-2xl">
                <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <Play size={24} fill="white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tight">Iniciar Jornada</h2>
                            <p className="text-xs font-bold opacity-80 uppercase tracking-widest">{vehicle.plate} • {vehicle.model}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Step 1: KM Info */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-4">
                            <Gauge size={16} />
                            <span className="text-xs font-black uppercase tracking-widest">Informações de Saída</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border dark:border-gray-700">
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Km Atual no Painel</label>
                                <input
                                    type="number"
                                    className="bg-transparent text-xl font-black w-full outline-none"
                                    value={startKm}
                                    onChange={(e) => setStartKm(parseInt(e.target.value))}
                                />
                                <p className="text-[10px] text-muted-foreground mt-2">Relatado anteriormente: {formatKm(vehicle.currentKm)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Step 2: Route Selection */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-4">
                            <MapPin size={16} />
                            <span className="text-xs font-black uppercase tracking-widest">Definição de Destino (OSRM)</span>
                        </div>
                        <RouteSelector onRouteSelected={(route, name) => {
                            setPlannedRoute(route);
                            setDestinationName(name);
                        }} />

                        {plannedRoute && (
                            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-2">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
                                        <CheckCircle2 size={20} />
                                    </div>
                                    <div>
                                        <div className="text-xs font-black uppercase tracking-tighter text-emerald-600">Rota Planejada com Sucesso</div>
                                        <div className="text-[10px] font-bold text-muted-foreground truncate max-w-[300px]">{destinationName}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-black text-emerald-600 leading-none">{(plannedRoute.length * 0.1).toFixed(1)} <span className="text-xs font-bold">km</span></div>
                                    <div className="text-[9px] font-black text-muted-foreground uppercase">Estimativa OSRM</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t dark:border-gray-800 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 font-black text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        disabled={!startKm || !plannedRoute || startMutation.isPending}
                        onClick={handleStart}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 flex items-center gap-2 transition-all active:scale-95"
                    >
                        {startMutation.isPending ? 'Iniciando...' : 'Iniciar Jornada'}
                        <ArrowRight size={18} />
                    </button>
                </div>
            </GlassCard>
        </div>
    );
}

import { ArrowRight } from 'lucide-react';
