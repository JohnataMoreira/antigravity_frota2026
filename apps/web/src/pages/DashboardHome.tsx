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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { calculateFleetHealth, formatCurrency } from '@/lib/utils';
import { reportsApi, DashboardStats } from '@/services/reportsService';
import { LiveMap } from '@/components/LiveMap';
import { clsx } from 'clsx';

/**
 * Dashboard Home - Main KPI overview page
 */
export default function DashboardHome() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await reportsApi.getOverview();
                setStats(response.data);
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
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
                <strong>{stats?.stats.availableVehicles || 0} veículos disponíveis</strong>. Continue o
                ótimo trabalho!
            </Alert>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard
                    title="Jornadas Ativas"
                    value={stats?.stats.activeJourneys || 0}
                    description={stats?.stats.activeJourneys ? `${stats.stats.journeysWithIncidents || 0} com incidentes` : "Sem viagens no momento"}
                    icon={MapPin}
                    variant="info"
                    loading={loading}
                />

                <StatCard
                    title="Veí. Disponíveis"
                    value={stats?.stats.availableVehicles || 0}
                    description="Prontos para operação"
                    icon={Car}
                    variant="success"
                    loading={loading}
                />

                <StatCard
                    title="Veí. em Uso"
                    value={stats?.stats.inUseVehicles || 0}
                    description="Em trânsito ou operação"
                    icon={Activity}
                    variant="info"
                    loading={loading}
                />

                <StatCard
                    title="Em Manutenção"
                    value={stats?.stats.maintenanceVehicles || 0}
                    description="Na oficina ou aguardando"
                    icon={AlertTriangle}
                    variant={stats && stats.stats.maintenanceVehicles > 5 ? 'danger' : 'warning'}
                    loading={loading}
                />
            </div>

            {/* Live Map Section */}
            <Card variant="glass" className="overflow-hidden border-border/50">
                <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
                    <div className="flex items-center gap-2">
                        <MapPin className="text-primary w-5 h-5" />
                        <h3 className="font-black uppercase tracking-tighter text-sm">Monitoramento em Tempo Real</h3>
                    </div>
                    <a href="/journeys" className="text-[10px] font-black uppercase text-primary hover:underline transition-all">Ver detalhes das rotas →</a>
                </div>
                <div className="h-[450px]">
                    <LiveMap />
                </div>
            </Card>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
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

                {/* History Chart Placeholder */}
                <Card variant="glass" className="xl:col-span-2">
                    <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20 mb-4">
                        <h3 className="font-black uppercase tracking-tighter text-sm">Histórico de Atividade</h3>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats?.history || []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                                <RechartsTooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        borderRadius: '12px',
                                        border: '1px solid hsl(var(--border))',
                                        fontSize: '10px',
                                        fontWeight: 'bold'
                                    }}
                                />
                                <Line type="monotone" dataKey="costs" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} />
                                <Line type="monotone" dataKey="km" stroke="hsl(var(--emerald-500))" strokeWidth={3} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
        </div>
    );
}
