import { GlassCard } from '../../../components/ui/Cards';
import { AlertTriangle, CheckCircle2, Wrench, ArrowRight } from 'lucide-react';
import { formatKm } from '../../../lib/utils';
import { useNavigate } from 'react-router-dom';

interface VehicleHealthCardProps {
 alerts: any[];
 isLoading?: boolean;
}

export function VehicleHealthCard({ alerts, isLoading }: VehicleHealthCardProps) {
 const navigate = useNavigate();

 if (isLoading) {
 return (
 <GlassCard className="animate-pulse flex flex-col gap-4 py-8 items-center justify-center">
 <Wrench className="w-10 h-10 text-gray-200" />
 <div className="h-4 w-32 bg-gray-100 rounded-full" />
 </GlassCard>
 );
 }

 const criticalCount = alerts.filter(a => a.severity === 'CRITICAL').length;
 const warningCount = alerts.filter(a => a.severity === 'WARNING').length;

 return (
 <GlassCard className="h-full flex flex-col">
 <div className="flex justify-between items-start mb-6">
 <div>
 <h3 className="text-xl font-black text-gray-900 ">Saúde da Frota</h3>
 <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Manutenção Preventiva</p>
 </div>
 <div className="flex gap-2">
 {criticalCount > 0 && (
 <div className="px-3 py-1 bg-red-100 text-red-600 text-[10px] font-black rounded-full animate-pulse">
 {criticalCount} CRÍTICO
 </div>
 )}
 {warningCount > 0 && (
 <div className="px-3 py-1 bg-amber-100 text-amber-600 text-[10px] font-black rounded-full">
 {warningCount} ALERTA
 </div>
 )}
 </div>
 </div>

 <div className="space-y-3 flex-grow overflow-hidden">
 {alerts.slice(0, 4).map((alert) => (
 <div
 key={alert.id}
 className={`p-3 rounded-2xl border flex items-center justify-between group hover:shadow-md transition-all cursor-pointer ${alert.severity === 'CRITICAL'
 ? 'bg-red-50/50 border-red-100 '
 : 'bg-amber-50/50 border-amber-100 '
 }`}
 onClick={() => navigate('/maintenance')}
 >
 <div className="flex items-center gap-3">
 <div className={`p-2 rounded-xl ${alert.severity === 'CRITICAL' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
 <Wrench size={16} />
 </div>
 <div>
 <div className="font-bold text-sm text-gray-900 ">{alert.plate}</div>
 <div className="text-[10px] text-muted-foreground font-medium uppercase">{alert.templateName}</div>
 </div>
 </div>
 <div className="text-right">
 <div className={`text-xs font-black ${alert.severity === 'CRITICAL' ? 'text-red-600' : 'text-amber-600'}`}>
 {alert.severity === 'CRITICAL' ? 'VENCIDO' : 'PRÓXIMO'}
 </div>
 <div className="text-[10px] font-bold text-muted-foreground">{formatKm(alert.nextMaintenanceKm)}</div>
 </div>
 </div>
 ))}

 {alerts.length === 0 && (
 <div className="flex flex-col items-center justify-center py-10 opacity-50">
 <CheckCircle2 size={40} className="text-green-500 mb-2" />
 <p className="font-bold text-gray-400">Frota 100% em dia</p>
 </div>
 )}
 </div>

 <button
 onClick={() => navigate('/maintenance')}
 className="w-full mt-6 py-3 border-2 border-dashed border-gray-200 rounded-2xl text-xs font-black text-muted-foreground hover:bg-gray-50 hover:text-primary transition-all flex items-center justify-center gap-2 group"
 >
 VER GESTÃO DE MANUTENÇÃO
 <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
 </button>
 </GlassCard>
 );
}

