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
import { formatCurrency } from '@/lib/utils';
import { reportsApi, DashboardStats } from '@/services/reportsService';

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
 {/* Live Map Placeholder */}
 <Card variant="glass" className="xl:col-span-2">
 <div className="h-96 bg-neutral-100 rounded-lg flex items-center justify-center">
 <div className="text-center text-neutral-500 ">
 <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
 <p className="font-medium">Mapa em Tempo Real</p>
 <p className="text-sm mt-1">
 {stats?.stats.activeJourneys || 0} veículos em movimento
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

