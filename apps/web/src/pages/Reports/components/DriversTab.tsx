import { useQuery } from '@tanstack/react-query';
import { reportsService } from '../../../services/reportsService';
import { GlassCard } from '../../../components/ui/Cards';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { User, Medal, AlertTriangle, Route, Shield, Zap, CheckSquare, AlertOctagon } from 'lucide-react';
import { formatKm } from '../../../lib/utils';
import { ExportActions } from './ExportActions';

export function DriversTab({ filters }: { filters: any }) {
    const { data: drivers, isLoading } = useQuery({
        queryKey: ['reports-driver-ranking', filters],
        queryFn: () => reportsService.getDriverRanking(filters)
    });

    if (isLoading) return <div className="text-center py-10">Carregando dados de performance...</div>;

    const topDriver = drivers?.[0];

    return (
        <div className="space-y-6">
            {/* Top Performer Highlight */}
            {topDriver && (
                <div className="relative group overflow-hidden bg-gradient-to-br from-amber-500/20 via-card to-card border border-amber-500/30 p-8 rounded-[40px] shadow-2xl shadow-amber-500/10">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[100px] rounded-full -mr-32 -mt-32 group-hover:bg-amber-500/10 transition-colors" />

                    <div className="relative flex flex-col md:flex-row items-center gap-8">
                        <div className="w-24 h-24 bg-amber-500/20 rounded-[32px] border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-xl shadow-amber-500/20 group-hover:scale-110 transition-transform duration-500">
                            <Medal size={48} />
                        </div>

                        <div className="flex-1 text-center md:text-left">
                            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                                <Shield className="w-4 h-4 text-amber-500" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500/60">Motorista Destaque</span>
                            </div>
                            <h2 className="text-4xl font-black text-foreground uppercase tracking-tighter mb-4">{topDriver.name}</h2>

                            <div className="flex flex-wrap justify-center md:justify-start gap-3">
                                <div className="px-4 py-2 bg-muted/40 border border-border/50 rounded-2xl flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-blue-500" />
                                    <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">Segurança</span>
                                    <span className="text-xs font-black text-foreground">{topDriver.safetyScore}</span>
                                </div>
                                <div className="px-4 py-2 bg-muted/40 border border-border/50 rounded-2xl flex items-center gap-2">
                                    <Route className="w-4 h-4 text-emerald-500" />
                                    <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">Eficiência</span>
                                    <span className="text-xs font-black text-foreground">{topDriver.efficiencyScore}</span>
                                </div>
                                <div className="px-4 py-2 bg-muted/40 border border-border/50 rounded-2xl flex items-center gap-2">
                                    <CheckSquare className="w-4 h-4 text-purple-500" />
                                    <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">Conformidade</span>
                                    <span className="text-xs font-black text-foreground">{topDriver.complianceScore}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-amber-500/10 border border-amber-500/20 px-8 py-6 rounded-[32px] text-center min-w-[160px]">
                            <p className="text-5xl font-black text-amber-500 tracking-tighter">{topDriver.overallScore}</p>
                            <p className="text-[10px] font-black text-amber-500/60 uppercase tracking-[0.2em] mt-1">Score Geral</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card/40 backdrop-blur-sm border border-border/50 p-8 rounded-[40px] shadow-sm">
                    <h3 className="text-xl font-black text-foreground uppercase tracking-tighter mb-8 flex items-center gap-3">
                        <BarChart className="w-5 h-5 text-primary" />
                        Top 10 - Eficiência Ranking
                    </h3>
                    <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={drivers?.slice(0, 10)} layout="vertical" margin={{ left: -20, right: 20 }}>
                                <XAxis type="number" domain={[0, 100]} hide />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fontWeight: 900, fill: 'currentColor' }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(var(--primary), 0.05)' }}
                                    contentStyle={{
                                        backgroundColor: 'rgba(var(--card), 0.95)',
                                        border: '1px solid rgba(var(--border), 0.5)',
                                        borderRadius: '24px',
                                        backdropFilter: 'blur(10px)',
                                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.3)',
                                        fontSize: '12px',
                                        fontWeight: '900'
                                    }}
                                />
                                <Bar dataKey="overallScore" radius={[0, 12, 12, 0]} barSize={24}>
                                    {drivers?.slice(0, 10).map((entry: any, index: number) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={index === 0 ? 'rgb(245, 158, 11)' : 'rgba(var(--primary), 0.8)'}
                                            className="hover:opacity-80 transition-opacity"
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-card/40 backdrop-blur-sm border border-border/50 rounded-[40px] overflow-hidden shadow-sm">
                    <div className="p-8 border-b border-border/50 flex items-center justify-between bg-muted/20">
                        <div>
                            <h3 className="text-xl font-black text-foreground uppercase tracking-tighter">Ranking Detalhado</h3>
                            <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest mt-1">Análise multicritério por piloto</p>
                        </div>
                        <ExportActions
                            data={drivers || []}
                            filename="ranking_motoristas"
                            title="Ranking de Eficiência de Motoristas"
                            columns={[
                                { header: 'Motorista', dataKey: 'name' },
                                { header: 'Score Geral', dataKey: 'overallScore' },
                                { header: 'Score Segurança', dataKey: 'safetyScore' },
                                { header: 'Score Eficiência', dataKey: 'efficiencyScore' },
                                { header: 'Score Conformidade', dataKey: 'complianceScore' },
                                { header: 'KM Total', dataKey: 'totalKm' },
                                { header: 'KM/L', dataKey: 'kmPerLiter' },
                                { header: 'Incidentes', dataKey: 'incidentCount' },
                                { header: 'Incidentes (Culpa)', dataKey: 'atFaultCount' }
                            ]}
                        />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-muted/50 border-b border-border/50">
                                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Piloto</th>
                                    <th className="px-4 py-4 text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] text-center">Global</th>
                                    <th className="px-4 py-4 text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] text-center">Safety</th>
                                    <th className="px-4 py-4 text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] text-center">Eficiência</th>
                                    <th className="px-4 py-4 text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] text-center">Compl.</th>
                                    <th className="px-4 py-4 text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] text-center">Alertas</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                {drivers?.map((driver: any) => (
                                    <tr key={driver.driverId} className="hover:bg-primary/[0.02] transition-colors group">
                                        <td className="px-6 py-4 font-black text-foreground uppercase text-xs tracking-tight group-hover:text-primary transition-colors flex items-center gap-3">
                                            {driver.photoUrl ? (
                                                <img src={driver.photoUrl} alt={driver.name} className="w-8 h-8 rounded-xl object-cover border border-border/50" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center text-muted-foreground">
                                                    <User size={16} />
                                                </div>
                                            )}
                                            {driver.name}
                                        </td>
                                        <td className="px-4 py-4 text-center font-black text-foreground text-sm tracking-tighter">{driver.overallScore}</td>
                                        <td className="px-4 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${driver.safetyScore >= 90 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                                driver.safetyScore >= 70 ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                                                }`}>
                                                {driver.safetyScore}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${driver.efficiencyScore >= 90 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                                driver.efficiencyScore >= 70 ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                                                }`}>
                                                {driver.efficiencyScore}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${driver.complianceScore >= 90 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                                driver.complianceScore >= 70 ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                                                }`}>
                                                {driver.complianceScore}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            {driver.atFaultCount > 0 ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-red-500/10 text-red-500 border border-red-500/20">
                                                    <AlertOctagon className="w-3 h-3" />
                                                    {driver.atFaultCount}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground font-black text-xs opacity-20">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
