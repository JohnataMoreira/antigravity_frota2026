import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { GlassCard } from '../../components/ui/Cards';
import { Download, FileText, Table as TableIcon, Filter, Layers, Users, Truck, Fuel, Package, Calendar, Search } from 'lucide-react';
import { DriversTab } from './components/DriversTab';
import { VehiclesTab } from './components/VehiclesTab';
import { FuelTab } from './components/FuelTab';
import { FinanceTab } from './components/FinanceTab';
import { InventoryTab } from './components/InventoryTab';
import { ExportActions } from './components/ExportActions';
import { clsx } from 'clsx';
import { formatCurrency, formatKm } from '../../lib/utils';
import { ExportService } from '../../services/exportService';

export default function Reports() {
    const [activeTab, setActiveTab] = useState<'overview' | 'drivers' | 'vehicles' | 'fuel' | 'finance' | 'inventory'>('overview');
    const [isExporting, setIsExporting] = useState(false);

    // Filter State
    const [filters, setFilters] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
        driverId: '',
        vehicleId: ''
    });

    const { data: reportData, isLoading } = useQuery({
        queryKey: ['reports-detailed', filters],
        queryFn: async () => {
            const res = await api.get('/reports/overview', { params: filters });
            return res.data;
        }
    });

    const { data: filterOptions } = useQuery({
        queryKey: ['filter-options'],
        queryFn: async () => {
            const [d, v] = await Promise.all([
                api.get('/users?role=DRIVER'),
                api.get('/vehicles')
            ]);
            return { drivers: d.data, vehicles: v.data };
        }
    });

    const handleExport = async (type: 'PDF' | 'EXCEL') => {
        setIsExporting(true);
        try {
            if (activeTab === 'overview' || activeTab === 'finance') {
                const res = await api.get('/reports/export/expenses', { params: filters });
                const data = res.data;

                if (type === 'PDF') {
                    await ExportService.exportToPDF(
                        'Relatório Financeiro de Frota',
                        data,
                        [
                            { header: 'Data', dataKey: 'date' },
                            { header: 'Categoria', dataKey: 'category' },
                            { header: 'Descrição', dataKey: 'description' },
                            { header: 'Veículo', dataKey: 'vehicle' },
                            { header: 'Custo (R$)', dataKey: 'cost' }
                        ],
                        'relatorio_financeiro'
                    );
                } else {
                    await ExportService.exportToExcel(data, 'relatorio_financeiro');
                }
            } else if (activeTab === 'drivers' || activeTab === 'vehicles') {
                const res = await api.get('/reports/export/journeys', { params: filters });
                const data = res.data;

                if (type === 'PDF') {
                    await ExportService.exportToPDF(
                        'Auditoria de Jornadas',
                        data,
                        [
                            { header: 'Fim', dataKey: 'endTime' },
                            { header: 'Motorista', dataKey: 'driver' },
                            { header: 'Veículo', dataKey: 'vehicle' },
                            { header: 'Distância (KM)', dataKey: 'distance' },
                            { header: 'Incidentes', dataKey: 'incidents' }
                        ],
                        'auditoria_jornadas'
                    );
                } else {
                    await ExportService.exportToExcel(data, 'auditoria_jornadas');
                }
            }
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight gradient-text">Relatórios & BI</h1>
                    <p className="text-muted-foreground mt-2 text-lg">Inteligência de dados para gestão de frota</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => handleExport('PDF')}
                        disabled={isExporting}
                        className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-red-600/20"
                    >
                        <FileText className="w-5 h-5" />
                        {isExporting ? 'Processando...' : 'Exportar PDF'}
                    </button>
                    <button
                        onClick={() => handleExport('EXCEL')}
                        disabled={isExporting}
                        className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-emerald-600/20"
                    >
                        <Download className="w-5 h-5" />
                        {isExporting ? 'Processando...' : 'Exportar Excel'}
                    </button>
                </div>
            </div>

            {/* Advanced Filters */}
            <GlassCard className="grid grid-cols-1 md:grid-cols-4 gap-4 border-primary/20 bg-primary/5">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Período Inicial</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="date"
                            value={filters.start}
                            onChange={e => setFilters(prev => ({ ...prev, start: e.target.value }))}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-primary transition-all outline-none"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Período Final</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="date"
                            value={filters.end}
                            onChange={e => setFilters(prev => ({ ...prev, end: e.target.value }))}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-primary transition-all outline-none"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Motorista</label>
                    <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <select
                            value={filters.driverId}
                            onChange={e => setFilters(prev => ({ ...prev, driverId: e.target.value }))}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-primary transition-all outline-none appearance-none"
                        >
                            <option value="">Todos os Motoristas</option>
                            {filterOptions?.drivers.map((d: any) => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Veículo</label>
                    <div className="relative">
                        <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <select
                            value={filters.vehicleId}
                            onChange={e => setFilters(prev => ({ ...prev, vehicleId: e.target.value }))}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-primary transition-all outline-none appearance-none"
                        >
                            <option value="">Todos os Veículos</option>
                            {filterOptions?.vehicles.map((v: any) => (
                                <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </GlassCard>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-white/5 rounded-xl w-fit">
                {[
                    { id: 'overview', label: 'Visão Geral', icon: Layers },
                    { id: 'drivers', label: 'Motoristas', icon: Users },
                    { id: 'vehicles', label: 'Veículos', icon: Truck },
                    { id: 'fuel', label: 'Combustível', icon: Fuel },
                    { id: 'inventory', label: 'Estoque', icon: Package },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={clsx(
                            "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all",
                            activeTab === tab.id
                                ? "bg-primary text-white shadow-lg"
                                : "text-muted-foreground hover:bg-white/5 hover:text-white"
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <GlassCard>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-blue-500/20 rounded-lg text-blue-500">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-bold">Resumo Financeiro</h3>
                                </div>
                                <p className="text-muted-foreground text-sm mb-4">Total investido em manutenção no período:</p>
                                <p className="text-3xl font-bold text-primary">{formatCurrency(reportData?.stats?.monthlyCosts || 0)}</p>
                            </GlassCard>

                            <GlassCard>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-green-500/20 rounded-lg text-green-500">
                                        <TableIcon className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-bold">Eficiência</h3>
                                </div>
                                <p className="text-muted-foreground text-sm mb-4">Quilometragem total controlada:</p>
                                <p className="text-3xl font-bold text-primary">{formatKm(reportData?.stats?.totalKm || 0)}</p>
                            </GlassCard>

                            <GlassCard>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-amber-500/20 rounded-lg text-amber-500">
                                        <Filter className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-bold">Status de Saúde</h3>
                                </div>
                                <p className="text-muted-foreground text-sm mb-4">Pendências identificadas em checklists:</p>
                                <p className="text-3xl font-bold text-primary">{reportData?.stats?.issuesReported || 0}</p>
                            </GlassCard>
                        </div>

                        <GlassCard>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold">Histórico Detalhado</h3>
                                <ExportActions
                                    data={reportData?.history || []}
                                    filename="relatorio_geral"
                                    title="Relatório Geral de Custos e Quilometragem"
                                    columns={[
                                        { header: 'Mês', dataKey: 'name' },
                                        { header: 'Custos (R$)', dataKey: 'costs' },
                                        { header: 'Distância (KM)', dataKey: 'km' }
                                    ]}
                                />
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-white/10">
                                            <th className="pb-4 font-bold">Mês</th>
                                            <th className="pb-4 font-bold">Custos</th>
                                            <th className="pb-4 font-bold">Km Percorrido</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {reportData?.history?.map((row: any) => (
                                            <tr key={row.name} className="hover:bg-white/5 transition-colors">
                                                <td className="py-4">{row.name}</td>
                                                <td className="py-4 font-bold">{formatCurrency(row.costs)}</td>
                                                <td className="py-4 font-bold">{formatKm(row.km)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </GlassCard>
                    </div>
                )}

                {activeTab === 'drivers' && <DriversTab filters={filters} />}
                {activeTab === 'vehicles' && <VehiclesTab filters={filters} />}
                {activeTab === 'fuel' && <FuelTab filters={filters} />}
                {activeTab === 'finance' && <FinanceTab filters={filters} />}
                {activeTab === 'inventory' && <InventoryTab />}
            </div>
        </div>
    );
}
