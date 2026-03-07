import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PWAProvider } from './components/PWAProvider';
import { Login } from './pages/Login';
import { DashboardLayout } from './layouts/DashboardLayout';
import { LiveMap } from './components/LiveMap';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OfflineStatus } from './components/ui/OfflineStatus';
import React, { Suspense, lazy } from 'react';

const Reports = lazy(() => import('./pages/Reports'));
const Compliance = lazy(() => import('./pages/Compliance'));
const Purchasing = lazy(() => import('./pages/Purchasing'));
const Finance = lazy(() => import('./pages/Finance'));
const Tyres = lazy(() => import('./pages/Tyres'));
const Users = lazy(() => import('./pages/Users').then(module => ({ default: module.UsersList })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const VehiclesList = lazy(() => import('./pages/Vehicles').then(m => ({ default: m.VehiclesList })));
const VehicleForm = lazy(() => import('./pages/Vehicles/VehicleForm').then(m => ({ default: m.VehicleForm })));
const VehicleDetail = lazy(() => import('./pages/Vehicles/VehicleDetail').then(m => ({ default: m.VehicleDetail })));
const JourneysList = lazy(() => import('./pages/Journeys').then(m => ({ default: m.JourneysList })));
const JourneyDetails = lazy(() => import('./pages/Journeys/JourneyDetails').then(m => ({ default: m.JourneyDetails })));
const MaintenanceList = lazy(() => import('./pages/Maintenance').then(m => ({ default: m.MaintenanceList })));
const FuelEntriesList = lazy(() => import('./pages/Fuel').then(m => ({ default: m.FuelEntriesList })));
const InventoryList = lazy(() => import('./pages/Inventory').then(m => ({ default: m.InventoryList })));

const queryClient = new QueryClient();

function LoadingScreen() {
    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex flex-col items-center justify-center z-[100] animate-in fade-in duration-500">
            <div className="relative">
                <div className="w-24 h-24 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full animate-pulse" />
                </div>
            </div>
            <p className="mt-6 text-[10px] font-black uppercase tracking-[0.3em] text-primary animate-pulse">Sincronizando Frota</p>
        </div>
    );
}

function ProtectedRoute({ children }: { children: JSX.Element }) {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated && !localStorage.getItem('token')) {
        return <Navigate to="/login" replace />;
    }
    return children;
}

function AppRoutes() {
    return (
        <Suspense fallback={<LoadingScreen />}>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />

                    <Route path="vehicles">
                        <Route index element={<VehiclesList />} />
                        <Route path="new" element={<VehicleForm />} />
                        <Route path=":id" element={<VehicleDetail />} />
                    </Route>

                    <Route path="users">
                        <Route index element={<Users />} />
                    </Route>

                    <Route path="fuel" element={<FuelEntriesList />} />
                    <Route path="inventory" element={<InventoryList />} />
                    <Route path="journeys" element={<JourneysList />} />
                    <Route path="journeys/:id" element={<JourneyDetails />} />
                    <Route path="maintenance" element={<MaintenanceList />} />
                    <Route path="tyres" element={<Tyres />} />
                    <Route path="/compliance" element={<Compliance />} />
                    <Route path="/purchasing" element={<Purchasing />} />
                    <Route path="/finance" element={<Finance />} />
                    <Route path="/reports" element={<Reports />} />
                </Route>
            </Routes>
            <OfflineStatus />
        </Suspense>
    );
}

export default function App() {
    return (
        <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <AuthProvider>
                    <PWAProvider>
                        <BrowserRouter>
                            <AppRoutes />
                        </BrowserRouter>
                    </PWAProvider>
                </AuthProvider>
            </QueryClientProvider>
        </ErrorBoundary>
    );
}
