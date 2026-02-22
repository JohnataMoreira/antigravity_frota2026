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
                    <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3 uppercase bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">
                        <div className="p-2 bg-primary rounded-2xl text-primary-foreground shadow-lg shadow-primary/20 shrink-0">
                            <Layers size={32} />
                        </div>
                        Relatórios & BI
                    </h1>
                    <p className="text-muted-foreground/60 font-black uppercase tracking-[0.2em] mt-2 text-[10px]">Inteligência de dados para gestão estratégica da frota</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => handleExport('PDF')}
                        disabled={isExporting}
                        className="flex items-center gap-2 bg-red-500/10 text-red-500 border border-red-500/20 px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-500/20 transition-all disabled:opacity-50 shadow-xl shadow-red-500/5 active:scale-95"
                    >
                        <FileText className="w-5 h-5" />
                        {isExporting ? 'Processando...' : 'Exportar PDF'}
                    </button>
                    <button
                        onClick={() => handleExport('EXCEL')}
                        disabled={isExporting}
                        className="flex items-center gap-2 bg-emerald-500 text-white px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-600 transition-all disabled:opacity-50 shadow-xl shadow-emerald-500/20 active:scale-95"
                    >
                        <Download className="w-5 h-5" />
                        {isExporting ? 'Processando...' : 'Exportar Excel'}
                    </button>
                </div>
            </div>

            {/* Advanced Filters */}
            <div className="bg-card/40 backdrop-blur-sm border border-border/50 p-6 rounded-[32px] grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground/40 block tracking-widest px-1">Período Inicial</label>
                    <div className="relative group">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                        <input
                            type="date"
                            value={filters.start}
                            onChange={e => setFilters(prev => ({ ...prev, start: e.target.value }))}
                            className="w-full bg-muted/30 border border-border/50 rounded-2xl py-3.5 pl-11 pr-4 text-xs font-black uppercase tracking-tight focus:ring-2 focus:ring-primary/50 outline-none transition-all text-foreground"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground/40 block tracking-widest px-1">Período Final</label>
                    <div className="relative group">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                        <input
                            type="date"
                            value={filters.end}
                            onChange={e => setFilters(prev => ({ ...prev, end: e.target.value }))}
                            className="w-full bg-muted/30 border border-border/50 rounded-2xl py-3.5 pl-11 pr-4 text-xs font-black uppercase tracking-tight focus:ring-2 focus:ring-primary/50 outline-none transition-all text-foreground"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground/40 block tracking-widest px-1">Motorista</label>
                    <div className="relative group">
                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                        <select
                            value={filters.driverId}
                            onChange={e => setFilters(prev => ({ ...prev, driverId: e.target.value }))}
                            className="w-full bg-muted/30 border border-border/50 rounded-2xl py-3.5 pl-11 pr-4 text-xs font-black uppercase tracking-tight focus:ring-2 focus:ring-primary/50 outline-none transition-all text-foreground appearance-none"
                        >
                            <option value="">Todos os Motoristas</option>
                            {filterOptions?.drivers.map((d: any) => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground/40 block tracking-widest px-1">Veículo</label>
                    <div className="relative group">
                        <Truck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                        <select
                            value={filters.vehicleId}
                            onChange={e => setFilters(prev => ({ ...prev, vehicleId: e.target.value }))}
                            className="w-full bg-muted/30 border border-border/50 rounded-2xl py-3.5 pl-11 pr-4 text-xs font-black uppercase tracking-tight focus:ring-2 focus:ring-primary/50 outline-none transition-all text-foreground appearance-none"
                        >
                            <option value="">Todos os Veículos</option>
                            {filterOptions?.vehicles.map((v: any) => (
                                <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1.5 bg-card/30 backdrop-blur-sm border border-border/50 rounded-2xl w-fit overflow-x-auto max-w-full no-scrollbar">
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
                            "flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap active:scale-95",
                            activeTab === tab.id
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                : "text-muted-foreground/40 hover:text-foreground hover:bg-muted/50"
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
                            <div className="bg-card/40 backdrop-blur-sm border border-border/50 p-6 rounded-[32px] shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all group">
                                <div className="flex items-center gap-5 mb-6">
                                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                        <FileText size={28} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-[0.2em] mb-1">Resumo Financeiro</p>
                                        <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Investimento em Período</h3>
                                    </div>
                                </div>
                                <div className="p-4 bg-muted/30 border border-border/40 rounded-2xl">
                                    <p className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest mb-1">Manutenção total no ciclo:</p>
                                    <p className="text-3xl font-black text-primary tracking-tighter">{formatCurrency(reportData?.stats?.monthlyCosts || 0)}</p>
                                </div>
                            </div>

                            <div className="bg-card/40 backdrop-blur-sm border border-border/50 p-6 rounded-[32px] shadow-sm hover:shadow-2xl hover:shadow-emerald-500/5 transition-all group">
                                <div className="flex items-center gap-5 mb-6">
                                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                        <TableIcon size={28} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-[0.2em] mb-1">Eficiência Operacional</p>
                                        <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Produtividade da Frota</h3>
                                    </div>
                                </div>
                                <div className="p-4 bg-muted/30 border border-border/40 rounded-2xl">
                                    <p className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest mb-1">Quilometragem total controlada:</p>
                                    <p className="text-3xl font-black text-emerald-500 tracking-tighter">{formatKm(reportData?.stats?.totalKm || 0)}</p>
                                </div>
                            </div>

                            <div className="bg-card/40 backdrop-blur-sm border border-border/50 p-6 rounded-[32px] shadow-sm hover:shadow-2xl hover:shadow-amber-500/5 transition-all group">
                                <div className="flex items-center gap-5 mb-6">
                                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                                        <Filter size={28} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-[0.2em] mb-1">Saúde & Compliance</p>
                                        <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Status de Saúde</h3>
                                    </div>
                                </div>
                                <div className="p-4 bg-muted/30 border border-border/40 rounded-2xl">
                                    <p className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest mb-1">Pendências identificadas em checklists:</p>
                                    <p className="text-3xl font-black text-amber-500 tracking-tighter">{reportData?.stats?.issuesReported || 0}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-card/40 backdrop-blur-sm border border-border/50 rounded-[40px] overflow-hidden shadow-sm">
                            <div className="p-8 border-b border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/20">
                                <div>
                                    <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter">Histórico Detalhado</h3>
                                    <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest mt-1">Análise temporal de custos e rodagem</p>
                                </div>
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
                                        <tr className="bg-muted/50 border-b border-border/50">
                                            <th className="px-8 py-5 text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Mês / Período</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Custos Totais</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">KM Percorrido</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/30">
                                        {reportData?.history?.map((row: any) => (
                                            <tr key={row.name} className="hover:bg-primary/[0.02] transition-colors group">
                                                <td className="px-8 py-6 font-black text-foreground uppercase text-xs tracking-tight group-hover:text-primary transition-colors">{row.name}</td>
                                                <td className="px-8 py-6 text-sm font-black text-primary tracking-tighter">{formatCurrency(row.costs)}</td>
                                                <td className="px-8 py-6 text-sm font-black text-foreground/60 tracking-tighter group-hover:text-foreground transition-colors">{formatKm(row.km)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
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
