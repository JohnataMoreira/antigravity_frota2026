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
        <div>
            <h1 className="text-2xl font-bold mb-4">Overview</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
                    <h3 className="text-gray-500 text-sm font-medium">Active Journeys</h3>
                    <p className="text-3xl font-bold mt-2 text-blue-600">{stats?.activeJourneys || 0}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
                    <h3 className="text-gray-500 text-sm font-medium">Available Vehicles</h3>
                    <p className="text-3xl font-bold mt-2 text-green-600">{stats?.availableVehicles || 0}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
                    <h3 className="text-gray-500 text-sm font-medium">Total Drivers</h3>
                    <p className="text-3xl font-bold mt-2">{stats?.totalDrivers || 0}</p>
                </div>
            </div>

            <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">Live Tracking</h2>
                <LiveMap />
            </div>
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
