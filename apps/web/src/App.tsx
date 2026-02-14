import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { api } from './lib/axios';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { DashboardLayout } from './layouts/DashboardLayout';
import { VehiclesList } from './pages/Vehicles';
import { VehicleForm } from './pages/Vehicles/VehicleForm';
import { Drivers } from './pages/Drivers';
import { JourneysList } from './pages/Journeys';
import { JourneyDetails } from './pages/Journeys/JourneyDetails';
import { MaintenanceList } from './pages/Maintenance';
import Reports from './pages/Reports';
import { LiveMap } from './components/LiveMap';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ThemeSwitcher } from './components/ThemeSwitcher';

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: JSX.Element }) {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated && !localStorage.getItem('token')) {
        return <Navigate to="/login" replace />;
    }
    return children;
}

import { Dashboard } from './pages/Dashboard';

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
                    <Route index element={<Drivers />} />
                </Route>

                <Route path="journeys" element={<JourneysList />} />
                <Route path="journeys/:id" element={<JourneyDetails />} />
                <Route path="maintenance" element={<MaintenanceList />} />
                <Route path="reports" element={<Reports />} />
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
