import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Car,
    Route,
    Users,
    FileText,
    Bell,
    Settings,
    LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
    label: string;
    href: string;
    icon: React.ElementType;
}

const navigation: NavItem[] = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Veículos', href: '/vehicles', icon: Car },
    { label: 'Jornadas', href: '/journeys', icon: Route },
    { label: 'Motoristas', href: '/drivers', icon: Users },
    { label: 'Relatórios', href: '/reports', icon: FileText },
];

/**
 * MainLayout - Application shell with sidebar navigation
 */
export default function MainLayout() {
    const location = useLocation();

    return (
        <div className="flex h-screen bg-neutral-50">
            {/* Sidebar */}
            <aside className="w-64 bg-primary-900 text-white flex flex-col">
                {/* Logo */}
                <div className="p-6 border-b border-primary-800">
                    <h1 className="text-2xl font-bold">Frota Manager</h1>
                    <p className="text-sm text-primary-300 mt-1">Gestão Inteligente</p>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                    {navigation.map((item) => {
                        const isActive = location.pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                className={cn(
                                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                                    'hover:bg-primary-800',
                                    isActive && 'bg-accent-600 hover:bg-accent-700'
                                )}
                            >
                                <Icon className="h-5 w-5" />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* User Section */}
                <div className="p-4 border-t border-primary-800">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary-800 cursor-pointer transition-colors">
                        <div className="h-8 w-8 rounded-full bg-accent-600 flex items-center justify-center font-semibold">
                            JM
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium">Johnata Moreira</p>
                            <p className="text-xs text-primary-300">Admin</p>
                        </div>
                        <LogOut className="h-4 w-4 text-primary-400" />
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-primary-900">
                            {navigation.find((n) => n.href === location.pathname)?.label || 'Dashboard'}
                        </h2>
                        <p className="text-sm text-neutral-500 mt-0.5">
                            {new Date().toLocaleDateString('pt-BR', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </p>
                    </div>

                    {/* Notifications */}
                    <button className="relative p-2 rounded-lg hover:bg-neutral-100 transition-colors">
                        <Bell className="h-6 w-6 text-neutral-600" />
                        <span className="absolute top-1 right-1 h-2 w-2 bg-danger-500 rounded-full" />
                    </button>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
