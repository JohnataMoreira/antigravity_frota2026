import React, { useEffect, useState } from 'react';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import {
    Activity,
    Car,
    AlertTriangle,
    DollarSign,
    MapPin,
    TrendingUp,
    AlertCircle,
    Calendar
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { reportsApi, DashboardStats } from '@/services/reportsService';

/**
 * Dashboard Home - Main KPI overview page
 */
export default function DashboardHome() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const params: any = {};
                if (startDate) params.startDate = startDate;
                if (endDate) params.endDate = endDate;
                const response = await reportsApi.getOverview(params);
                setStats(response.data);
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [startDate, endDate]);

    const getHealthVariant = (score: number) => {
        if (score >= 85) return 'success';
        if (score >= 70) return 'warning';
        return 'danger';
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page Header with Filters */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Dashboard Operacional
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">Visão geral do desempenho e situação da frota.</p>
                </div>
                <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-100 shadow-sm w-full sm:w-auto overflow-x-auto">
                    <Calendar size={16} className="text-gray-400 shrink-0 ml-2" />
                    <input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="py-1 px-2 bg-transparent text-sm font-medium outline-none border-b border-transparent focus:border-blue-500 focus:text-blue-600 transition-all rounded-none"
                        title="Data Inicial"
                    />
                    <span className="text-gray-400 text-xs font-bold uppercase px-1 tracking-wider">até</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="py-1 px-2 bg-transparent text-sm font-medium outline-none border-b border-transparent focus:border-blue-500 focus:text-blue-600 transition-all rounded-none"
                        title="Data Final"
                    />
                    {(startDate || endDate) && (
                        <button
                            onClick={() => { setStartDate(''); setEndDate(''); }}
                            className="ml-2 text-xs px-2 py-1 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg font-bold transition-all"
                        >
                            Limpar
                        </button>
                    )}
                </div>
            </div>

            {/* Welcome Alert */}
            <Alert
                variant="info"
                title="Bem-vindo ao Frota Manager!"
                icon={TrendingUp}
                dismissible
                onDismiss={() => console.log('dismissed')}
            >
                Sua frota está operando normalmente. Continue o
                ótimo trabalho!
            </Alert>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard
                    title="Jornadas Ativas"
                    value={stats?.stats.activeJourneys || 0}
                    change={{
                        value: 0,
                        label: 'normais',
                        positive: true,
                    }}
                    icon={MapPin}
                    variant="info"
                    loading={loading}
                />

                <StatCard
                    title="Veí. Disponíveis"
                    value={stats?.stats.availableVehicles || 0}
                    icon={Car}
                    variant="success"
                    loading={loading}
                />

                <StatCard
                    title="Veí. em Uso"
                    value={stats?.stats.inUseVehicles || 0}
                    icon={Activity}
                    variant="info"
                    loading={loading}
                />

                <StatCard
                    title="Em Manutenção"
                    value={stats?.stats.maintenanceVehicles || 0}
                    icon={AlertTriangle}
                    variant="warning"
                    loading={loading}
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* History Chart */}
                <Card variant="glass" className="xl:col-span-2 p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Evolução de Custos vs KM</h3>
                            <p className="text-sm text-gray-500">Histórico de desempenho dos últimos 6 meses</p>
                        </div>
                    </div>
                    <div className="h-80 w-full mt-auto">
                        {loading ? (
                            <div className="h-full w-full flex items-center justify-center bg-gray-50 rounded-xl animate-pulse">
                                <TrendingUp className="text-gray-300 w-12 h-12" />
                            </div>
                        ) : stats?.history && stats.history.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={stats.history} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `R$ ${val}`} width={80} />
                                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `${val}km`} />
                                    <RechartsTooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: number | undefined, name: string | undefined) => [name === 'costs' ? `R$ ${(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : `${value || 0} KM`, name === 'costs' ? 'Custos' : 'Quilometragem']}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                    <Line yAxisId="left" type="monotone" dataKey="costs" name="Custo Total" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                    <Line yAxisId="right" type="monotone" dataKey="km" name="KM Percorrido" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full w-full flex flex-col items-center justify-center bg-gray-50 rounded-xl">
                                <p className="text-gray-400 font-medium">Sem dados históricos no período.</p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Alerts Sidebar */}
                <div className="space-y-4">
                    <h3 className="text-h3 font-semibold">Alertas Recentes</h3>

                    {loading ? (
                        <Card variant="glass">
                            <div className="animate-pulse space-y-3">
                                <div className="h-4 bg-neutral-200 rounded w-3/4" />
                                <div className="h-3 bg-neutral-200 rounded w-full" />
                                <div className="h-3 bg-neutral-200 rounded w-5/6" />
                            </div>
                        </Card>
                    ) : (
                        <>
                            <Alert variant="warning" icon={AlertCircle}>
                                <p className="font-medium">Veículo ABC-1234</p>
                                <p className="text-xs mt-1">
                                    Manutenção preventiva vence em 3 dias
                                </p>
                            </Alert>

                            <Alert variant="danger" icon={AlertTriangle}>
                                <p className="font-medium">Motorista João Silva</p>
                                <p className="text-xs mt-1">
                                    3 frenagens bruscas detectadas hoje
                                </p>
                            </Alert>

                            <Alert variant="info" icon={Car}>
                                <p className="font-medium">Veículo XYZ-5678</p>
                                <p className="text-xs mt-1">
                                    Consumo de combustível acima da média
                                </p>
                            </Alert>
                        </>
                    )}
                </div>
            </div>

            {/* KPI Cards Grid 2 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Custos (Mês)"
                    value={stats ? formatCurrency(stats.stats.monthlyCosts) : 'R$ 0,00'}
                    icon={DollarSign}
                    variant="default"
                    loading={loading}
                />

                <StatCard
                    title="Distância (Km)"
                    value={`${stats?.stats.totalKm || 0} KM`}
                    icon={TrendingUp}
                    variant="info"
                    loading={loading}
                />

                <StatCard
                    title="Combustível Médio"
                    value={`${stats?.stats.avgFuelLevel || 0}%`}
                    icon={Activity}
                    variant={stats && stats.stats.avgFuelLevel < 20 ? 'danger' : 'success'}
                    loading={loading}
                />
            </div>
        </div>
    );
}

