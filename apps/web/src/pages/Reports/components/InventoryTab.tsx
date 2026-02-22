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
                <div className="bg-card/40 backdrop-blur-sm border border-border/50 p-6 rounded-[32px] shadow-sm hover:shadow-2xl hover:shadow-emerald-500/5 transition-all group">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover:rotate-12 transition-transform">
                            <ShoppingCart size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-widest">Valor de Ativos</p>
                            <h4 className="text-xl font-black text-foreground uppercase tracking-tight">Imobilizado</h4>
                        </div>
                    </div>
                    <p className="text-3xl font-black text-emerald-500 tracking-tighter">
                        {formatCurrency(stats?.immobilizedValue || 0)}
                    </p>
                </div>

                <div className="bg-card/40 backdrop-blur-sm border border-border/50 p-6 rounded-[32px] shadow-sm hover:shadow-2xl hover:shadow-blue-500/5 transition-all group">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 group-hover:rotate-12 transition-transform">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-widest">Giro de Atuários</p>
                            <h4 className="text-xl font-black text-foreground uppercase tracking-tight">Stock Flux</h4>
                        </div>
                    </div>
                    <p className="text-3xl font-black text-blue-500 tracking-tighter">
                        {stats?.turnover}
                        <span className="text-xs ml-1 opacity-60">X</span>
                    </p>
                    <p className="text-[10px] font-black text-blue-500/40 uppercase tracking-widest mt-1">Últimos 30 Dias</p>
                </div>

                <div className="bg-card/40 backdrop-blur-sm border border-border/50 p-6 rounded-[32px] shadow-sm hover:shadow-2xl hover:shadow-amber-500/5 transition-all group">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 group-hover:rotate-12 transition-transform">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-widest">Alerta Crítico</p>
                            <h4 className="text-xl font-black text-foreground uppercase tracking-tight">Reposição</h4>
                        </div>
                    </div>
                    <p className="text-3xl font-black text-amber-500 tracking-tighter">
                        {stats?.lowStockCount}
                        <span className="text-xs ml-1 opacity-60">ITENS</span>
                    </p>
                </div>

                <div className="bg-card/40 backdrop-blur-sm border border-border/50 p-6 rounded-[32px] shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all group">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:rotate-12 transition-transform">
                            <Package size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-widest">Catálogo Geral</p>
                            <h4 className="text-xl font-black text-foreground uppercase tracking-tight">Total SKUs</h4>
                        </div>
                    </div>
                    <p className="text-3xl font-black text-primary tracking-tighter">
                        {stats?.totalItems}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Low Stock Items List */}
                <div className="bg-card/40 backdrop-blur-sm border border-border/50 p-8 rounded-[40px] shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-foreground uppercase tracking-tighter flex items-center gap-3">
                            <AlertTriangle className="text-amber-500" size={20} />
                            Logística de Reposição
                        </h3>
                        <span className="px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-lg text-[10px] font-black text-red-500 uppercase tracking-widest">
                            {stats?.lowStockItems.length} Alertas
                        </span>
                    </div>
                    <div className="space-y-4">
                        {stats?.lowStockItems.length === 0 ? (
                            <div className="p-10 border-2 border-dashed border-border/50 rounded-3xl flex flex-col items-center justify-center text-center">
                                <Package className="w-12 h-12 text-muted-foreground/20 mb-4" />
                                <p className="text-sm font-black text-muted-foreground/40 uppercase tracking-widest">Nenhum item abaixo do mínimo operacional</p>
                            </div>
                        ) : (
                            stats?.lowStockItems.map((item: any) => (
                                <div key={item.id} className="flex items-center justify-between p-5 bg-muted/30 border border-border/50 rounded-2xl group hover:bg-muted/50 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                                            <AlertTriangle size={20} />
                                        </div>
                                        <span className="font-black text-foreground tracking-widest uppercase text-sm">{item.name}</span>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-widest">Saldo</p>
                                            <p className="text-sm font-black text-red-500 tracking-tighter">{item.current}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-widest">Mínimo</p>
                                            <p className="text-sm font-black text-foreground/60 tracking-tighter">{item.min}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Top Moving Items */}
                <div className="bg-card/40 backdrop-blur-sm border border-border/50 p-8 rounded-[40px] shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-foreground uppercase tracking-tighter flex items-center gap-3">
                            <Activity className="text-blue-500" size={20} />
                            Fluxo de Consumo (Top 5)
                        </h3>
                    </div>
                    <div className="space-y-4">
                        {stats?.topMovingItems.map((item: any) => (
                            <div key={item.id} className="flex items-center justify-between p-5 bg-muted/30 border border-border/50 rounded-2xl group hover:bg-muted/50 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                                        <ArrowUpRight size={20} />
                                    </div>
                                    <span className="font-black text-foreground tracking-widest uppercase text-sm">{item.name}</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-widest">Requisição</p>
                                    <p className="text-base font-black text-blue-500 tracking-tighter">{item.movements}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
