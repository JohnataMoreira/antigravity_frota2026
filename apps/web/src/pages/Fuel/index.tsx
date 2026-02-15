import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { Fuel as FuelIcon, Search, Filter, Calendar, Zap, DollarSign, Droplets } from 'lucide-react';
import { formatCurrency, formatKm } from '../../lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FuelEntry {
    id: string;
    date: string;
    km: number;
    liters: number;
    totalValue: number;
    pricePerLiter: number;
    fuelType: string;
    paymentMethod: string;
    vehicle: {
        plate: string;
        model: string;
    };
    driver: {
        name: string;
    };
}

export function FuelEntriesList() {
    const [search, setSearch] = useState('');
    const [dateFilter, setDateFilter] = useState('');

    const { data: entries, isLoading } = useQuery<FuelEntry[]>({
        queryKey: ['fuel-entries'],
        queryFn: async () => {
            const response = await api.get('/fuel');
            return response.data;
        },
    });

    const filteredEntries = entries?.filter(entry =>
        entry.vehicle.plate.toLowerCase().includes(search.toLowerCase()) ||
        entry.driver.name.toLowerCase().includes(search.toLowerCase())
    );

    const stats = {
        totalSpent: entries?.reduce((acc, curr) => acc + curr.totalValue, 0) || 0,
        totalLiters: entries?.reduce((acc, curr) => acc + curr.liters, 0) || 0,
        avgPrice: entries?.length ? (entries.reduce((acc, curr) => acc + curr.pricePerLiter, 0) / entries.length) : 0,
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FuelIcon className="text-blue-600" />
                        Gestão de Abastecimentos
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Monitoramento em tempo real de consumo e gastos com combustível
                    </p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Gasto</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.totalSpent)}</p>
                    </div>
                </div>
                <div className="glass-card p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                        <Droplets size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Litros</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalLiters.toFixed(2)} L</p>
                    </div>
                </div>
                <div className="glass-card p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600">
                        <Zap size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Preço Médio / L</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.avgPrice)}</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-card p-4 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por placa ou motorista..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border border-transparent">
                        <Calendar size={18} />
                        <span>Este Mês</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border border-transparent">
                        <Filter size={18} />
                        <span>Filtros</span>
                    </button>
                </div>
            </div>

            {/* Data Table */}
            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Veículo</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Motorista</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Data</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">KM</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Liters</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Total</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Pagamento</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={7} className="px-6 py-4">
                                            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredEntries?.map((entry) => (
                                <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                                {entry.vehicle.plate}
                                            </p>
                                            <p className="text-xs text-gray-500">{entry.vehicle.model}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-gray-700 dark:text-gray-300 font-medium">{entry.driver.name}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-gray-500 text-sm">
                                            {format(new Date(entry.date), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-sm text-gray-600 dark:text-gray-400">
                                        {formatKm(entry.km)}
                                    </td>
                                    <td className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-gray-100">
                                        {entry.liters.toFixed(2)} L
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-blue-600 dark:text-blue-400">
                                        {formatCurrency(entry.totalValue)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 text-[10px] font-bold uppercase rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                            {entry.paymentMethod}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
