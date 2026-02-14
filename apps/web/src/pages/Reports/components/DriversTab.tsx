import { useQuery } from '@tanstack/react-query';
import { reportsService } from '../../../services/reportsService';
import { GlassCard } from '../../../components/ui/Cards';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { User, Medal, AlertTriangle, Route, Shield, Zap } from 'lucide-react';
import { formatKm } from '../../../lib/utils';
import { ExportActions } from './ExportActions';

export function DriversTab() {
    const { data: drivers, isLoading } = useQuery({
        queryKey: ['reports-driver-ranking'],
        queryFn: () => reportsService.getDriverRanking()
    });

    if (isLoading) return <div className="text-center py-10">Carregando dados de performance...</div>;

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
                        <div className="flex-1">
                            <h3 className="text-lg font-medium text-yellow-100">Motorista Destaque</h3>
                            <p className="text-3xl font-bold text-white">{topDriver.name}</p>
                            <div className="flex gap-4 mt-2">
                                <div className="flex items-center gap-1 text-sm text-yellow-200/80">
                                    <Shield className="w-4 h-4" />
                                    <span>Segurança: {topDriver.safetyScore}/100</span>
                                </div>
                                <div className="flex items-center gap-1 text-sm text-yellow-200/80">
                                    <Zap className="w-4 h-4" />
                                    <span>Eficiência: {topDriver.efficiencyScore}/100</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-4xl font-bold text-white">{topDriver.overallScore}</p>
                            <p className="text-xs text-yellow-200/60 uppercase tracking-widest">Score Geral</p>
                        </div>
                    </div>
                </GlassCard>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GlassCard>
                    <h3 className="text-xl font-bold mb-6">Top 10 - Score Geral</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={drivers?.slice(0, 10)} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                <XAxis type="number" domain={[0, 100]} />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                                />
                                <Bar dataKey="overallScore" radius={[0, 4, 4, 0]}>
                                    {drivers?.slice(0, 10).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#eab308' : '#3b82f6'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>

                <GlassCard>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold">Ranking Detalhado</h3>
                        <ExportActions
                            data={drivers || []}
                            filename="ranking_motoristas"
                            title="Ranking de Eficiência de Motoristas"
                            columns={[
                                { header: 'Motorista', dataKey: 'name' },
                                { header: 'Score Geral', dataKey: 'overallScore' },
                                { header: 'Score Segurança', dataKey: 'safetyScore' },
                                { header: 'Score Eficiência', dataKey: 'efficiencyScore' },
                                { header: 'KM Total', dataKey: 'totalKm' },
                                { header: 'KM/L', dataKey: 'kmPerLiter' },
                                { header: 'Incidentes', dataKey: 'incidentCount' }
                            ]}
                        />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/10 text-muted-foreground text-sm">
                                    <th className="pb-3">Motorista</th>
                                    <th className="pb-3 text-center">Score</th>
                                    <th className="pb-3 text-center">Segurança</th>
                                    <th className="pb-3 text-center">Eficiência</th>
                                    <th className="pb-3 text-right">KM/L</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {drivers?.map((driver) => (
                                    <tr key={driver.driverId} className="hover:bg-white/5 transition-colors">
                                        <td className="py-3 font-medium flex items-center gap-2">
                                            {driver.photoUrl ? (
                                                <img src={driver.photoUrl} alt={driver.name} className="w-6 h-6 rounded-full object-cover" />
                                            ) : (
                                                <User className="w-6 h-6 p-1 bg-white/10 rounded-full text-muted-foreground" />
                                            )}
                                            {driver.name}
                                        </td>
                                        <td className="py-3 text-center font-bold text-lg">{driver.overallScore}</td>
                                        <td className="py-3 text-center">
                                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${driver.safetyScore >= 90 ? 'bg-green-500/20 text-green-400' :
                                                    driver.safetyScore >= 70 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                                                }`}>
                                                {driver.safetyScore}
                                            </span>
                                        </td>
                                        <td className="py-3 text-center">
                                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${driver.efficiencyScore >= 90 ? 'bg-green-500/20 text-green-400' :
                                                    driver.efficiencyScore >= 70 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                                                }`}>
                                                {driver.efficiencyScore}
                                            </span>
                                        </td>
                                        <td className="py-3 text-right">{driver.kmPerLiter}</td>
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
