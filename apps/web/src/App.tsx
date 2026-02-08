import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { api } from './lib/axios';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { DashboardLayout } from './layouts/DashboardLayout';
import { VehiclesList } from './pages/Vehicles';
import { VehicleForm } from './pages/Vehicles/VehicleForm';
import { DriversList } from './pages/Drivers';
import { DriverForm } from './pages/Drivers/DriverForm';
import { JourneysList } from './pages/Journeys';
import { MaintenanceList } from './pages/Maintenance';
import { LiveMap } from './components/LiveMap';
import { ErrorBoundary } from './components/ErrorBoundary';
import { StatCard, GlassCard } from './components/ui/Cards';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import { Truck, Users, MapPin, Activity } from 'lucide-react';

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: JSX.Element }) {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated && !localStorage.getItem('token')) {
        return <Navigate to="/login" replace />;
    }
    return children;
}

function Dashboard() {
    const { data: stats } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const res = await api.get('/reports/overview');
            return res.data.stats;
        }
    });

    return (
        <div className="space-y-6">
            {/* Header with Theme Switcher */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Painel de Controle</h1>
                    <p className="text-muted-foreground mt-1">Visão geral da frota em tempo real</p>
                </div>
                <ThemeSwitcher />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Jornadas Ativas"
                    value={stats?.activeJourneys || 0}
                    icon={<Activity className="w-8 h-8" />}
                />
                <StatCard
                    label="Veículos Disponíveis"
                    value={stats?.availableVehicles || 0}
                    icon={<Truck className="w-8 h-8" />}
                />
                <StatCard
                    label="Total de Funcionários"
                    value={stats?.totalDrivers || 0}
                    icon={<Users className="w-8 h-8" />}
                />
                <StatCard
                    label="Localização Ativa"
                    value={stats?.activeJourneys || 0}
                    icon={<MapPin className="w-8 h-8" />}
                />
            </div>

            {/* Live Map Section */}
            <GlassCard>
                <h2 className="text-xl font-bold mb-4">Rastreamento em Tempo Real</h2>
                <ErrorBoundary>
                    <LiveMap />
                </ErrorBoundary>
            </GlassCard>
        </div>
    );
}

function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />

                <Route path="vehicles">
                    <Route index element={<VehiclesList />} />
                    <Route path="new" element={<VehicleForm />} />
                </Route>

                <Route path="drivers">
                    <Route index element={<DriversList />} />
                    <Route path="new" element={<DriverForm />} />
                </Route>

                <Route path="journeys" element={<JourneysList />} />
                <Route path="maintenance" element={<MaintenanceList />} />
            </Route>
        </Routes>
    );
}

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <BrowserRouter>
                    <AppRoutes />
                </BrowserRouter>
            </AuthProvider>
        </QueryClientProvider>
    );
}
