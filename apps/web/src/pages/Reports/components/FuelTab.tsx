import { useQuery } from '@tanstack/react-query';
import { fuelService } from '../../../services/fuelService';
import { GlassCard } from '../../../components/ui/Cards';
import { Fuel, TrendingUp, DollarSign, Gauge, Users, Truck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency, formatKm } from '../../../lib/utils';
import { ExportActions } from './ExportActions';

export function FuelTab({ filters }: { filters: any }) {
    const { data: stats, isLoading: loadingStats } = useQuery({
        queryKey: ['fuel-stats', filters],
        queryFn: () => fuelService.getStats(filters)
    });

    const { data: entries, isLoading: loadingEntries } = useQuery({
        queryKey: ['fuel-entries', filters],
        queryFn: () => fuelService.getAllEntries(filters)
    });

    if (loadingStats || loadingEntries) return <div className="text-center py-10">Carregando dados...</div>;

    const fuelTypeMap: Record<string, string> = {
        'GASOLINE': 'Gasolina',
        'ETHANOL': 'Etanol',
        'DIESEL': 'Diesel',
        'GNV': 'GNV',
        'OTHER': 'Outro'
    };

    const paymentMethodMap: Record<string, string> = {
        'CASH': 'Dinheiro',
        'PIX': 'Pix',
        'DEBIT_CARD': 'Cartão Débito',
        'CREDIT_CARD': 'Cartão Crédito',
        'FUEL_CARD': 'Cartão Combustível',
        'INVOICED': 'Faturado',
        'REIMBURSEMENT': 'Reembolso',
        'PREPAID_CARD': 'Cartão Pré-pago',
        'VOUCHER': 'Vale',
        'INTERNAL_TANK': 'Tanque Próprio'
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-card/40 backdrop-blur-sm border border-border/50 p-6 rounded-[32px] shadow-sm hover:shadow-2xl hover:shadow-emerald-500/5 transition-all group">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover:rotate-12 transition-transform">
                            <Gauge size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-widest">Média Geral</p>
                            <h4 className="text-xl font-black text-foreground uppercase tracking-tight">Consumo</h4>
                        </div>
                    </div>
                    <p className="text-3xl font-black text-emerald-500 tracking-tighter">
                        {stats?.avgKmL !== undefined && stats?.avgKmL !== null ? `${Number(stats.avgKmL).toFixed(1)}` : '0'}
                        <span className="text-xs ml-1 opacity-60">KM/L</span>
                    </p>
                </div>

                <div className="bg-card/40 backdrop-blur-sm border border-border/50 p-6 rounded-[32px] shadow-sm hover:shadow-2xl hover:shadow-amber-500/5 transition-all group">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 group-hover:rotate-12 transition-transform">
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-widest">Custo Operacional</p>
                            <h4 className="text-xl font-black text-foreground uppercase tracking-tight">KM Médio</h4>
                        </div>
                    </div>
                    <p className="text-3xl font-black text-amber-500 tracking-tighter">
                        {formatCurrency(stats?.avgCostKm || 0)}
                        <span className="text-xs ml-1 opacity-60">/KM</span>
                    </p>
                </div>

                <div className="bg-card/40 backdrop-blur-sm border border-border/50 p-6 rounded-[32px] shadow-sm hover:shadow-2xl hover:shadow-blue-500/5 transition-all group">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 group-hover:rotate-12 transition-transform">
                            <Fuel size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-widest">Volume Total</p>
                            <h4 className="text-xl font-black text-foreground uppercase tracking-tight">Litros</h4>
                        </div>
                    </div>
                    <p className="text-3xl font-black text-blue-500 tracking-tighter">
                        {(stats?.totalLiters || 0).toFixed(1)}
                        <span className="text-xs ml-1 opacity-60">L</span>
                    </p>
                </div>

                <div className="bg-card/40 backdrop-blur-sm border border-border/50 p-6 rounded-[32px] shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all group">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:rotate-12 transition-transform">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-widest">Capital Alocado</p>
                            <h4 className="text-xl font-black text-foreground uppercase tracking-tight">Investimento</h4>
                        </div>
                    </div>
                    <p className="text-3xl font-black text-primary tracking-tighter">
                        {formatCurrency(stats?.totalSpent || 0)}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-card/40 backdrop-blur-sm border border-border/50 p-8 rounded-[40px] shadow-sm">
                    <h3 className="text-xl font-black text-foreground uppercase tracking-tighter mb-8 flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        Evolução Mensal de Gastos
                    </h3>
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats?.trends || []}>
                                <XAxis dataKey="name" stroke="currentColor" fontSize={10} axisLine={false} tickLine={false} tick={{ fontWeight: 900, opacity: 0.4 }} />
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
                                <Bar dataKey="spent" fill="rgba(var(--primary), 0.8)" radius={[12, 12, 0, 0]} barSize={40} className="hover:opacity-80 transition-opacity" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-card/40 backdrop-blur-sm border border-border/50 p-8 rounded-[40px] shadow-sm">
                    <h3 className="text-xl font-black text-foreground uppercase tracking-tighter mb-8 flex items-center gap-3">
                        <Truck className="w-5 h-5 text-amber-500" />
                        Frota de Alto Consumo
                    </h3>
                    <div className="space-y-4">
                        {stats?.byVehicle?.map((v: any, i: number) => (
                            <div key={i} className="flex justify-between items-center p-5 bg-muted/30 border border-border/50 rounded-2xl group hover:bg-muted/50 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                                        <Truck size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-widest">{v.model}</p>
                                        <p className="font-black text-foreground tracking-widest uppercase text-sm">{v.plate}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-primary tracking-tighter">{formatCurrency(v.spent)}</p>
                                    <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">{v.count} Abastecimentos</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-card/40 backdrop-blur-sm border border-border/50 rounded-[40px] overflow-hidden shadow-sm">
                <div className="p-8 border-b border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/20">
                    <div>
                        <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter">Histórico de Abastecimentos</h3>
                        <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest mt-1">Auditagem detalhada de registros de combustível</p>
                    </div>
                    <ExportActions
                        data={entries || []}
                        filename="relatorio_combustivel"
                        title="Histórico de Abastecimentos"
                        columns={[
                            { header: 'Data', dataKey: 'date' },
                            { header: 'Placa', dataKey: 'vehiclePlate' },
                            { header: 'Litros', dataKey: 'liters' },
                            { header: 'Valor Total', dataKey: 'totalValue' },
                            { header: 'Tipo', dataKey: 'fuelType' },
                            { header: 'Pagamento', dataKey: 'paymentMethod' }
                        ]}
                    />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-muted/50 border-b border-border/50">
                                <th className="px-8 py-5 text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Data / Periodo</th>
                                <th className="px-8 py-5 text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Veículo / Frota</th>
                                <th className="px-8 py-5 text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Vol. / Rodagem</th>
                                <th className="px-8 py-5 text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Financeiro</th>
                                <th className="px-8 py-5 text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Sinalização</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {entries?.slice(0, 10).map((entry: any) => (
                                <tr key={entry.id} className="hover:bg-primary/[0.02] transition-colors group">
                                    <td className="px-8 py-6">
                                        <p className="text-[10px] font-black text-foreground/60 uppercase tracking-widest group-hover:text-primary transition-colors">
                                            {new Date(entry.date).toLocaleDateString()}
                                        </p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-xs font-black text-foreground uppercase tracking-widest">{entry.vehicle?.plate}</p>
                                        <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest mt-0.5">{entry.vehicle?.model}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-sm font-black text-blue-400 tracking-tighter">{entry.liters}<span className="text-[9px] ml-0.5">L</span></p>
                                        <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest mt-0.5">{formatKm(entry.km)}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-sm font-black text-primary tracking-tighter">{formatCurrency(entry.totalValue)}</p>
                                        <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest mt-0.5">
                                            {paymentMethodMap[entry.paymentMethod] || entry.paymentMethod}
                                        </p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="px-3 py-1.5 bg-muted/50 border border-border/50 rounded-lg text-[9px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
                                            {fuelTypeMap[entry.fuelType] || entry.fuelType}
                                        </span>
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
