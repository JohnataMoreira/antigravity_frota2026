import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/axios';
import { GlassCard } from '../../../components/ui/Cards';
import { AlertCircle, User, Truck, Clock, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function AlertsWidget() {
    const { data: incidents, isLoading } = useQuery({
        queryKey: ['recent-incidents'],
        queryFn: async () => {
            const res = await api.get('/incidents?status=OPEN');
            return res.data;
        }
    });

    if (isLoading) return (
        <GlassCard className="h-full animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/2 mb-6"></div>
            <div className="space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-900 rounded-xl"></div>)}
            </div>
        </GlassCard>
    );

    const hasIncidents = incidents && incidents.length > 0;

    return (
        <GlassCard className="h-full flex flex-col border-amber-500/20 bg-amber-500/5">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <AlertCircle className={hasIncidents ? "text-amber-500" : "text-green-500"} />
                    Incidentes Relatados
                </h3>
                {hasIncidents && (
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-black rounded-full animate-pulse uppercase tracking-wider">
                        {incidents.length} Ativos
                    </span>
                )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 min-h-[300px] max-h-[500px] pr-2 custom-scrollbar">
                {!hasIncidents ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50 py-10">
                        <Clock className="w-12 h-12 mb-3" />
                        <p className="font-bold uppercase tracking-widest text-xs">Nenhum incidente hoje</p>
                    </div>
                ) : (
                    incidents.map((incident: any) => (
                        <div key={incident.id} className="group p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-amber-500/50 transition-all shadow-sm hover:shadow-md">
                            <div className="flex items-start justify-between mb-3">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm font-black text-foreground">
                                        <User size={14} className="text-primary" />
                                        {incident.driver?.name}
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                        <Truck size={14} />
                                        {incident.vehicle?.model} • {incident.vehicle?.plate}
                                    </div>
                                </div>
                                <span className="text-[10px] font-black text-muted-foreground/50 flex items-center gap-1">
                                    <Clock size={12} />
                                    {format(new Date(incident.createdAt), 'HH:mm', { locale: ptBR })}
                                </span>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl mb-3">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 italic line-clamp-2">
                                    "{incident.description}"
                                </p>
                            </div>

                            {incident.photoUrl && (
                                <div className="mb-3 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                                    <img
                                        src={incident.photoUrl}
                                        alt="Evidência do incidente"
                                        className="w-full h-32 object-cover hover:scale-105 transition-transform duration-500"
                                    />
                                </div>
                            )}

                            <button className="w-full py-2 bg-amber-500/10 hover:bg-amber-500 text-amber-600 hover:text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 border border-amber-500/20">
                                <Eye size={14} />
                                Ver Detalhes
                            </button>
                        </div>
                    ))
                )}
            </div>
        </GlassCard>
    );
}
