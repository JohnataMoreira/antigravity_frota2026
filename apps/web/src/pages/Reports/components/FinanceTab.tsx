import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/axios';
import { GlassCard } from '../../../components/ui/Cards';
import { DollarSign, TrendingUp, CreditCard, Wrench, Fuel } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatCurrency } from '../../../lib/utils';
import { ExportActions } from './ExportActions';

export function FinanceTab({ filters }: { filters: any }) {
    const { data: financeData, isLoading } = useQuery({
        queryKey: ['finance-overview', filters],
        queryFn: async () => {
            const response = await api.get('/finance/overview', { params: filters });
            return response.data;
        }
    });

    if (isLoading) return <div className="text-center py-10">Carregando dados financeiros...</div>;

    const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444'];

    const summaryCards = [
        { label: 'Gasto Total', value: financeData?.summary?.grandTotal, icon: DollarSign, color: 'text-primary', bg: 'bg-primary/20' },
        { label: 'Combustível', value: financeData?.summary?.totalFuel, icon: Fuel, color: 'text-blue-500', bg: 'bg-blue-500/20' },
        { label: 'Manutenção', value: financeData?.summary?.totalMaintenance, icon: Wrench, color: 'text-amber-500', bg: 'bg-amber-500/20' },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {summaryCards.map((card, i) => (
                    <div key={i} className="bg-card/40 backdrop-blur-sm border border-border/50 p-6 rounded-[32px] shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all group">
                        <div className="flex items-center gap-4 mb-4">
                            <div className={`w-12 h-12 rounded-2xl ${card.bg} border border-${card.color.split('-')[1]}-500/20 flex items-center justify-center ${card.color} group-hover:scale-110 transition-transform`}>
                                <card.icon size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-widest">{card.label}</p>
                                <h4 className="text-xl font-black text-foreground uppercase tracking-tight">Saldos & Custos</h4>
                            </div>
                        </div>
                        <p className={`text-3xl font-black ${card.color} tracking-tighter`}>
                            {formatCurrency(card.value || 0)}
                        </p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-card/40 backdrop-blur-sm border border-border/50 p-8 rounded-[40px] shadow-sm">
                    <h3 className="text-xl font-black text-foreground uppercase tracking-tighter mb-8 flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        Fluxo de Despesas Op.
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={financeData?.trends || []}>
                                <XAxis dataKey="month" stroke="currentColor" fontSize={10} axisLine={false} tickLine={false} tick={{ fontWeight: 900, opacity: 0.4 }} />
                                <YAxis hide />
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
                                    formatter={(value: any) => [formatCurrency(value), 'Gasto']}
                                />
                                <Bar dataKey="fuel" name="Combustível" stackId="a" fill="rgba(var(--primary), 0.8)" radius={[12, 12, 0, 0]} barSize={40} />
                                <Bar dataKey="maintenance" name="Manutenção" stackId="a" fill="rgba(var(--amber-500), 0.8)" radius={[0, 0, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-card/40 backdrop-blur-sm border border-border/50 p-8 rounded-[40px] shadow-sm flex flex-col h-full">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-foreground uppercase tracking-tighter flex items-center gap-3">
                            <CreditCard className="w-5 h-5 text-emerald-500" />
                            Transações Recentes
                        </h3>
                        <ExportActions
                            data={financeData?.recentExpenses || []}
                            filename="relatorio_financeiro"
                            title="Relatório de Despesas Recentes"
                            columns={[
                                { header: 'Data', dataKey: 'date' },
                                { header: 'Tipo', dataKey: 'type' },
                                { header: 'Valor', dataKey: 'value' },
                                { header: 'Detalhes', dataKey: 'details' }
                            ]}
                        />
                    </div>
                    <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                        {financeData?.recentExpenses?.map((exp: any, i: number) => (
                            <div key={i} className="flex justify-between items-center p-5 bg-muted/30 border border-border/50 rounded-2xl group hover:bg-muted/50 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl ${exp.type === 'Combustível' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'} border border-current/20 flex items-center justify-center transition-colors shadow-lg shadow-current/5`}>
                                        {exp.type === 'Combustível' ? <Fuel size={20} /> : <Wrench size={20} />}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-widest">{new Date(exp.date).toLocaleDateString('pt-BR')}</p>
                                        <p className="font-black text-foreground tracking-widest uppercase text-sm">{exp.type}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-primary tracking-tighter text-base">{formatCurrency(exp.value)}</p>
                                    <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">{exp.details}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
