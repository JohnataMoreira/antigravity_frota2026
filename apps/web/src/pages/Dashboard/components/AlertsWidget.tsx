import { useQuery } from '@tanstack/react-query';
import { maintenanceService } from '../../../services/reportsService';
import { GlassCard } from '../../../components/ui/Cards';
import { AlertTriangle, Wrench, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';

export function AlertsWidget() {
    const { data: alerts, isLoading } = useQuery({
        queryKey: ['maintenance-alerts'],
        queryFn: () => maintenanceService.getAlerts()
    });

    if (isLoading) return <GlassCard className="h-full animate-pulse"><div className="h-6 bg-white/10 rounded w-1/3 mb-4"></div></GlassCard>;

    const hasAlerts = alerts && alerts.length > 0;

    return (
        <GlassCard className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <AlertTriangle className={clsx("w-5 h-5", hasAlerts ? "text-amber-500" : "text-green-500")} />
                    Alertas de Manutenção
                </h3>
                {hasAlerts && (
                    <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-full animate-pulse">
                        {alerts.length} Ação Necessária
                    </span>
                )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 min-h-[200px] max-h-[300px] pr-2 custom-scrollbar">
                {!hasAlerts ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                        <CheckCircle className="w-12 h-12 mb-2" />
                        <p>Tudo certo com a frota!</p>
                    </div>
                ) : (
                    alerts.map((alert: any) => (
                        <div key={alert.vehicleId} className="p-3 bg-white/5 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-bold text-sm text-foreground">{alert.model}</span>
                                <span className="text-xs font-mono bg-black/10 dark:bg-black/40 px-1.5 py-0.5 rounded text-muted-foreground">{alert.plate}</span>
                            </div>
                            <p className={clsx("text-sm font-medium", alert.severity === 'CRITICAL' ? "text-red-400" : "text-amber-400")}>
                                {alert.message}
                            </p>
                            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                                <span>Última: {alert.kmSinceLast} km atrás</span>
                                <Link to="/maintenance" className="text-primary hover:underline">Agendar</Link>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </GlassCard>
    );
}
