import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { DashboardLayout } from './layouts/DashboardLayout';
import { VehiclesList } from './pages/Vehicles';
import { VehicleForm } from './pages/Vehicles/VehicleForm';
import { JourneysList } from './pages/Journeys';
import { JourneyDetails } from './pages/Journeys/JourneyDetails';
import { MaintenanceList } from './pages/Maintenance';
import { FuelEntriesList } from './pages/Fuel';
import { InventoryList } from './pages/Inventory';
import { LiveMap } from './components/LiveMap';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OfflineStatus } from './components/ui/OfflineStatus';
import React, { Suspense, lazy } from 'react';

const Reports = lazy(() => import('./pages/Reports'));
const Compliance = lazy(() => import('./pages/Compliance'));
const Purchasing = lazy(() => import('./pages/Purchasing'));
const Finance = lazy(() => import('./pages/Finance'));
const Tyres = lazy(() => import('./pages/Tyres'));
const Settings = lazy(() => import('./pages/Settings'));
const Users = lazy(() => import('./pages/Users').then(module => ({ default: module.UsersList })));

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
                        <Route index element={<Suspense fallback={<div>Carregando...</div>}><Users /></Suspense>} />
                    </Route>

                    <Route path="fuel" element={<FuelEntriesList />} />
                    <Route path="inventory" element={<InventoryList />} />
                    <Route path="journeys" element={<JourneysList />} />
                    <Route path="journeys/:id" element={<JourneyDetails />} />
                    <Route path="maintenance" element={<MaintenanceList />} />
                    <Route path="tyres" element={<Suspense fallback={<div>Carregando...</div>}><Tyres /></Suspense>} />
                    <Route path="/compliance" element={<Suspense fallback={<div>Carregando...</div>}><Compliance /></Suspense>} />
                    <Route path="/purchasing" element={<Suspense fallback={<div>Carregando...</div>}><Purchasing /></Suspense>} />
                    <Route path="/finance" element={<Suspense fallback={<div>Carregando...</div>}><Finance /></Suspense>} />
                    <Route path="/reports" element={<Suspense fallback={<div>Carregando...</div>}><Reports /></Suspense>} />
                    <Route path="/settings" element={<Suspense fallback={<div>Carregando...</div>}><Settings /></Suspense>} />
                </Route>
            </Routes>
            <OfflineStatus />
        </>
    );
}

export default function App() {
    return (
        <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <AuthProvider>
                    <BrowserRouter>
                        <AppRoutes />
                    </BrowserRouter>
                </AuthProvider>
            </QueryClientProvider>
        </ErrorBoundary>
    );
}
