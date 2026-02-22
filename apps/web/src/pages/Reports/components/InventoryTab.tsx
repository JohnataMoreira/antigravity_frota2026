import { useQuery } from '@tanstack/react-query';
import { reportsService } from '../../../services/reportsService';
import { GlassCard } from '../../../components/ui/Cards';
import { formatCurrency } from '../../../lib/utils';
import {
    Package,
    TrendingUp,
    AlertTriangle,
    ArrowUpRight,
    ShoppingCart,
    Activity
} from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';

export function InventoryTab() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['reports-inventory'],
        queryFn: reportsService.getInventoryStats
    });

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-32 bg-gray-200/20 rounded-2xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <GlassCard className="flex items-center gap-4 border-emerald-500/20 bg-emerald-50/50">
                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
                        <ShoppingCart size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Valor Imobilizado</p>
                        <p className="text-2xl font-black text-emerald-600">{formatCurrency(stats?.immobilizedValue || 0)}</p>
                    </div>
                </GlassCard>

                <GlassCard className="flex items-center gap-4 border-blue-500/20 bg-blue-50/50">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Giro de Estoque</p>
                        <p className="text-2xl font-black text-blue-600">{stats?.turnover}x</p>
                        <p className="text-[10px] font-bold text-blue-400 uppercase">Últimos 30 dias</p>
                    </div>
                </GlassCard>

                <GlassCard className="flex items-center gap-4 border-amber-500/20 bg-amber-50/50">
                    <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Reposição Crítica</p>
                        <p className="text-2xl font-black text-amber-600">{stats?.lowStockCount} itens</p>
                    </div>
                </GlassCard>

                <GlassCard className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl">
                        <Package size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total SKUs</p>
                        <p className="text-2xl font-black text-purple-600">{stats?.totalItems}</p>
                    </div>
                </GlassCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Low Stock Items List */}
                <GlassCard>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                            <AlertTriangle className="text-amber-500" size={18} />
                            Atenção de Reposição
                        </h3>
                        <Badge variant="danger">{stats?.lowStockItems.length} Alertas</Badge>
                    </div>
                    <div className="space-y-3">
                        {stats?.lowStockItems.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic text-center py-4">Nenhum item abaixo do mínimo.</p>
                        ) : (
                            stats?.lowStockItems.map((item: any) => (
                                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <span className="font-bold text-sm">{item.name}</span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-black uppercase text-gray-400">Saldo: {item.current}</span>
                                        <Badge variant="default" size="sm">Min: {item.min}</Badge>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </GlassCard>

                {/* Top Moving Items */}
                <GlassCard>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                            <Activity className="text-blue-500" size={18} />
                            Maior Giro de Saídas
                        </h3>
                    </div>
                    <div className="space-y-3">
                        {stats?.topMovingItems.map((item: any) => (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                        <ArrowUpRight size={14} />
                                    </div>
                                    <span className="font-bold text-sm">{item.name}</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-blue-600">{item.movements}</p>
                                    <p className="text-[10px] font-black uppercase text-muted-foreground">Consumos</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
