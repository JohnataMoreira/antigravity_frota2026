import React, { useState } from 'react';
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
                    <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-emerald-500 dark:bg-emerald-600 rounded-2xl text-white shadow-lg shadow-emerald-500/20 dark:shadow-emerald-600/20">
                            <DollarSign size={32} />
                        </div>
                        Financeiro
                    </h1>
                    <p className="text-muted-foreground font-medium mt-1">Gestão de contas a pagar e fluxo de caixa da frota</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2">
                        <Download size={18} /> Exportar
                    </Button>
                    <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600">
                        <Plus size={18} /> Novo Lançamento
                    </Button>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total do Mês"
                    value={overview?.summary?.grandTotal ? formatCurrency(overview.summary.grandTotal) : 'R$ 0,00'}
                    icon={ArrowDownCircle}
                    trend={{ value: 12, isPositive: false }}
                    loading={loadingOverview}
                />
                <StatCard
                    title="Pendente"
                    value={overview?.summary?.pendingPayments || 0}
                    description="Contas aguardando pagamento"
                    icon={Clock}
                    loading={loadingOverview}
                />
                <StatCard
                    title="Manutenção"
                    value={overview?.summary?.totalMaintenance ? formatCurrency(overview.summary.totalMaintenance) : 'R$ 0,00'}
                    icon={CreditCard}
                    loading={loadingOverview}
                />
                <StatCard
                    title="Combustível"
                    value={overview?.summary?.totalFuel ? formatCurrency(overview.summary.totalFuel) : 'R$ 0,00'}
                    icon={ArrowUpCircle}
                    loading={loadingOverview}
                />
            </div>

            {/* Content Tabs & Filters */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex p-1 bg-gray-100 dark:bg-gray-900 rounded-xl w-fit">
                        {['ALL', 'PENDING', 'PAID', 'OVERDUE'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setFilter(s)}
                                className={clsx(
                                    "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                                    filter === s ? "bg-white dark:bg-gray-800 shadow-sm text-emerald-600 dark:text-emerald-400" : "text-gray-500 hover:bg-gray-200/50"
                                )}
                            >
                                {s === 'ALL' ? 'Todos' : s === 'PENDING' ? 'Pendentes' : s === 'PAID' ? 'Pagos' : 'Atrasados'}
                            </button>
                        ))}
                    </div>

                    <div className="relative flex-1 md:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por descrição ou fornecedor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-900 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 transition-all"
                        />
                    </div>
                </div>

                {/* Transactions List */}
                <div className="grid grid-cols-1 gap-4">
                    {loadingTransactions ? (
                        Array(5).fill(0).map((_, i) => (
                            <div key={i} className="h-24 bg-gray-100 dark:bg-gray-900 animate-pulse rounded-3xl" />
                        ))
                    ) : transactions?.length === 0 ? (
                        <div className="py-20 text-center bg-gray-50 dark:bg-gray-900/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-xl font-bold text-gray-400">Nenhuma transação encontrada</p>
                        </div>
                    ) : transactions?.map((t: any) => {
                        const status = getStatusStyle(t.status);
                        return (
                            <div key={t.id} className="group bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 hover:border-emerald-500/30 p-5 rounded-3xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5">
                                <div className="flex items-center gap-4">
                                    <div className={clsx("p-3 rounded-2xl", status.bg, status.color)}>
                                        <status.icon size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-lg">{t.description}</h3>
                                            <Badge variant="info" className="text-[10px] font-black uppercase tracking-tighter">
                                                {getCategoryLabel(t.category)}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={14} /> Venc: {format(new Date(t.dueDate), 'dd/MM/yyyy')}
                                            </span>
                                            {t.supplier && (
                                                <span className="flex items-center gap-1">
                                                    <Filter size={14} /> Fornecedor: {t.supplier.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-8">
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Valor</p>
                                        <p className="text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">{formatCurrency(t.amount)}</p>
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
                                                className="bg-emerald-600 hover:bg-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-xl px-6"
                                            >
                                                Pagar
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="sm" className="rounded-full">
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
