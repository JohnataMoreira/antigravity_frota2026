import React from 'react';
import { Activity, Clock, MapPin, User, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ActiveJourney {
    id: string;
    driverName: string;
    driverAvatar?: string;
    vehiclePlate: string;
    vehicleModel: string;
    startTime: string;
    isDeviated: boolean;
}

interface ActiveJourneysWidgetProps {
    journeys: ActiveJourney[];
    isLoading?: boolean;
}

export function ActiveJourneysWidget({ journeys, isLoading }: ActiveJourneysWidgetProps) {
    if (isLoading) {
        return (
            <div className="bg-white/50 backdrop-blur-md border border-white/20 rounded-3xl p-6 shadow-xl animate-pulse">
                <div className="h-6 w-48 bg-gray-200 rounded-lg mb-6"></div>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 w-full bg-gray-100 rounded-2xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white/50 backdrop-blur-md border border-white/20 rounded-3xl p-6 shadow-xl flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-500" />
                    Em Rota Agora
                </h2>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-600 text-[10px] font-black rounded-full uppercase">
                    {journeys.length} Ativas
                </span>
            </div>

            <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 max-h-[400px]">
                {journeys.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                        <MapPin className="w-12 h-12 mx-auto mb-4 opacity-10" />
                        <p className="text-sm font-bold uppercase tracking-tight">Nenhuma jornada ativa</p>
                    </div>
                ) : (
                    journeys.map((journey) => (
                        <div
                            key={journey.id}
                            className={`group p-4 rounded-2xl border transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer ${journey.isDeviated
                                    ? 'bg-amber-50 border-amber-100'
                                    : 'bg-white/30 border-white/40 hover:bg-white/60'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden border border-white/50">
                                        {journey.driverAvatar ? (
                                            <img src={journey.driverAvatar} alt={journey.driverName} className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-5 h-5 text-gray-400" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="text-sm font-black uppercase tracking-tight text-foreground truncate max-w-[120px]">
                                            {journey.driverName}
                                        </div>
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                                            <span className="text-foreground">{journey.vehiclePlate}</span>
                                            <span>•</span>
                                            <span className="truncate max-w-[80px]">{journey.vehicleModel}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-black uppercase text-muted-foreground flex items-center justify-end gap-1 mb-1">
                                        <Clock size={10} />
                                        {formatDistanceToNow(new Date(journey.startTime), { addSuffix: false, locale: ptBR })}
                                    </div>
                                    {journey.isDeviated && (
                                        <span className="px-2 py-0.5 bg-amber-600 text-white text-[8px] font-black rounded uppercase animate-pulse">
                                            Fora de Rota
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {journeys.length > 0 && (
                <button className="mt-4 w-full py-3 bg-gray-50 hover:bg-gray-100 text-[10px] font-black uppercase tracking-widest text-muted-foreground rounded-xl transition-all flex items-center justify-center gap-2 group">
                    Ver Mapa Completo
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
            )}
        </div>
    );
}
