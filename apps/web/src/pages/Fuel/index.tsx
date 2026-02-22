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
                    <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3 uppercase bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent">
                        <div className="p-2 bg-primary rounded-2xl text-primary-foreground shadow-lg shadow-primary/20 shrink-0">
                            <FuelIcon size={32} />
                        </div>
                        Abastecimentos
                    </h1>
                    <p className="text-muted-foreground/60 font-black uppercase tracking-[0.2em] mt-2 text-[10px]">Monitoramento em tempo real de consumo e gastos com combustível</p>
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
                <div className="bg-card/40 backdrop-blur-sm border border-border/50 p-6 rounded-[32px] flex items-center gap-5 shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all group">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                        <DollarSign size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-[0.2em] mb-1">Total Movimentado</p>
                        <p className="text-3xl font-black text-foreground tracking-tighter">{formatCurrency(stats.totalSpent)}</p>
                    </div>
                </div>
                <div className="bg-card/40 backdrop-blur-sm border border-border/50 p-6 rounded-[32px] flex items-center gap-5 shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all group">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <Droplets size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-[0.2em] mb-1">Volume Total</p>
                        <p className="text-3xl font-black text-foreground tracking-tighter">{stats.totalLiters.toFixed(2)} <span className="text-xs text-muted-foreground/30">LTRS</span></p>
                    </div>
                </div>
                <div className="bg-card/40 backdrop-blur-sm border border-border/50 p-6 rounded-[32px] flex items-center gap-5 shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all group">
                    <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                        <Zap size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-[0.2em] mb-1">Preço Médio Estimado</p>
                        <p className="text-3xl font-black text-foreground tracking-tighter">{formatCurrency(stats.avgPrice)}</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-card/30 backdrop-blur-sm border border-border/50 p-6 rounded-[32px] flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-1 relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar por placa ou motorista..."
                            className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-border/50 rounded-2xl text-[10px] font-black uppercase tracking-tight focus:ring-2 focus:ring-primary/50 outline-none transition-all text-foreground placeholder:text-muted-foreground/20"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <select
                        value={vehicleFilter}
                        onChange={e => setVehicleFilter(e.target.value)}
                        className="py-3 px-4 bg-muted/30 border border-border/50 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground w-full md:w-auto"
                    >
                        <option value="">Todos os veículos</option>
                        {uniqueVehicles.map(v => (
                            <option key={v.id} value={v.id}>{v.plate} — {v.model}</option>
                        ))}
                    </select>
                    <select
                        value={fuelType}
                        onChange={e => setFuelType(e.target.value)}
                        className="py-3 px-4 bg-muted/30 border border-border/50 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground w-full md:w-auto"
                    >
                        <option value="ALL">Todos os tipos</option>
                        <option value="GASOLINE">Gasolina</option>
                        <option value="ETHANOL">Etanol</option>
                        <option value="DIESEL">Diesel</option>
                        <option value="GNV">GNV</option>
                        <option value="OTHER">Outro</option>
                    </select>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-3 bg-muted/30 border border-border/50 px-4 py-1.5 rounded-2xl">
                        <Calendar size={16} className="text-primary shrink-0" />
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={e => setDateFrom(e.target.value)}
                            className="bg-transparent outline-none text-[10px] font-black uppercase py-1 text-foreground"
                        />
                        <span className="text-border text-[10px] font-black">/</span>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={e => setDateTo(e.target.value)}
                            className="bg-transparent outline-none text-[10px] font-black uppercase py-1 text-foreground"
                        />
                    </div>
                    {(dateFrom || dateTo || vehicleFilter || fuelType !== 'ALL' || search) && (
                        <button
                            onClick={() => { setSearch(''); setVehicleFilter(''); setDateFrom(''); setDateTo(''); setFuelType('ALL'); }}
                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 hover:text-red-500 transition-colors bg-red-500/5 px-4 py-2.5 rounded-2xl border border-red-500/10"
                        >
                            <X size={14} /> Limpar Filtros
                        </button>
                    )}
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-card/40 backdrop-blur-sm border border-border/50 rounded-[40px] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-muted/50 border-b border-border/50 ">
                                <th className="px-6 py-5 text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Veículo</th>
                                <th className="px-6 py-5 text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Motorista</th>
                                <th className="px-6 py-5 text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Data</th>
                                <th className="px-6 py-5 text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] text-right">KM</th>
                                <th className="px-6 py-5 text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] text-right">Litros</th>
                                <th className="px-6 py-5 text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] text-right">Total</th>
                                <th className="px-6 py-5 text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Tipo</th>
                                <th className="px-6 py-5 text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Pagamento</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30 ">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={8} className="px-6 py-6">
                                            <div className="h-12 bg-muted/40 rounded-2xl w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredEntries?.map((entry) => (
                                <tr key={entry.id} className="hover:bg-muted/20 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="relative z-10">
                                            <p className="font-black text-lg text-foreground tracking-tighter group-hover:text-primary transition-colors">
                                                {entry.vehicle.plate}
                                            </p>
                                            <p className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-widest">{entry.vehicle.model}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-foreground uppercase text-[10px] font-black tracking-widest">{entry.driver.name}</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-muted-foreground/60 text-[10px] font-black tracking-widest uppercase">
                                            {format(new Date(entry.date), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right font-black text-xs text-muted-foreground/40 tracking-widest">
                                        {formatKm(entry.km)}
                                    </td>
                                    <td className="px-6 py-5 text-right font-black text-lg text-foreground tracking-tighter">
                                        {entry.liters.toFixed(2)} <span className="text-[10px] text-muted-foreground/20">L</span>
                                    </td>
                                    <td className="px-6 py-5 text-right font-black text-xl text-primary tracking-tighter">
                                        {formatCurrency(entry.totalValue)}
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="px-2.5 py-1 text-[9px] font-black uppercase rounded-lg bg-primary/10 text-primary border border-primary/20 tracking-widest">
                                            {fuelTypeMap[entry.fuelType] || entry.fuelType}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="px-2.5 py-1 text-[9px] font-black uppercase rounded-lg bg-muted text-muted-foreground/60 border border-border/50 tracking-widest">
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

