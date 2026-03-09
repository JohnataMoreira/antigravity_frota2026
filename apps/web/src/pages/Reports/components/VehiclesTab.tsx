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
                    <GlassCard>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500/20 rounded-lg text-blue-500">
                                <Truck className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Veículo Mais Utilizado</p>
                                <h3 className="text-2xl font-bold">{mostUsed.model}</h3>
                                <p className="text-sm text-blue-400 uppercase font-bold">{formatKm(mostUsed.totalKm)} rodados</p>
                            </div>
                        </div>
                    </GlassCard>
                )}
                {costliest && (
                    <GlassCard>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-500/20 rounded-lg text-red-500">
                                <Wrench className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Maior Custo de Manutenção</p>
                                <h3 className="text-2xl font-bold">{costliest.model}</h3>
                                <p className="text-sm text-red-400 font-bold">{formatCurrency(costliest.maintenanceCost)}</p>
                            </div>
                        </div>
                    </GlassCard>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <GlassCard>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold">Análise de Custo Operacional (R$/KM)</h3>
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
                        <div className="h-[300px] mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={vehicles || []} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
                                    <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                                    <YAxis dataKey="plate" type="category" stroke="#94a3b8" fontSize={10} width={70} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                                        formatter={(value: any) => [formatCurrency(value), 'Custo/KM']}
                                    />
                                    <Bar dataKey="costPerKm" radius={[0, 4, 4, 0]}>
                                        {vehicles?.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.costPerKm > 1 ? '#EF4444' : '#2563EB'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </GlassCard>
                </div>

                <div className="md:col-span-1">
                    <GlassCard className="h-full">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            Alerta de Desgaste
                        </h3>
                        <p className="text-xs text-muted-foreground mb-4">
                            Veículos com custo operacional acima de R$ 1,00/KM exigem revisão imediata da estratégia de manutenção.
                        </p>
                        <div className="space-y-4">
                            {vehicles?.filter((v: any) => v.costPerKm > 1).map((v: any) => (
                                <div key={v.plate} className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                    <p className="font-bold text-red-400 text-sm">{v.plate} - {v.model}</p>
                                    <p className="text-xs text-red-300/60 mt-1">Custo crítico: {formatCurrency(v.costPerKm)}/KM</p>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </div>
            </div>
            <GlassCard>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/10 text-muted-foreground text-sm">
                                <th className="pb-3 px-2">Veículo</th>
                                <th className="pb-3 px-2">Placa</th>
                                <th className="pb-3 px-2">KM Total</th>
                                <th className="pb-3 px-2">Custo Manutenção</th>
                                <th className="pb-3 px-2">Custo/KM</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {vehicles?.map((vehicle) => (
                                <tr key={vehicle.plate} className="hover:bg-white/5">
                                    <td className="py-3 px-2 font-medium">{vehicle.model}</td>
                                    <td className="py-3 px-2">
                                        <span className="px-2 py-1 bg-white/10 rounded text-xs font-mono">
                                            {vehicle.plate}
                                        </span>
                                    </td>
                                    <td className="py-3 px-2 uppercase font-medium">{formatKm(vehicle.totalKm)}</td>
                                    <td className="py-3 px-2 font-medium">{formatCurrency(vehicle.maintenanceCost)}</td>
                                    <td className="py-3 px-2 font-bold text-amber-400">
                                        {formatCurrency(vehicle.costPerKm)}/KM
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </GlassCard>
        </div>
    );
}
