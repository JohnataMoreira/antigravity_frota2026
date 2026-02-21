import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { Fuel as FuelIcon, Search, Calendar, Zap, DollarSign, Droplets, X } from 'lucide-react';
import { formatCurrency, formatKm } from '../../lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ExportDropdown } from '../../components/ExportDropdown';
import { ExportColumn } from '../../lib/export';

const fuelTypeMap: Record<string, string> = {
    'GASOLINE': 'Gasolina',
    'ETHANOL': 'Etanol',
    'DIESEL': 'Diesel',
    'GNV': 'GNV',
    'OTHER': 'Outro'
};

const paymentMethodMap: Record<string, string> = {
    'CASH': 'Dinheiro',
    'PIX': 'Pix',
    'DEBIT_CARD': 'Débito',
    'CREDIT_CARD': 'Crédito',
    'FUEL_CARD': 'Cartão Combustível',
    'INVOICED': 'Faturado',
    'REIMBURSEMENT': 'Reembolso',
    'PREPAID_CARD': 'Pré-pago',
    'VOUCHER': 'Vale',
    'INTERNAL_TANK': 'Tanque Próprio'
};

const exportColumns: ExportColumn<any>[] = [
    { header: 'Placa', key: 'vehicle', format: (val) => val?.plate || '—' },
    { header: 'Modelo', key: 'vehicle', format: (val) => val?.model || '—' },
    { header: 'Motorista', key: 'driver', format: (val) => val?.name || '—' },
    { header: 'Data', key: 'date', format: (val) => val ? format(new Date(val), "dd/MM/yyyy HH:mm") : '—' },
    { header: 'KM Inicial/Atual', key: 'km', format: (val) => formatKm(val) },
    { header: 'Litros', key: 'liters', format: (val) => `${val.toFixed(2)} L` },
    { header: 'Custo Total', key: 'totalValue', format: (val) => formatCurrency(val) },
    { header: 'Combustível', key: 'fuelType', format: (val) => fuelTypeMap[val] || val },
    { header: 'Pagamento', key: 'paymentMethod', format: (val) => paymentMethodMap[val] || val }
];

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
        id: string;
        plate: string;
        model: string;
    };
    driver: {
        name: string;
    };
}

export function FuelEntriesList() {
    const [search, setSearch] = useState('');
    const [vehicleFilter, setVehicleFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [fuelType, setFuelType] = useState('ALL');

    const { data: entries, isLoading } = useQuery<FuelEntry[]>({
        queryKey: ['fuel-entries'],
        queryFn: async () => {
            const response = await api.get('/fuel');
            return response.data;
        },
    });

    const filteredEntries = useMemo(() => {
        if (!entries) return [];
        return entries.filter(entry => {
            const matchSearch = !search ||
                entry.vehicle.plate.toLowerCase().includes(search.toLowerCase()) ||
                entry.driver.name.toLowerCase().includes(search.toLowerCase());
            const matchVehicle = !vehicleFilter || entry.vehicle.id === vehicleFilter;
            const entryDate = new Date(entry.date);
            const matchFrom = !dateFrom || entryDate >= new Date(dateFrom);
            const matchTo = !dateTo || entryDate <= new Date(dateTo + 'T23:59:59');
            const matchFuelType = fuelType === 'ALL' || entry.fuelType === fuelType;
            return matchSearch && matchVehicle && matchFrom && matchTo && matchFuelType;
        });
    }, [entries, search, vehicleFilter, dateFrom, dateTo, fuelType]);

    // Unique vehicles for the filter
    const uniqueVehicles = useMemo(() => {
        if (!entries) return [];
        const seen = new Set<string>();
        return entries.filter(e => {
            if (seen.has(e.vehicle.id)) return false;
            seen.add(e.vehicle.id);
            return true;
        }).map(e => e.vehicle);
    }, [entries]);



    const stats = {
        totalSpent: entries?.reduce((acc, curr) => acc + curr.totalValue, 0) || 0,
        totalLiters: entries?.reduce((acc, curr) => acc + curr.liters, 0) || 0,
        avgPrice: entries?.length ? (entries.reduce((acc, curr) => acc + curr.pricePerLiter, 0) / entries.length) : 0,
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <FuelIcon className="text-blue-600" />
                        Gestão de Abastecimentos
                    </h1>
                    <p className="text-gray-500 ">
                        Monitoramento em tempo real de consumo e gastos com combustível
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <ExportDropdown
                        data={filteredEntries || []}
                        columns={exportColumns}
                        filename={`Frota2026_Abastecimentos_${new Date().toISOString().split('T')[0]}`}
                        pdfTitle="Relatório de Gastos de Combustível da Frota"
                    />
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center text-green-600">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 ">Total Gasto</p>
                        <p className="text-2xl font-bold text-gray-900 ">{formatCurrency(stats.totalSpent)}</p>
                    </div>
                </div>
                <div className="glass-card p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
                        <Droplets size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 ">Total Litros</p>
                        <p className="text-2xl font-bold text-gray-900 ">{stats.totalLiters.toFixed(2)} L</p>
                    </div>
                </div>
                <div className="glass-card p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
                        <Zap size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 ">Preço Médio / L</p>
                        <p className="text-2xl font-bold text-gray-900 ">{formatCurrency(stats.avgPrice)}</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-card p-4 flex flex-col gap-3">
                <div className="flex flex-col md:flex-row gap-3 items-center">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar por placa ou motorista..."
                            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <select
                        value={vehicleFilter}
                        onChange={e => setVehicleFilter(e.target.value)}
                        className="py-2.5 px-3 bg-gray-50 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    >
                        <option value="">Todos os veículos</option>
                        {uniqueVehicles.map(v => (
                            <option key={v.id} value={v.id}>{v.plate} — {v.model}</option>
                        ))}
                    </select>
                    <select
                        value={fuelType}
                        onChange={e => setFuelType(e.target.value)}
                        className="py-2.5 px-3 bg-gray-50 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    >
                        <option value="ALL">Todos os tipos</option>
                        <option value="GASOLINE">Gasolina</option>
                        <option value="ETHANOL">Etanol</option>
                        <option value="DIESEL">Diesel</option>
                        <option value="GNV">GNV</option>
                        <option value="OTHER">Outro</option>
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400 shrink-0" />
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                        className="py-2 px-3 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                    <span className="text-gray-400 text-sm">até</span>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={e => setDateTo(e.target.value)}
                        className="py-2 px-3 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                    {(dateFrom || dateTo || vehicleFilter || fuelType !== 'ALL' || search) && (
                        <button
                            onClick={() => { setSearch(''); setVehicleFilter(''); setDateFrom(''); setDateTo(''); setFuelType('ALL'); }}
                            className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <X size={14} /> Limpar filtros
                        </button>
                    )}
                </div>
            </div>

            {/* Data Table */}
            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 ">
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Veículo</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Motorista</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Data</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">KM</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Litros</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Total</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Tipo</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Pagamento</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 ">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={8} className="px-6 py-4">
                                            <div className="h-10 bg-gray-200 rounded-lg w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredEntries?.map((entry) => (
                                <tr key={entry.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                {entry.vehicle.plate}
                                            </p>
                                            <p className="text-xs text-gray-500">{entry.vehicle.model}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-gray-700 font-medium">{entry.driver.name}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-gray-500 text-sm">
                                            {format(new Date(entry.date), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-sm text-gray-600 ">
                                        {formatKm(entry.km)}
                                    </td>
                                    <td className="px-6 py-4 text-right font-semibold text-gray-900 ">
                                        {entry.liters.toFixed(2)} L
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-blue-600 ">
                                        {formatCurrency(entry.totalValue)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 text-[10px] font-bold uppercase rounded-md bg-blue-50 text-blue-600 border border-blue-100 ">
                                            {fuelTypeMap[entry.fuelType] || entry.fuelType}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 text-[10px] font-bold uppercase rounded-md bg-gray-100 text-gray-600 ">
                                            {paymentMethodMap[entry.paymentMethod] || entry.paymentMethod}
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

