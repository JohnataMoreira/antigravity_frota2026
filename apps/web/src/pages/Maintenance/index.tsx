import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { Wrench, AlertTriangle, CheckCircle2, Search, LayoutGrid, List as ListIcon, Plus, X, DollarSign, ArrowRight, Clock, Columns, Filter } from 'lucide-react';
import { GlassCard, StatCard } from '../../components/ui/Cards';
import { useState, useMemo } from 'react';
import { formatCurrency, formatKm } from '../../lib/utils';
import { KanbanBoard } from '../../components/KanbanBoard';
import { Car } from 'lucide-react';
import { ExportDropdown } from '../../components/ExportDropdown';
import { ExportColumn } from '../../lib/export';

const maintenanceTypeMap: Record<string, string> = {
    'OIL': 'Troca de Óleo',
    'TIRES': 'Pneus/Rodagem',
    'INSPECTION': 'Revisão Preventiva',
    'REPAIR': 'Corretiva/Reparo',
    'OTHER': 'Outros Serviços'
};

const statusMap: Record<string, string> = {
    'PENDING': 'Pendente',
    'COMPLETED': 'Concluída',
    'CANCELED': 'Cancelada'
};

const exportColumns: ExportColumn<any>[] = [
    { header: 'Cód Interno', key: 'id', format: (val) => val ? val.split('-')[0].toUpperCase() : '' },
    { header: 'Placa', key: 'vehicle', format: (val) => val?.plate || '—' },
    { header: 'Serviço', key: 'type', format: (val) => maintenanceTypeMap[val] || val },
    { header: 'Status', key: 'status', format: (val) => statusMap[val] || val },
    { header: 'Custo', key: 'cost', format: (val) => val ? formatCurrency(val) : '—' },
    { header: 'Data', key: 'performedAt', format: (val) => val ? new Date(val).toLocaleDateString('pt-BR') : '—' },
    { header: 'Próxima KM', key: 'nextDueKm', format: (val) => val ? formatKm(val) : '—' },
    { header: 'Observações', key: 'notes', format: (val) => val || '-' }
];

export function MaintenanceList() {
    const queryClient = useQueryClient();
    const [viewMode, setViewMode] = useState<'grid' | 'list' | 'kanban'>('grid');
    const [activeTab, setActiveTab] = useState<'maintenances' | 'catalog'>('maintenances');

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
    const [selectedMaintenance, setSelectedMaintenance] = useState<any>(null);

    // Form states
    const [formData, setFormData] = useState({
        vehicleId: '',
        type: 'OIL' as any,
        nextDueKm: 0,
        nextDueDate: '',
        notes: ''
    });

    const [completeData, setCompleteData] = useState({
        cost: 0,
        lastKm: 0,
        notes: ''
    });

    const { data: maintenances = [], isLoading } = useQuery({
        queryKey: ['maintenances'],
        queryFn: async () => {
            const res = await api.get('/maintenance');
            return res.data;
        }
    });

    const { data: vehicles = [] } = useQuery({
        queryKey: ['vehicles'],
        queryFn: async () => {
            const res = await api.get('/vehicles');
            return res.data;
        }
    });

    const { data: templates = [] } = useQuery({
        queryKey: ['maintenance-templates'],
        queryFn: async () => {
            const res = await api.get('/maintenance-templates');
            return res.data;
        }
    });

    const { data: alerts = [], isLoading: loadingAlerts } = useQuery({
        queryKey: ['maintenance-alerts'],
        queryFn: async () => {
            const res = await api.get('/maintenance/alerts');
            return res.data;
        }
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => api.post('/maintenance', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maintenances'] });
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
            queryClient.invalidateQueries({ queryKey: ['maintenance-alerts'] });
            setIsCreateModalOpen(false);
            setFormData({ vehicleId: '', type: 'OIL', nextDueKm: 0, nextDueDate: '', notes: '' });
        }
    });

    const completeMutation = useMutation({
        mutationFn: (data: any) => api.post(`/maintenance/${selectedMaintenance.id}/complete`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maintenances'] });
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
            queryClient.invalidateQueries({ queryKey: ['maintenance-alerts'] });
            setIsCompleteModalOpen(false);
            setSelectedMaintenance(null);
            setCompleteData({ cost: 0, lastKm: 0, notes: '' });
        }
    });

    const templateMutation = useMutation({
        mutationFn: (data: any) => api.post('/maintenance-templates', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maintenance-templates'] });
            queryClient.invalidateQueries({ queryKey: ['maintenance-alerts'] });
            setIsTemplateModalOpen(false);
        }
    });

    const stats = useMemo(() => {
        const total = maintenances.length;
        const alertCount = alerts.length;
        const totalCost = maintenances.reduce((acc: number, m: any) => acc + (m.cost || 0), 0);
        const inWorkshop = vehicles.filter((v: any) => v.status === 'MAINTENANCE').length;

        return { total, alertCount, totalCost, inWorkshop };
    }, [maintenances, vehicles, alerts]);

    const vehiclesInWorkshop = vehicles.filter((v: any) => v.status === 'MAINTENANCE');

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <Wrench className="w-12 h-12 text-muted-foreground/20 mb-4" />
            <div className="text-lg text-muted-foreground font-black uppercase tracking-widest opacity-50">Carregando manutenções...</div>
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter uppercase text-foreground">
                        Gestão de Manutenção
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg font-bold uppercase text-[10px] tracking-[0.2em] opacity-60">
                        Protocolo de Segurança e Durabilidade de Frota
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <ExportDropdown
                        data={maintenances || []}
                        columns={exportColumns}
                        filename={`Frota2026_Manutencoes_${new Date().toISOString().split('T')[0]}`}
                        pdfTitle="Relatório de Manutenções da Frota"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Total de Registros" value={stats.total} icon={<Wrench className="w-8 h-8" />} variant="default" />
                <StatCard label="Alertas de KM" value={stats.alertCount} icon={<AlertTriangle className="w-8 h-8" />} variant={stats.alertCount > 0 ? 'warning' : 'default'} />
                <StatCard label="Veículos na Oficina" value={stats.inWorkshop} icon={<LayoutGrid className="w-8 h-8" />} variant={stats.inWorkshop > 0 ? 'danger' : 'default'} />
                <StatCard label="Investimento (Total)" value={formatCurrency(stats.totalCost)} icon={<DollarSign className="w-8 h-8" />} variant="success" />
            </div>

            <div className="flex items-center gap-1 bg-muted p-1.5 rounded-2xl w-fit border border-border shadow-inner">
                <button
                    onClick={() => setActiveTab('maintenances')}
                    className={`px-6 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${activeTab === 'maintenances' ? 'bg-card shadow-lg text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    Gestão de Alertas
                </button>
                <button
                    onClick={() => setActiveTab('catalog')}
                    className={`px-6 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${activeTab === 'catalog' ? 'bg-card shadow-lg text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    Catálogo de Serviços
                </button>
            </div>

            {activeTab === 'maintenances' ? (
                <>
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-card p-4 rounded-2xl border border-border">
                        <div className="flex flex-col md:flex-row gap-4 items-center flex-1 w-full max-w-4xl">
                            <div className="flex items-center gap-3 bg-background p-2 rounded-xl border border-border flex-1 w-full focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                                <Search size={22} className="text-muted-foreground/40 ml-2" />
                                <input
                                    placeholder="Buscar veículo ou serviço..."
                                    className="bg-transparent outline-none flex-1 py-2 font-bold text-sm"
                                />
                            </div>

                            <div className="flex items-center gap-3 bg-background p-2 rounded-xl border border-border w-full md:w-auto">
                                <input
                                    type="date"
                                    className="bg-transparent border-none outline-none text-xs font-black uppercase text-primary py-1 px-2"
                                    title="Data Inicial"
                                />
                                <span className="text-border">|</span>
                                <input
                                    type="date"
                                    className="bg-transparent border-none outline-none text-xs font-black uppercase text-primary py-1 px-2"
                                    title="Data Final"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
                            >
                                <Plus size={16} />
                                Nova Manutenção
                            </button>
                            <div className="flex items-center gap-1 bg-background p-1 rounded-xl border border-border">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    <LayoutGrid size={18} />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    <ListIcon size={18} />
                                </button>
                                <button
                                    onClick={() => setViewMode('kanban')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    <Columns size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {viewMode === 'kanban' ? (
                        <KanbanBoard
                            items={maintenances}
                            onItemClick={(item) => {
                                setSelectedMaintenance(item);
                                setIsCompleteModalOpen(true);
                            }}
                        />
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {maintenances.map((maintenance: any) => (
                                <GlassCard
                                    key={maintenance.id}
                                    className="group hover:border-primary/40 transition-all border border-border"
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                <Car size={28} />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter leading-none">
                                                    {maintenance.vehicle?.plate || '—'}
                                                </h3>
                                                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1">
                                                    {maintenance.vehicle?.model || 'Modelo não informado'}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${maintenance.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                            maintenance.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                'bg-muted text-muted-foreground border-border'
                                            }`}>
                                            {statusMap[maintenance.status] || maintenance.status}
                                        </span>
                                    </div>

                                    <div className="space-y-4 mb-6">
                                        <div className="flex items-center gap-3 text-sm">
                                            <Wrench size={16} className="text-primary" />
                                            <span className="font-bold text-foreground">{maintenanceTypeMap[maintenance.type] || maintenance.type}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <Clock size={16} className="text-primary" />
                                            <span className="font-medium text-muted-foreground">Realizado em {new Date(maintenance.performedAt).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                        {maintenance.cost > 0 && (
                                            <div className="flex items-center gap-3 text-sm">
                                                <DollarSign size={16} className="text-green-500" />
                                                <span className="font-black text-green-500">{formatCurrency(maintenance.cost)}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-4 border-t border-border flex gap-2">
                                        <button
                                            onClick={() => {
                                                setSelectedMaintenance(maintenance);
                                                setIsCompleteModalOpen(true);
                                            }}
                                            className="flex-1 py-2.5 bg-primary/5 hover:bg-primary/10 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                        >
                                            Ver Detalhes
                                        </button>
                                        <button className="p-2.5 hover:bg-muted rounded-xl text-muted-foreground transition-all">
                                            <ArrowRight size={18} />
                                        </button>
                                    </div>
                                </GlassCard>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-muted/50 border-b border-border">
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Veículo</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Serviço</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Custo</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Data</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {maintenances.map((maintenance: any) => (
                                            <tr key={maintenance.id} className="hover:bg-muted/30 transition-colors group">
                                                <td className="px-6 py-5 font-black text-lg text-primary tracking-tighter uppercase">{maintenance.vehicle?.plate || '—'}</td>
                                                <td className="px-6 py-5 font-bold text-foreground text-xs uppercase tracking-tight">{maintenanceTypeMap[maintenance.type] || maintenance.type}</td>
                                                <td className="px-6 py-5">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${maintenance.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                        maintenance.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                            'bg-muted text-muted-foreground border-border'
                                                        }`}>
                                                        {statusMap[maintenance.status] || maintenance.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 font-black text-green-500">{formatCurrency(maintenance.cost)}</td>
                                                <td className="px-6 py-5 font-medium text-muted-foreground text-sm">{new Date(maintenance.performedAt).toLocaleDateString('pt-BR')}</td>
                                                <td className="px-6 py-5 text-right">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedMaintenance(maintenance);
                                                            setIsCompleteModalOpen(true);
                                                        }}
                                                        className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-all"
                                                    >
                                                        <ArrowRight size={20} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map((template: any) => (
                        <GlassCard key={template.id} className="group hover:border-primary/40 transition-all border border-border">
                            <div className="flex justify-between items-start mb-4">
                                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                    <Wrench size={20} />
                                </div>
                                <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-widest border border-primary/20 ${template.type === 'PREVENTIVE' ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                    {template.type === 'PREVENTIVE' ? 'Preventiva' : 'Corretiva'}
                                </span>
                            </div>
                            <h3 className="text-xl font-black text-foreground mb-2 uppercase tracking-tight">{template.name}</h3>
                            <p className="text-xs text-muted-foreground font-medium mb-6 line-clamp-2">{template.description}</p>
                            <div className="flex items-center justify-between pt-4 border-t border-border">
                                <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest">
                                    <Clock size={14} />
                                    <span>A cada {formatKm(template.intervalKm)}</span>
                                </div>
                                <button className="text-primary hover:underline font-black text-[10px] uppercase tracking-widest">Usar Molde</button>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}

            {/* Create Maintenance Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <GlassCard className="w-full max-w-xl p-8 border border-border shadow-2xl relative">
                        <button
                            onClick={() => setIsCreateModalOpen(false)}
                            className="absolute top-6 right-6 p-2 hover:bg-muted rounded-xl text-muted-foreground transition-all"
                        >
                            <X size={20} />
                        </button>

                        <div className="mb-8">
                            <h2 className="text-3xl font-black text-foreground uppercase tracking-tighter">Registrar Manutenção</h2>
                            <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest mt-1 opacity-60">Inserção de registro no protocolo de frota</p>
                        </div>

                        <form className="space-y-6" onSubmit={(e) => {
                            e.preventDefault();
                            createMutation.mutate(formData);
                        }}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Veículo</label>
                                    <select
                                        className="w-full bg-muted border border-border p-3 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 transition-all font-bold text-sm appearance-none"
                                        value={formData.vehicleId}
                                        onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                                        required
                                    >
                                        <option value="">Selecione um veículo</option>
                                        {vehicles.map((v: any) => (
                                            <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Tipo de Serviço</label>
                                    <select
                                        className="w-full bg-muted border border-border p-3 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 transition-all font-bold text-sm appearance-none"
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                        required
                                    >
                                        {Object.entries(maintenanceTypeMap).map(([key, value]) => (
                                            <option key={key} value={key}>{value}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Próxima KM</label>
                                    <input
                                        type="number"
                                        className="w-full bg-muted border border-border p-3 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 transition-all font-bold text-sm"
                                        placeholder="KM para próxima revisão"
                                        value={formData.nextDueKm}
                                        onChange={(e) => setFormData({ ...formData, nextDueKm: Number(e.target.value) })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Data Prevista</label>
                                    <input
                                        type="date"
                                        className="w-full bg-muted border border-border p-3 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 transition-all font-bold text-sm"
                                        value={formData.nextDueDate}
                                        onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Observações Iniciais</label>
                                <textarea
                                    className="w-full bg-muted border border-border p-3 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 transition-all font-bold text-sm min-h-[100px] resize-none"
                                    placeholder="Detalhes sobre o problema ou serviço solicitado..."
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={createMutation.isPending}
                                className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl shadow-primary/20"
                            >
                                {createMutation.isPending ? 'Registrando...' : 'Criar Registro de Manutenção'}
                            </button>
                        </form>
                    </GlassCard>
                </div>
            )}

            {/* Complete Maintenance Modal */}
            {isCompleteModalOpen && selectedMaintenance && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <GlassCard className="w-full max-w-xl p-8 border border-border shadow-2xl relative">
                        <button
                            onClick={() => {
                                setIsCompleteModalOpen(false);
                                setSelectedMaintenance(null);
                            }}
                            className="absolute top-6 right-6 p-2 hover:bg-muted rounded-xl text-muted-foreground transition-all"
                        >
                            <X size={20} />
                        </button>

                        <div className="mb-8">
                            <h2 className="text-3xl font-black text-foreground uppercase tracking-tighter">Finalizar Manutenção</h2>
                            <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest mt-1 opacity-60">Fechamento de protocolo e registro de custos</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-8 bg-muted/50 p-4 rounded-2xl border border-border">
                            <div className="space-y-1">
                                <span className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest">Veículo</span>
                                <p className="font-black text-primary uppercase">{selectedMaintenance.vehicle?.plate}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest">Serviço</span>
                                <p className="font-black text-foreground uppercase">{maintenanceTypeMap[selectedMaintenance.type]}</p>
                            </div>
                        </div>

                        <form className="space-y-6" onSubmit={(e) => {
                            e.preventDefault();
                            completeMutation.mutate(completeData);
                        }}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Custo Final (R$)</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={18} />
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="w-full bg-muted border border-border pl-10 pr-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 transition-all font-bold text-sm"
                                            placeholder="0,00"
                                            value={completeData.cost}
                                            onChange={(e) => setCompleteData({ ...completeData, cost: Number(e.target.value) })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">KM Atual</label>
                                    <input
                                        type="number"
                                        className="w-full bg-muted border border-border p-3 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 transition-all font-bold text-sm"
                                        placeholder="KM no fechamento"
                                        value={completeData.lastKm}
                                        onChange={(e) => setCompleteData({ ...completeData, lastKm: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Relatório Técnico / Notas</label>
                                <textarea
                                    className="w-full bg-muted border border-border p-3 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 transition-all font-bold text-sm min-h-[120px] resize-none"
                                    placeholder="Descreva o que foi feito, peças trocadas, etc..."
                                    value={completeData.notes}
                                    onChange={(e) => setCompleteData({ ...completeData, notes: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={completeMutation.isPending}
                                className="w-full py-5 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl shadow-green-500/20"
                            >
                                {completeMutation.isPending ? 'Finalizando...' : 'Confirmar Conclusão'}
                            </button>
                        </form>
                    </GlassCard>
                </div>
            )}
        </div>
    );
}
