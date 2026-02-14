import { useQuery } from '@tanstack/react-query';
import { fuelService } from '../../../services/fuelService';
import { GlassCard } from '../../../components/ui/Cards';
import { Fuel, TrendingUp, DollarSign, Gauge, Users, Truck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency, formatKm } from '../../../lib/utils';
import { ExportActions } from './ExportActions';

export function FuelTab() {
    const { data: stats, isLoading: loadingStats } = useQuery({
        queryKey: ['fuel-stats'],
        queryFn: () => fuelService.getStats()
    });

    const { data: entries, isLoading: loadingEntries } = useQuery({
        queryKey: ['fuel-entries'],
        queryFn: () => fuelService.getAllEntries()
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
                <GlassCard>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-2 bg-green-500/20 rounded text-green-500">
                            <Gauge className="w-5 h-5" />
                        </div>
                        <span className="text-sm text-muted-foreground">Média Geral KM/L</span>
                    </div>
                    <p className="text-2xl font-bold">{stats?.avgKmL ? `${stats.avgKmL.toFixed(1)} KM/L` : '0 KM/L'}</p>
                </GlassCard>

                <GlassCard>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-2 bg-amber-500/20 rounded text-amber-500">
                            <DollarSign className="w-5 h-5" />
                        </div>
                        <span className="text-sm text-muted-foreground">Custo Médio/KM</span>
                    </div>
                    <p className="text-2xl font-bold">{formatCurrency(stats?.avgCostKm)}/KM</p>
                </GlassCard>

                <GlassCard>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-2 bg-blue-500/20 rounded text-blue-500">
                            <Fuel className="w-5 h-5" />
                        </div>
                        <span className="text-sm text-muted-foreground">Total Litros</span>
                    </div>
                    <p className="text-2xl font-bold">{stats?.totalLiters?.toFixed(1) || 0} L</p>
                </GlassCard>

                <GlassCard>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-2 bg-primary/20 rounded text-primary">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <span className="text-sm text-muted-foreground">Investimento Total</span>
                    </div>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(stats?.totalSpent)}</p>
                </GlassCard>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <GlassCard>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        Evolução Mensal de Gastos
                    </h3>
                    <div className="h-[250px] mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats?.trends || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                                <YAxis stroke="#94a3b8" fontSize={12} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                                    formatter={(value: any) => [formatCurrency(value), 'Gasto']}
                                />
                                <Bar dataKey="spent" fill="#2563EB" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>

                <GlassCard>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Truck className="w-5 h-5 text-amber-500" />
                        Veículos com Maior Gasto
                    </h3>
                    <div className="space-y-4">
                        {stats?.byVehicle?.map((v: any, i: number) => (
                            <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                                <div>
                                    <p className="font-bold text-sm">{v.plate}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase">{v.model}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-primary">{formatCurrency(v.spent)}</p>
                                    <p className="text-[10px] text-muted-foreground">{v.count} abastecimentos</p>
                                </div>
                            </div>
                        ))}
                        {(!stats?.byVehicle || stats.byVehicle.length === 0) && (
                            <p className="text-center text-sm text-muted-foreground py-10">Nenhum dado disponível</p>
                        )}
                    </div>
                </GlassCard>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <GlassCard className="h-full">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-400" />
                            Ranking de Motoristas
                        </h3>
                        <div className="space-y-4">
                            {stats?.byDriver?.map((d: any, i: number) => (
                                <div key={i} className="flex justify-between items-center p-2 rounded hover:bg-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold">
                                            {i + 1}º
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{d.name}</p>
                                            <p className="text-[10px] text-muted-foreground">{d.count} registros</p>
                                        </div>
                                    </div>
                                    <p className="font-bold text-xs">{formatCurrency(d.spent)}</p>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </div>

                <div className="md:col-span-2">
                    <GlassCard>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold">Histórico Recente</h3>
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
                                    <tr className="border-b border-white/10 text-muted-foreground text-xs uppercase tracking-wider">
                                        <th className="pb-3 px-2">Data</th>
                                        <th className="pb-3 px-2">Veículo</th>
                                        <th className="pb-3 px-2">KM</th>
                                        <th className="pb-3 px-2">Litros</th>
                                        <th className="pb-3 px-2">Valor</th>
                                        <th className="pb-3 px-2">Combustível</th>
                                        <th className="pb-3 px-2">Pagamento</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {entries?.slice(0, 8).map((entry: any) => (
                                        <tr key={entry.id} className="hover:bg-white/5 transition-colors">
                                            <td className="py-3 px-2 text-[10px]">{new Date(entry.date).toLocaleDateString()}</td>
                                            <td className="py-3 px-2">
                                                <p className="text-xs font-bold">{entry.vehicle?.plate}</p>
                                                <p className="text-[9px] text-muted-foreground">{entry.vehicle?.model}</p>
                                            </td>
                                            <td className="py-3 px-2 text-[10px] uppercase font-bold">{formatKm(entry.km)}</td>
                                            <td className="py-3 px-2 text-[10px] font-medium text-blue-200">{entry.liters}L</td>
                                            <td className="py-3 px-2 text-xs font-bold text-primary">{formatCurrency(entry.totalValue)}</td>
                                            <td className="py-3 px-2">
                                                <span className="px-1.5 py-0.5 bg-white/5 rounded text-[9px] uppercase border border-white/5">
                                                    {fuelTypeMap[entry.fuelType] || entry.fuelType}
                                                </span>
                                            </td>
                                            <td className="py-3 px-2">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-medium leading-tight">
                                                        {paymentMethodMap[entry.paymentMethod] || entry.paymentMethod}
                                                    </span>
                                                    {entry.paymentProvider && (
                                                        <span className="text-[8px] text-muted-foreground uppercase leading-none mt-0.5">
                                                            {entry.paymentProvider}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
