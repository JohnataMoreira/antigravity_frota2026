import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from './lib/axios';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { DashboardLayout } from './layouts/DashboardLayout';
import { VehiclesList } from './pages/Vehicles';
import { VehicleForm } from './pages/Vehicles/VehicleForm';
import { UsersList } from './pages/Users';
import { JourneysList } from './pages/Journeys';
import { JourneyDetails } from './pages/Journeys/JourneyDetails';
import { MaintenanceList } from './pages/Maintenance';
import { FuelEntriesList } from './pages/Fuel';
import { InventoryList } from './pages/Inventory';
import Reports from './pages/Reports';
import { LiveMap } from './components/LiveMap';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OfflineStatus } from './components/ui/OfflineStatus';

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: JSX.Element }) {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated && !localStorage.getItem('token')) {
        return <Navigate to="/login" replace />;
    }
    return children;
}

import { Dashboard } from './pages/Dashboard';

import { useSync } from './hooks/useSync';

function AppRoutes() {
    useSync();
    return (
        <>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />

                    <Route path="vehicles">
                        <Route index element={<VehiclesList />} />
                        <Route path="new" element={<VehicleForm />} />
                    </Route>

                    <Route path="users">
                        <Route index element={<UsersList />} />
                    </Route>

                    <Route path="fuel" element={<FuelEntriesList />} />
                    <Route path="inventory" element={<InventoryList />} />
                    <Route path="journeys" element={<JourneysList />} />
                    <Route path="journeys/:id" element={<JourneyDetails />} />
                    <Route path="maintenance" element={<MaintenanceList />} />
                    <Route path="reports" element={<Reports />} />
                </Route>
            </Routes>
            <OfflineStatus />
        </>
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
