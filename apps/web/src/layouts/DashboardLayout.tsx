import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Truck, Users, Map, Wrench, LogOut, Menu, X, User as UserIcon, FileText } from 'lucide-react';
import { ThemeSwitcher } from '../components/ThemeSwitcher';

export function DashboardLayout() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navigation = [
        { name: 'Painel', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Veículos', href: '/vehicles', icon: Truck },
        { name: 'Funcionários', href: '/users', icon: Users },
        { name: 'Jornadas', href: '/journeys', icon: Map },
        { name: 'Manutenção', href: '/maintenance', icon: Wrench },
        { name: 'Relatórios', href: '/reports', icon: FileText },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
            {/* Sidebar for Desktop */}
            <aside className="hidden md:flex flex-col w-64 glass-card h-screen sticky top-0 border-r border-gray-200 dark:border-gray-800">
                <div className="p-6">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Frota2026</h1>
                </div>

                <div className="px-6 py-4 flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <UserIcon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate text-gray-900 dark:text-gray-100">{user?.name || 'Usuário'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    {navigation.map((item) => {
                        const isActive = location.pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all ${isActive
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : ''}`} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 space-y-2">
                    <div className="p-2 flex justify-center border-t border-gray-100 dark:border-gray-800 pt-4">
                        <ThemeSwitcher />
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors"
                    >
                        <LogOut className="w-5 h-5 mr-3" />
                        Sair
                    </button>
                </div>
            </aside>

            {/* Mobile Header & Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between p-4">
                    <span className="font-bold text-lg">Frota2026</span>
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                        {isMobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </header>

                {/* Mobile Menu Overlay */}
                {isMobileMenuOpen && (
                    <div className="fixed inset-0 z-50 md:hidden flex flex-col bg-white dark:bg-gray-900 animate-in fade-in slide-in-from-top-4 duration-200">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                            <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Frota2026</span>
                            <button
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="p-2 text-gray-500"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <nav className="flex-1 px-4 py-8 space-y-4">
                            {navigation.map((item) => {
                                const isActive = location.pathname.startsWith(item.href);
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        className={`flex items-center px-6 py-4 text-lg font-semibold rounded-2xl transition-all ${isActive
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                            }`}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <item.icon className="w-6 h-6 mr-4" />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="p-6 border-t border-gray-100 dark:border-gray-800">
                            <button
                                onClick={handleLogout}
                                className="flex items-center justify-center w-full px-6 py-4 text-lg font-bold text-red-500 bg-red-50 dark:bg-red-900/10 rounded-2xl"
                            >
                                <LogOut className="w-6 h-6 mr-3" />
                                Sair da Conta
                            </button>
                        </div>
                    </div>
                )}

                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
