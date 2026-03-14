import React, { useEffect, useState } from 'react';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import {
    Activity,
    Car,
    AlertTriangle,
    MapPin,
    TrendingUp,
    AlertCircle,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { reportsService } from '@/services/reportsService';
type DashboardStats = any;
const reportsApi = reportsService;
import { LiveMap } from '@/components/LiveMap';
import { SEO } from '@/components/SEO';
import { useTranslation } from 'react-i18next';

/**
 * Dashboard Home - Main KPI overview page
 */
export default function DashboardHome() {
    const { t } = useTranslation();
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


    return (
        <div className="space-y-6 animate-fade-in">
            <SEO 
                title="Dashboard" 
                description="Visão geral da sua frota: veículos ativos, alertas de manutenção e estatísticas de uso." 
            />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter gradient-text uppercase">
                        {t('dashboard.operational_title')}
                    </h1>
                    <p className="text-muted-foreground/60 font-black uppercase tracking-[0.2em] mt-1 text-[10px]">
                        {t('dashboard.version_label')}
                    </p>
                </div>
            </div>

            {/* Welcome Alert */}
            <Alert
                variant="info"
                title={t('dashboard.welcome_title')}
                icon={TrendingUp}
                dismissible
                onDismiss={() => console.log('dismissed')}
            >
                {t('dashboard.vehicles_available', { count: stats?.stats.availableVehicles || 0 })}. Continue o
                ótimo trabalho!
            </Alert>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard
                    title={t('dashboard.active_journeys')}
                    value={stats?.stats.activeJourneys || 0}
                    description={stats?.stats.activeJourneys ? t('dashboard.journeys_with_incidents', { count: stats.stats.journeysWithIncidents || 0 }) : t('dashboard.no_active_journeys')}
                    icon={MapPin}
                    variant="info"
                    loading={loading}
                />
 
                <StatCard
                    title={t('dashboard.available_vehicles')}
                    value={stats?.stats.availableVehicles || 0}
                    description={t('dashboard.ready_for_operation')}
                    icon={Car}
                    variant="success"
                    loading={loading}
                />
 
                <StatCard
                    title={t('dashboard.in_use_vehicles')}
                    value={stats?.stats.inUseVehicles || 0}
                    description={t('dashboard.in_transit')}
                    icon={Activity}
                    variant="info"
                    loading={loading}
                />
 
                <StatCard
                    title={t('dashboard.in_maintenance')}
                    value={stats?.stats.maintenanceVehicles || 0}
                    description={t('dashboard.in_workshop')}
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
                        <h3 className="font-black uppercase tracking-tighter text-sm">{t('dashboard.live_monitoring')}</h3>
                    </div>
                    <a href="/journeys" className="text-[10px] font-black uppercase text-primary hover:underline transition-all">{t('dashboard.view_route_details')}</a>
                </div>
                <div className="h-[450px]">
                    <LiveMap />
                </div>
            </Card>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Alerts Sidebar */}
                <div className="space-y-4">
                    <h3 className="text-h3 font-semibold">{t('dashboard.recent_alerts')}</h3>

                    {loading ? (
                        <Card variant="glass">
                            <div className="animate-pulse space-y-3">
                                <div className="h-4 bg-neutral-200 rounded w-3/4" />
                                <div className="h-3 bg-neutral-200 rounded w-full" />
                                <div className="h-3 bg-neutral-200 rounded w-5/6" />
                            </div>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {stats?.alerts?.length > 0 ? (
                                stats.alerts.map((alert: any, idx: number) => (
                                    <Alert
                                        key={idx}
                                        variant={alert.type || 'warning'}
                                        icon={alert.type === 'danger' ? AlertTriangle : alert.type === 'info' ? Car : AlertCircle}
                                    >
                                        <p className="font-medium">{alert.title}</p>
                                        <p className="text-xs mt-1">{alert.message}</p>
                                    </Alert>
                                ))
                            ) : (
                                <Card variant="glass" className="opacity-50">
                                    <p className="text-center text-xs font-black uppercase tracking-widest text-muted-foreground p-4">
                                        {t('dashboard.no_critical_alerts')}
                                    </p>
                                </Card>
                            )}
                        </div>
                    )}
                </div>

                {/* History Chart Placeholder */}
                <Card variant="glass" className="xl:col-span-2">
                    <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20 mb-4">
                        <h3 className="font-black uppercase tracking-tighter text-sm">{t('dashboard.activity_history')}</h3>
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
