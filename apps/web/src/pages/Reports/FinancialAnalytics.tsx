import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { Card, StatCard, Badge } from '@/components/ui';
import { TrendingUp, TrendingDown, DollarSign, Fuel, Wrench, BarChart3, ArrowUpRight, ArrowDownRight, Award } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function FinancialAnalytics() {
    const { data: analytics, isLoading: isAnalyticsLoading } = useQuery({
        queryKey: ['financial-analytics'],
        queryFn: () => api.get('/reports/analytics/profitability').then(res => res.data)
    });

    const { data: rankings, isLoading: isRankingsLoading } = useQuery({
        queryKey: ['vehicle-rankings'],
        queryFn: () => api.get('/reports/analytics/vehicle-rankings').then(res => res.data)
    });

    if (isAnalyticsLoading || isRankingsLoading) {
        return <div className="p-8 text-center font-black animate-pulse">Carregando Inteligência Financeira...</div>;
    }

    const { summary, breakdown, history } = analytics;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Analytics Financeiro</h1>
                    <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Rentabilidade e ROI da Frota</p>
                </div>
                <div className="flex gap-2">
                    <Badge variant="default" className="text-[10px] py-1 px-3">ÚLTIMOS 30 DIAS</Badge>
                    <Badge variant="success" className="text-[10px] py-1 px-3 bg-emerald-50 border-emerald-200 text-emerald-600 font-black">EM TEMPO REAL</Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="LUCRO LÍQUIDO"
                    value={`R$ ${summary.totalProfit.toLocaleString('pt-BR')}`}
                    icon={<Award className="text-emerald-600" size={24} />}
                    variant="success"
                    trend={{ value: parseFloat(summary.profitMargin), isPositive: true }}
                    gradient
                />
                <StatCard
                    label="RECEITA TOTAL"
                    value={`R$ ${summary.totalRevenue.toLocaleString('pt-BR')}`}
                    icon={<DollarSign className="text-blue-600" size={24} />}
                    variant="info"
                    gradient
                />
                <StatCard
                    label="CUSTO POR KM"
                    value={`R$ ${summary.costPerKm}`}
                    icon={<TrendingDown className="text-amber-600" size={24} />}
                    variant="warning"
                />
                <StatCard
                    label="KM PERCORRIDOS"
                    value={`${summary.totalKm.toLocaleString('pt-BR')} km`}
                    icon={<BarChart3 className="text-neutral-600" size={24} />}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 p-6" variant="glass">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="font-black text-xs uppercase tracking-widest text-gray-400">Desempenho de Receita</h3>
                            <p className="text-lg font-bold text-gray-900">Histórico de Faturamento</p>
                        </div>
                        <div className="flex items-center gap-2 text-emerald-600 font-black text-xs">
                            <ArrowUpRight size={16} />
                            +12% vs mês anterior
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={history}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} tickFormatter={(value) => `kR$ ${value / 1000}`} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="font-black text-xs uppercase tracking-widest text-gray-400 mb-6">Composição de Gastos</h3>
                    <div className="space-y-6">
                        <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Combustível</span>
                                <span className="text-sm font-bold text-blue-800">R$ {breakdown.fuel.toLocaleString('pt-BR')}</span>
                            </div>
                            <div className="w-full bg-blue-100 rounded-full h-2">
                                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(breakdown.fuel / summary.totalExpenses) * 100}%` }}></div>
                            </div>
                        </div>

                        <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Manutenção</span>
                                <span className="text-sm font-bold text-amber-800">R$ {breakdown.maintenance.toLocaleString('pt-BR')}</span>
                            </div>
                            <div className="w-full bg-amber-100 rounded-full h-2">
                                <div className="bg-amber-600 h-2 rounded-full" style={{ width: `${(breakdown.maintenance / summary.totalExpenses) * 100}%` }}></div>
                            </div>
                        </div>

                        <div className="flex flex-col items-center justify-center p-8 bg-neutral-50 rounded-2xl border-2 border-dashed border-neutral-200 opacity-50">
                            <TrendingUp className="text-neutral-300 mb-2" size={32} />
                            <p className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest">Projeção Inteligente em breve</p>
                        </div>
                    </div>
                </Card>
            </div>

            <Card className="p-0 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white/50">
                    <div>
                        <h3 className="font-black text-xs uppercase tracking-widest text-gray-400">Eficiência Operacional</h3>
                        <p className="text-lg font-bold text-gray-900">Ranking de Rentabilidade por Veículo</p>
                    </div>
                    <Badge variant="success">TOP PERFORMANCE</Badge>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-neutral-50 text-left border-b border-gray-100">
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Veículo</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Distância</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Viagens</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Faturamento</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Eficiência (R$/km)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {rankings.map((vehicle: any, idx: number) => (
                                <tr key={vehicle.id} className="hover:bg-neutral-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${idx === 0 ? 'bg-amber-100 text-amber-600' : 'bg-neutral-100 text-neutral-400'}`}>
                                                #{idx + 1}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 uppercase tracking-tight">{vehicle.plate}</p>
                                                <p className="text-xs text-gray-500 font-medium">{vehicle.model}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-gray-600 font-mono">{vehicle.km.toLocaleString('pt-BR')} km</td>
                                    <td className="px-6 py-4 text-sm font-bold text-gray-600">{vehicle.trips}</td>
                                    <td className="px-6 py-4 text-sm font-black text-emerald-600 text-right font-mono">R$ {vehicle.revenue.toLocaleString('pt-BR')}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <span className="text-sm font-black text-blue-600">R$ {vehicle.efficiency}</span>
                                            {idx === 0 && <Award className="text-amber-500 fill-amber-500" size={14} />}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
