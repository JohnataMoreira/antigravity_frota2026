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
} from 'lucide-react';
import { calculateFleetHealth, formatCurrency } from '@/lib/utils';

interface DashboardStats {
    fleetHealth: number;
    activeJourneys: number;
    pendingAlerts: number;
    monthlyCost: number;
    vehiclesAvailable: number;
    totalVehicles: number;
}

/**
 * Dashboard Home - Main KPI overview page
 */
export default function DashboardHome() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // TODO: Fetch real data from API
        // Simulating API call for now
        setTimeout(() => {
            const mockStats: DashboardStats = {
                fleetHealth: calculateFleetHealth({
                    vehiclesAvailable: 18,
                    totalVehicles: 20,
                    lowMaintenancePercent: 85,
                    safeDriversPercent: 92,
                }),
                activeJourneys: 12,
                pendingAlerts: 3,
                monthlyCost: 45890.5,
                vehiclesAvailable: 18,
                totalVehicles: 20,
            };
            setStats(mockStats);
            setLoading(false);
        }, 800);
    }, []);

    const getHealthVariant = (score: number) => {
        if (score >= 85) return 'success';
        if (score >= 70) return 'warning';
        return 'danger';
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Welcome Alert */}
            <Alert
                variant="info"
                title="Bem-vindo ao Frota Manager!"
                icon={TrendingUp}
                dismissible
                onDismiss={() => console.log('dismissed')}
            >
                Sua frota está operando com{' '}
                <strong>{stats?.fleetHealth || 0}% de eficiência</strong>. Continue o
                ótimo trabalho!
            </Alert>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard
                    title="Saúde da Frota"
                    value={`${stats?.fleetHealth || 0}%`}
                    change={{
                        value: 5.2,
                        label: 'vs mês anterior',
                        positive: true,
                    }}
                    icon={Activity}
                    variant={stats ? getHealthVariant(stats.fleetHealth) : 'default'}
                    loading={loading}
                />

                <StatCard
                    title="Jornadas Ativas"
                    value={stats?.activeJourneys || 0}
                    change={{
                        value: -2,
                        label: 'vs ontem',
                        positive: false,
                    }}
                    icon={MapPin}
                    variant="info"
                    loading={loading}
                />

                <StatCard
                    title="Alertas Pendentes"
                    value={stats?.pendingAlerts || 0}
                    icon={AlertTriangle}
                    variant={stats && stats.pendingAlerts > 5 ? 'danger' : 'warning'}
                    loading={loading}
                />

                <StatCard
                    title="Custo Mensal"
                    value={stats ? formatCurrency(stats.monthlyCost) : 'R$ 0,00'}
                    change={{
                        value: 3.1,
                        label: 'vs mês anterior',
                        positive: false,
                    }}
                    icon={DollarSign}
                    variant="default"
                    loading={loading}
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Live Map Placeholder */}
                <Card variant="glass" className="xl:col-span-2">
                    <div className="h-96 bg-neutral-100 dark:bg-neutral-800/50 rounded-lg flex items-center justify-center">
                        <div className="text-center text-neutral-500 dark:text-neutral-400">
                            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="font-medium">Mapa em Tempo Real</p>
                            <p className="text-sm mt-1">
                                {stats?.activeJourneys || 0} veículos em movimento
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Alerts Sidebar */}
                <div className="space-y-4">
                    <h3 className="text-h3 font-semibold">Alertas Recentes</h3>

                    {loading ? (
                        <Card variant="glass">
                            <div className="animate-pulse space-y-3">
                                <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4" />
                                <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-full" />
                                <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-5/6" />
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

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card variant="glass">
                    <h4 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                        Veículos Disponíveis
                    </h4>
                    <p className="text-3xl font-bold text-primary-900 dark:text-primary-100">
                        {stats?.vehiclesAvailable || 0}
                        <span className="text-lg text-neutral-500">
                            /{stats?.totalVehicles || 0}
                        </span>
                    </p>
                </Card>

                <Card variant="glass">
                    <h4 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                        Eficiência Média
                    </h4>
                    <p className="text-3xl font-bold text-primary-900 dark:text-primary-100">
                        12.5 <span className="text-lg text-neutral-500 dark:text-neutral-400">km/L</span>
                    </p>
                </Card>

                <Card variant="glass">
                    <h4 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                        Tempo Médio de Jornada
                    </h4>
                    <p className="text-3xl font-bold text-primary-900 dark:text-primary-100">
                        2h 34min
                    </p>
                </Card>
            </div>
        </div>
    );
}
