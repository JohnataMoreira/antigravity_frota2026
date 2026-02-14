import { useQuery } from '@tanstack/react-query';
import { reportsService } from '../../../services/reportsService';
import { GlassCard } from '../../../components/ui/Cards';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { User, Medal, AlertTriangle, Route } from 'lucide-react';
import { formatKm } from '../../../lib/utils';

export function DriversTab() {
    const { data: drivers, isLoading } = useQuery({
        queryKey: ['reports-drivers'],
        queryFn: () => reportsService.getDriverPerformance()
    });

    if (isLoading) return <div className="text-center py-10">Carregando dados...</div>;

    const topDriver = drivers?.[0];

    return (
        <div className="space-y-6">
            {/* Top Performer Highlight */}
            {topDriver && (
                <GlassCard gradient={true} className="border-yellow-500/30">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-yellow-500/20 rounded-full text-yellow-400">
                            <Medal className="w-12 h-12" />
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-yellow-100">Motorista Destaque</h3>
                            <p className="text-3xl font-bold text-white">{topDriver.driverName}</p>
                            <p className="text-sm text-yellow-200/80">
                                {formatKm(topDriver.totalKm)} percorridos em {topDriver.totalJourneys} viagens
                            </p>
                        </div>
                    </div>
                </GlassCard>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GlassCard>
                    <h3 className="text-xl font-bold mb-6">KM por Motorista</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={drivers?.slice(0, 10)} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                <XAxis type="number" />
                                <YAxis dataKey="driverName" type="category" width={100} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px' }}
                                />
                                <Bar dataKey="totalKm" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>

                <GlassCard>
                    <h3 className="text-xl font-bold mb-6">Detalhamento</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/10 text-muted-foreground text-sm">
                                    <th className="pb-3">Motorista</th>
                                    <th className="pb-3">Viagens</th>
                                    <th className="pb-3">Média/Viagem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {drivers?.map((driver) => (
                                    <tr key={driver.driverName} className="hover:bg-white/5">
                                        <td className="py-3 font-medium flex items-center gap-2">
                                            <User className="w-4 h-4 text-muted-foreground" />
                                            {driver.driverName}
                                        </td>
                                        <td className="py-3">{driver.totalJourneys}</td>
                                        <td className="py-3 uppercase font-bold">{formatKm(driver.avgKmPerJourney)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
