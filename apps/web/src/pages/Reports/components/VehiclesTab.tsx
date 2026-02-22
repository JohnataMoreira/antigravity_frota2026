import { useQuery } from '@tanstack/react-query';
import { reportsService } from '../../../services/reportsService';
import { GlassCard } from '../../../components/ui/Cards';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Truck, Wrench, AlertTriangle, TrendingUp } from 'lucide-react';
import { formatCurrency, formatKm } from '../../../lib/utils';
import { ExportActions } from './ExportActions';

export function VehiclesTab({ filters }: { filters: any }) {
    const { data: vehicles, isLoading } = useQuery({
        queryKey: ['reports-vehicles', filters],
        queryFn: () => reportsService.getVehicleUtilization(filters)
    });

    if (isLoading) return <div className="text-center py-10">Carregando dados...</div>;

    const mostUsed = vehicles?.[0];
    const costliest = [...(vehicles || [])].sort((a, b) => b.maintenanceCost - a.maintenanceCost)[0];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mostUsed && (
                    <div className="bg-card/40 backdrop-blur-sm border border-border/50 p-6 rounded-[32px] shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all group">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                <Truck size={32} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-[0.2em] mb-1">Veículo Mais Utilizado</p>
                                <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter">{mostUsed.model}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                    <p className="text-sm font-black text-blue-400 tracking-tight">{formatKm(mostUsed.totalKm)} rodados</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {costliest && (
                    <div className="bg-card/40 backdrop-blur-sm border border-border/50 p-6 rounded-[32px] shadow-sm hover:shadow-2xl hover:shadow-red-500/5 transition-all group">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                                <Wrench size={32} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-[0.2em] mb-1">Maior Custo Acumulado</p>
                                <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter">{costliest.model}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                    <p className="text-sm font-black text-red-400 tracking-tight">{formatCurrency(costliest.maintenanceCost)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-card/40 backdrop-blur-sm border border-border/50 rounded-[40px] overflow-hidden shadow-sm">
                <div className="p-8 border-b border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/20">
                    <div>
                        <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter">Custo Operacional</h3>
                        <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest mt-1">Análise de eficiência financeira por quilômetro</p>
                    </div>
                    <ExportActions
                        data={vehicles || []}
                        filename="relatorio_veiculos"
                        title="Relatório de Utilização e Custos de Veículos"
                        columns={[
                            { header: 'Placa', dataKey: 'plate' },
                            { header: 'Modelo', dataKey: 'model' },
                            { header: 'KM Total', dataKey: 'totalKm' },
                            { header: 'Custo Manutenção', dataKey: 'maintenanceCost' },
                            { header: 'Custo por KM', dataKey: 'costPerKm' }
                        ]}
                    />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-muted/50 border-b border-border/50">
                                <th className="px-8 py-5 text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Frota / Modelo</th>
                                <th className="px-8 py-5 text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Sinalização</th>
                                <th className="px-8 py-5 text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">KM Total</th>
                                <th className="px-8 py-5 text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Mnt. Acumulada</th>
                                <th className="px-8 py-5 text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] text-right">Eficiência</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {vehicles?.map((vehicle: any) => (
                                <tr key={vehicle.plate} className="hover:bg-primary/[0.02] transition-colors group">
                                    <td className="px-8 py-6 font-black text-foreground uppercase text-xs tracking-tight group-hover:text-primary transition-colors">{vehicle.model}</td>
                                    <td className="px-8 py-6">
                                        <span className="px-3 py-1.5 bg-muted/50 border border-border/50 rounded-lg text-[10px] font-mono font-black text-muted-foreground tracking-widest uppercase">
                                            {vehicle.plate}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-sm font-black text-foreground/60 tracking-tighter group-hover:text-foreground transition-colors">{formatKm(vehicle.totalKm)}</td>
                                    <td className="px-8 py-6 text-sm font-black text-foreground/60 tracking-tighter">{formatCurrency(vehicle.maintenanceCost)}</td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="inline-flex flex-col items-end">
                                            <span className="text-sm font-black text-amber-500 tracking-tighter">
                                                {formatCurrency(vehicle.costPerKm)}<span className="text-[10px] opacity-60 ml-1">/KM</span>
                                            </span>
                                            <div className="w-20 h-1 bg-muted rounded-full mt-1 overflow-hidden">
                                                <div
                                                    className="h-full bg-amber-500"
                                                    style={{ width: `${Math.min(100, (vehicle.costPerKm / 5) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
