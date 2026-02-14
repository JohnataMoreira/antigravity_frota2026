import { useQuery } from '@tanstack/react-query';
import { reportsService } from '../../../services/reportsService';
import { GlassCard } from '../../../components/ui/Cards';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Truck, Wrench, AlertTriangle, TrendingUp } from 'lucide-react';

export function VehiclesTab() {
    const { data: vehicles, isLoading } = useQuery({
        queryKey: ['reports-vehicles'],
        queryFn: () => reportsService.getVehicleUtilization()
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
                                <p className="text-sm text-blue-400">{mostUsed.totalKm} KM rodados</p>
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
                                <p className="text-sm text-red-400">R$ {costliest.maintenanceCost}</p>
                            </div>
                        </div>
                    </GlassCard>
                )}
            </div>

            <GlassCard>
                <h3 className="text-xl font-bold mb-6">Análise de Custo Operacional (R$/KM)</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/10 text-muted-foreground text-sm">
                                <th className="pb-3">Veículo</th>
                                <th className="pb-3">Placa</th>
                                <th className="pb-3">KM Total</th>
                                <th className="pb-3">Custo Manutenção</th>
                                <th className="pb-3">Custo/KM</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {vehicles?.map((vehicle) => (
                                <tr key={vehicle.plate} className="hover:bg-white/5">
                                    <td className="py-3 font-medium">{vehicle.model}</td>
                                    <td className="py-3">
                                        <span className="px-2 py-1 bg-white/10 rounded text-xs font-mono">
                                            {vehicle.plate}
                                        </span>
                                    </td>
                                    <td className="py-3">{vehicle.totalKm}</td>
                                    <td className="py-3">R$ {vehicle.maintenanceCost}</td>
                                    <td className="py-3 font-bold text-amber-400">
                                        R$ {vehicle.costPerKm}
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
