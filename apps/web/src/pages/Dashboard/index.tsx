import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { StatCard, GlassCard } from '../../components/ui/Cards';
import { lazy, Suspense } from 'react';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { ThemeSwitcher } from '../../components/ThemeSwitcher';
import { AlertsWidget } from './components/AlertsWidget';
import { VehicleHealthCard } from './components/VehicleHealthCard';
import { Truck, Users, MapPin, Activity, DollarSign, Gauge, Wrench, CheckCircle } from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { formatCurrency, formatKm } from '../../lib/utils';

const LiveMap = lazy(() => import('../../components/LiveMap').then(m => ({ default: m.LiveMap })));

export function Dashboard() {
    const { data: reportData } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const res = await api.get('/reports/overview');
            return res.data;
        }
    });

    const { data: alerts = [], isLoading: loadingAlerts } = useQuery({
        queryKey: ['maintenance-alerts'],
        queryFn: async () => {
            const res = await api.get('/maintenance/alerts');
            return res.data;
        }
    });

    const stats = reportData?.stats;
    const history = reportData?.history || [
        { name: 'Jan', costs: 400, km: 2400 },
        { name: 'Fev', costs: 300, km: 1398 },
        { name: 'Mar', costs: 200, km: 9800 },
        { name: 'Abr', costs: 278, km: 3908 },
        { name: 'Mai', costs: 189, km: 4800 },
        { name: 'Jun', costs: 239, km: 3800 },
    ];

    const typeLabels: Record<string, string> = {
        CAR: 'Carros',
        TRUCK: 'Caminhões',
        MOTORCYCLE: 'Motos',
        MACHINE: 'Máquinas'
    };

    const renderBreakdown = (items: any[]) => {
        if (!items || items.length === 0) return null;
        return (
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800/50">
                {items.map((item: any) => (
                    <div key={item.type} className="flex items-center gap-1">
                        <span className="text-[10px] font-black uppercase text-muted-foreground">
                            {typeLabels[item.type] || item.type}:
                        </span>
                        <span className="text-xs font-bold text-primary">
                            {item._count._all}
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight gradient-text">
                        Painel de Controle
                    </h1>
                    <p className="text-muted-foreground/90 dark:text-gray-300 mt-2 text-lg font-medium">
                        Visão geral da frota e métricas operacionais
                    </p>
                </div>
                <ThemeSwitcher />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                <StatCard
                    label="Jornadas Ativas"
                    value={stats?.activeJourneys || 0}
                    icon={<Activity className="w-8 h-8" />}
                    variant="info"
                    gradient={true}
                >
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800/50">
                        <div className="flex items-center gap-1">
                            <span className="text-[10px] font-black uppercase text-muted-foreground">normais:</span>
                            <span className="text-xs font-bold text-green-500">{stats?.journeysWithoutIncidents || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-[10px] font-black uppercase text-muted-foreground">incidentes:</span>
                            <span className="text-xs font-bold text-amber-500">{stats?.journeysWithIncidents || 0}</span>
                        </div>
                    </div>
                </StatCard>
                <StatCard
                    label="Vei. Disponíveis"
                    value={stats?.availableVehicles || 0}
                    icon={<CheckCircle className="w-8 h-8" />}
                    variant="success"
                >
                    {renderBreakdown(stats?.breakdown?.available)}
                </StatCard>
                <StatCard
                    label="Vei. em Uso"
                    value={stats?.inUseVehicles || 0}
                    icon={<Truck className="w-8 h-8" />}
                    variant="info"
                >
                    {renderBreakdown(stats?.breakdown?.inUse)}
                </StatCard>
                <StatCard
                    label="Em Manutenção"
                    value={stats?.maintenanceVehicles || 0}
                    icon={<Wrench className="w-8 h-8" />}
                    variant="warning"
                >
                    {renderBreakdown(stats?.breakdown?.maintenance)}
                </StatCard>
                <StatCard
                    label="Custos (Mês)"
                    value={formatCurrency(stats?.monthlyCosts)}
                    icon={<DollarSign className="w-8 h-8" />}
                />
                <StatCard
                    label="Distância (KM)"
                    value={formatKm(stats?.totalKm)}
                    icon={<Gauge className="w-8 h-8" />}
                />
            </div>

            {/* Active Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <GlassCard gradient={true} className="h-full">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                            <MapPin className="w-6 h-6 text-primary" />
                            Rastreamento em Tempo Real
                        </h2>
                        <ErrorBoundary>
                            <Suspense fallback={
                                <div className="h-[400px] w-full flex items-center justify-center bg-gray-50 dark:bg-gray-800/20 rounded-xl border border-dashed animate-pulse">
                                    <div className="text-center">
                                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                        <p className="text-muted-foreground font-medium">Carregando mapa em tempo real...</p>
                                    </div>
                                </div>
                            }>
                                <LiveMap />
                            </Suspense>
                        </ErrorBoundary>
                    </GlassCard>
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <VehicleHealthCard alerts={alerts} isLoading={loadingAlerts} />
                    <AlertsWidget />
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GlassCard>
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-primary" />
                        Custos de Manutenção
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={history}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(0,0,0,0.8)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: '#fff'
                                    }}
                                    formatter={(value: any) => [formatCurrency(value), 'Gasto']}
                                />
                                <Bar dataKey="costs" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>

                <GlassCard>
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Gauge className="w-5 h-5 text-primary" />
                        Quilometragem Percorrida
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={history}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(0,0,0,0.8)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: '#fff'
                                    }}
                                    formatter={(value: any) => [formatKm(value), 'Distância']}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="km"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    dot={{ r: 6 }}
                                    activeDot={{ r: 8 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>
            </div>

        </div>
    );
}
