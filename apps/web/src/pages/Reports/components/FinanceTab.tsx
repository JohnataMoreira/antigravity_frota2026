import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/axios';
import { GlassCard } from '../../../components/ui/Cards';
import { DollarSign, TrendingUp, CreditCard, Wrench, Fuel } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatCurrency } from '../../../lib/utils';
import { ExportActions } from './ExportActions';

export function FinanceTab() {
    const { data: financeData, isLoading } = useQuery({
        queryKey: ['finance-overview'],
        queryFn: async () => {
            const response = await api.get('/finance/overview');
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
                    <GlassCard key={i}>
                        <div className="flex items-center gap-4 mb-2">
                            <div className={`p-2 rounded ${card.bg} ${card.color}`}>
                                <card.icon className="w-5 h-5" />
                            </div>
                            <span className="text-sm text-muted-foreground">{card.label}</span>
                        </div>
                        <p className="text-2xl font-bold">{formatCurrency(card.value)}</p>
                    </GlassCard>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <GlassCard>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        Fluxo de Despesas (Mensal)
                    </h3>
                    <div className="h-[300px] mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={financeData?.trends || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="month" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                                    formatter={(value: any) => [formatCurrency(value), 'Gasto']}
                                />
                                <Bar dataKey="fuel" name="Combustível" stackId="a" fill="#2563EB" />
                                <Bar dataKey="maintenance" name="Manutenção" stackId="a" fill="#F59E0B" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>

                <GlassCard>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-green-500" />
                            Últimas Transações
                        </h3>
                        <ExportActions
                            data={financeData?.recentExpenses || []}
                            filename="relatorio_financeiro"
                            title="Relatário de Despesas Recentes"
                            columns={[
                                { header: 'Data', dataKey: 'date' },
                                { header: 'Tipo', dataKey: 'type' },
                                { header: 'Valor', dataKey: 'value' },
                                { header: 'Detalhes', dataKey: 'details' }
                            ]}
                        />
                    </div>
                    <div className="space-y-4">
                        {financeData?.recentExpenses?.map((exp: any, i: number) => (
                            <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className={`p-1.5 rounded-full ${exp.type === 'Combustível' ? 'bg-blue-500/20 text-blue-500' : 'bg-amber-500/20 text-amber-500'}`}>
                                        {exp.type === 'Combustível' ? <Fuel className="w-3 h-3" /> : <Wrench className="w-3 h-3" />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">{exp.type}</p>
                                        <p className="text-[10px] text-muted-foreground">{new Date(exp.date).toLocaleDateString('pt-BR')}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-primary">{formatCurrency(exp.value)}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase">{exp.details}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
