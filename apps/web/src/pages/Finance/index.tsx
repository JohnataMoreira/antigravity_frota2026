import React, { useState, useMemo } from 'react';
import {
    DollarSign,
    ArrowUpCircle,
    ArrowDownCircle,
    Calendar,
    Filter,
    Search,
    CheckCircle2,
    Clock,
    AlertCircle,
    FileText,
    MoreHorizontal,
    Download,
    CreditCard,
    Plus
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { GlassCard } from '../../components/ui/Cards';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import clsx from 'clsx';

export default function FinancePage() {
    const [filter, setFilter] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const queryClient = useQueryClient();

    const { data: overview, isLoading: loadingOverview } = useQuery({
        queryKey: ['finance-overview'],
        queryFn: async () => {
            const res = await api.get('/finance/overview');
            return res.data;
        }
    });

    const { data: transactions, isLoading: loadingTransactions } = useQuery({
        queryKey: ['finance-transactions', filter],
        queryFn: async () => {
            const res = await api.get('/finance/transactions', {
                params: { status: filter === 'ALL' ? undefined : filter }
            });
            return res.data;
        }
    });

    const filteredTransactions = useMemo(() => {
        if (!transactions) return [];
        return transactions.filter((t: any) => {
            const matchSearch = !searchTerm ||
                t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchCategory = categoryFilter === 'ALL' || t.category === categoryFilter;
            const txDate = new Date(t.dueDate);
            const matchFrom = !dateFrom || txDate >= new Date(dateFrom);
            const matchTo = !dateTo || txDate <= new Date(dateTo + 'T23:59:59');
            return matchSearch && matchCategory && matchFrom && matchTo;
        });
    }, [transactions, searchTerm, categoryFilter, dateFrom, dateTo]);

    const confirmPaymentMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string, data: any }) => {
            return api.patch(`/finance/transactions/${id}/confirm`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['finance-transactions'] });
            queryClient.invalidateQueries({ queryKey: ['finance-overview'] });
        }
    });

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'PAID': return { color: 'text-green-500', bg: 'bg-green-500/10', icon: CheckCircle2, label: 'Pago' };
            case 'PENDING': return { color: 'text-yellow-500', bg: 'bg-yellow-500/10', icon: Clock, label: 'Pendente' };
            case 'OVERDUE': return { color: 'text-red-500', bg: 'bg-red-500/10', icon: AlertCircle, label: 'Atrasado' };
            default: return { color: 'text-gray-500', bg: 'bg-gray-500/10', icon: Clock, label: status };
        }
    };

    const getCategoryLabel = (category: string) => {
        const categories: Record<string, string> = {
            'FUEL': 'Combustível',
            'MAINTENANCE': 'Manutenção',
            'PURCHASE': 'Compras de Estoque',
            'TAX': 'Impostos/Taxas',
            'SALARY': 'Salários',
            'OTHER': 'Outros'
        };
        return categories[category] || category;
    };

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3 uppercase bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                        <div className="p-2 bg-primary rounded-2xl text-primary-foreground shadow-lg shadow-primary/20 shrink-0">
                            <DollarSign size={32} />
                        </div>
                        Financeiro
                    </h1>
                    <p className="text-muted-foreground/60 font-black uppercase tracking-[0.2em] mt-2 text-[10px]">Gestão de contas a pagar e fluxo de caixa da frota</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2 border-border/50 text-muted-foreground/60 hover:text-primary hover:border-primary/30 uppercase font-black text-[10px] tracking-widest">
                        <Download size={18} /> Exportar
                    </Button>
                    <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 uppercase font-black text-[10px] tracking-widest shadow-lg shadow-primary/20">
                        <Plus size={18} /> Novo Lançamento
                    </Button>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Total do Mês"
                    value={overview?.summary?.grandTotal ? formatCurrency(overview.summary.grandTotal) : 'R$ 0,00'}
                    icon={<ArrowDownCircle size={24} />}
                    trend={{ value: 12, isPositive: false }}
                    loading={loadingOverview}
                />
                <StatCard
                    label="Pendente"
                    value={overview?.summary?.pendingPayments || 0}
                    description="Contas aguardando pagamento"
                    icon={<Clock size={24} />}
                    loading={loadingOverview}
                />
                <StatCard
                    label="Manutenção"
                    value={overview?.summary?.totalMaintenance ? formatCurrency(overview.summary.totalMaintenance) : 'R$ 0,00'}
                    icon={<CreditCard size={24} />}
                    loading={loadingOverview}
                />
                <StatCard
                    label="Combustível"
                    value={overview?.summary?.totalFuel ? formatCurrency(overview.summary.totalFuel) : 'R$ 0,00'}
                    icon={<ArrowUpCircle size={24} />}
                    loading={loadingOverview}
                />
            </div>

            {/* Content Tabs & Filters */}
            <div className="space-y-4">
                <div className="space-y-4">
                    {/* Status tabs */}
                    <div className="flex p-1 bg-muted/50 rounded-xl border border-border/50 w-fit">
                        {['ALL', 'PENDING', 'PAID', 'OVERDUE'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setFilter(s)}
                                className={clsx(
                                    "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                    filter === s ? "bg-background shadow-md text-primary" : "text-muted-foreground/40 hover:text-foreground hover:bg-muted/50"
                                )}
                            >
                                {s === 'ALL' ? 'Todos' : s === 'PENDING' ? 'Pendentes' : s === 'PAID' ? 'Pagos' : 'Atrasados'}
                            </button>
                        ))}
                    </div>

                    {/* Search + Category + Date Range */}
                    <div className="flex flex-col md:flex-row gap-3 items-center">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar por descrição ou fornecedor..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-border/50 rounded-2xl text-[10px] font-black uppercase tracking-tight focus:ring-2 focus:ring-primary/50 transition-all text-foreground placeholder:text-muted-foreground/20"
                            />
                        </div>
                        <select
                            value={categoryFilter}
                            onChange={e => setCategoryFilter(e.target.value)}
                            className="py-3 px-4 bg-muted/30 border border-border/50 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground w-full md:w-auto"
                        >
                            <option value="ALL">Todas as categorias</option>
                            <option value="FUEL">Combustível</option>
                            <option value="MAINTENANCE">Manutenção</option>
                            <option value="PURCHASE">Compras de Estoque</option>
                            <option value="TAX">Impostos/Taxas</option>
                            <option value="SALARY">Salários</option>
                            <option value="OTHER">Outros</option>
                        </select>
                        <div className="flex items-center gap-2 bg-muted/30 border border-border/50 px-4 py-1 rounded-2xl w-full md:w-auto">
                            <Calendar size={16} className="text-muted-foreground/40 shrink-0" />
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={e => setDateFrom(e.target.value)}
                                className="bg-transparent outline-none text-[10px] font-black uppercase py-2 text-foreground"
                            />
                            <span className="text-border text-[10px] font-black">/</span>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={e => setDateTo(e.target.value)}
                                className="bg-transparent outline-none text-[10px] font-black uppercase py-2 text-foreground"
                            />
                        </div>
                    </div>
                </div>

                {/* Transactions List */}
                <div className="grid grid-cols-1 gap-4">
                    {loadingTransactions ? (
                        Array(5).fill(0).map((_, i) => (
                            <div key={i} className="h-24 bg-card/50 border border-border/50 animate-pulse rounded-3xl" />
                        ))
                    ) : transactions?.length === 0 ? (
                        <div className="py-20 text-center bg-card/30 backdrop-blur rounded-[40px] border-2 border-dashed border-border/40 ">
                            <FileText className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Nenhuma transação encontrada</p>
                        </div>
                    ) : filteredTransactions?.map((t: any) => {
                        const status = getStatusStyle(t.status);
                        return (
                            <div key={t.id} className="group bg-card/40 backdrop-blur-sm border border-border/50 hover:border-primary/30 p-6 rounded-[32px] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:shadow-2xl hover:shadow-primary/5">
                                <div className="flex items-center gap-5">
                                    <div className={clsx("p-4 rounded-2xl border transition-colors", status.bg, status.color, "border-current/20")}>
                                        <status.icon size={28} />
                                    </div>
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            <h3 className="font-black text-xl uppercase tracking-tighter text-foreground group-hover:text-primary transition-colors">{t.description}</h3>
                                            <Badge variant="silver" className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border border-border/50">
                                                {getCategoryLabel(t.category)}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-4 text-[10px] text-muted-foreground/60 font-black uppercase tracking-widest">
                                            <span className="flex items-center gap-1.5">
                                                <Calendar size={14} className="text-primary" /> Venc: {format(new Date(t.dueDate), 'dd/MM/yyyy')}
                                            </span>
                                            {t.supplier && (
                                                <span className="flex items-center gap-1.5">
                                                    <Filter size={14} className="text-primary" /> Fornecedor: {t.supplier.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-10">
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground/30 tracking-[0.2em] mb-1">Valor Total</p>
                                        <p className="text-3xl font-black tracking-tighter text-primary">{formatCurrency(t.amount)}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {t.status === 'PENDING' && (
                                            <Button
                                                onClick={() => {
                                                    if (confirm('Deseja confirmar o pagamento desta conta?')) {
                                                        confirmPaymentMutation.mutate({
                                                            id: t.id,
                                                            data: {
                                                                paymentDate: new Date(),
                                                                paymentMethod: 'PIX' // Defaulting for simple demo
                                                            }
                                                        });
                                                    }
                                                }}
                                                size="sm"
                                                className="bg-primary text-primary-foreground hover:bg-primary/90 text-[10px] font-black uppercase tracking-widest rounded-2xl px-8 py-3 h-auto shadow-lg shadow-primary/20"
                                            >
                                                Pagar
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="sm" className="rounded-full hover:bg-muted text-muted-foreground hover:text-foreground">
                                            <MoreHorizontal size={20} />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

