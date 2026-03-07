import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';
import { GlassCard } from '../../../components/ui/Cards';
import { Bell, Check, Clock, AlertTriangle, Info, Calendar, MapPin, ClipboardCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

interface SystemAlert {
    id: string;
    title: string;
    message: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    createdAt: string;
}

export function SystemAlertsWidget() {
    const queryClient = useQueryClient();

    const { data: alerts = [], isLoading } = useQuery({
        queryKey: ['system-alerts'],
        queryFn: async () => {
            const res = await api.get('/alerts');
            return res.data;
        }
    });

    const resolveMutation = useMutation({
        mutationFn: (id: string) => api.patch(`/alerts/${id}/resolve`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['system-alerts'] });
            toast.success('Alerta resolvido');
        }
    });

    if (isLoading) return (
        <GlassCard className="animate-pulse">
            <div className="h-4 w-32 bg-muted rounded mb-4" />
            <div className="space-y-3">
                <div className="h-20 bg-muted/50 rounded-2xl" />
                <div className="h-20 bg-muted/50 rounded-2xl" />
            </div>
        </GlassCard>
    );

    const getSeverityStyles = (severity: string) => {
        switch (severity) {
            case 'HIGH': return 'border-red-500/20 bg-red-500/5 text-red-600 dark:text-red-400';
            case 'MEDIUM': return 'border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400';
            default: return 'border-blue-500/20 bg-blue-500/5 text-blue-600 dark:text-blue-400';
        }
    };

    const getIcon = (title: string, severity: string) => {
        if (title.includes('Documento')) return <Calendar size={16} />;
        if (title.includes('Jornada')) return <MapPin size={16} />;
        if (title.includes('Checklist')) return <ClipboardCheck size={16} />;
        return severity === 'HIGH' ? <AlertTriangle size={16} /> : <Info size={16} />;
    };

    return (
        <GlassCard className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <Bell className={alerts.length > 0 ? "text-primary animate-bounce" : "text-muted-foreground"} size={20} />
                        Alertas do Sistema
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-0.5">Notificações Inteligentes</p>
                </div>
                {alerts.length > 0 && (
                    <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-lg">
                        {alerts.length} PENDENTES
                    </span>
                )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1 max-h-[400px]">
                {alerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 opacity-40">
                        <Check className="w-12 h-12 text-green-500 mb-2" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Nenhum alerta crítico</p>
                    </div>
                ) : (
                    alerts.map((alert: SystemAlert) => (
                        <div
                            key={alert.id}
                            className={`p-4 rounded-2xl border transition-all hover:shadow-md group ${getSeverityStyles(alert.severity)}`}
                        >
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex gap-3">
                                    <div className="mt-1">
                                        {getIcon(alert.title, alert.severity)}
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-tight">{alert.title}</h4>
                                        <p className="text-[11px] font-medium leading-relaxed mt-1 opacity-90">{alert.message}</p>
                                        <div className="flex items-center gap-2 mt-2 opacity-60">
                                            <Clock size={10} />
                                            <span className="text-[9px] font-bold uppercase">
                                                {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true, locale: ptBR })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => resolveMutation.mutate(alert.id)}
                                    className="p-2 hover:bg-white/20 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                                    title="Marcar como resolvido"
                                >
                                    <Check size={14} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </GlassCard>
    );
}
