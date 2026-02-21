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
            <Wrench className="w-12 h-12 text-purple-200 mb-4" />
            <div className="text-lg text-muted-foreground font-medium">Carregando manutenções...</div>
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight gradient-text">
                        Gestão de Manutenção
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Garantindo a segurança e durabilidade da frota.
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
                <StatCard label="Total de Registros" value={stats.total} icon={<Wrench className="w-8 h-8" />} />
                <StatCard label="Alertas de KM" value={stats.alertCount} icon={<AlertTriangle className="w-8 h-8" />} variant={stats.alertCount > 0 ? 'warning' : 'default'} />
                <StatCard label="Veículos na Oficina" value={stats.inWorkshop} icon={<LayoutGrid className="w-8 h-8" />} variant={stats.inWorkshop > 0 ? 'danger' : 'default'} />
                <StatCard label="Investimento (Total)" value={formatCurrency(stats.totalCost)} icon={<DollarSign className="w-8 h-8" />} variant="info" />
            </div>

            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-2xl w-fit border shadow-inner">
                <button
                    onClick={() => setActiveTab('maintenances')}
                    className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'maintenances' ? 'bg-white shadow-md text-blue-600' : 'text-gray-500'}`}
                >
                    Gestão de Alertas
                </button>
                <button
                    onClick={() => setActiveTab('catalog')}
                    className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'catalog' ? 'bg-white shadow-md text-blue-600' : 'text-gray-500'}`}
                >
                    Catálogo de Serviços
                </button>
            </div>

            {activeTab === 'maintenances' ? (
                <>
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex flex-col md:flex-row gap-4 items-center flex-1 w-full max-w-4xl">
                            <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-100 shadow-sm flex-1 w-full focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
                                <Search size={22} className="text-gray-400 ml-2" />
                                <input
                                    placeholder="Buscar veículo ou serviço..."
                                    className="bg-transparent outline-none flex-1 py-2 font-medium"
                                />
                            </div>

                            <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-100 shadow-sm w-full md:w-auto">
                                <input
                                    type="date"
                                    className="bg-transparent outline-none text-xs font-bold py-1 px-2"
                                    title="Data Inicial"
                                />
                                <span className="text-gray-300">|</span>
                                <input
                                    type="date"
                                    className="bg-transparent outline-none text-xs font-bold py-1 px-2"
                                    title="Data Final"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all group"
                            >
                                <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                                Nova Manutenção
                            </button>

                            <div className="flex bg-gray-100 p-1.5 rounded-xl border shadow-sm">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white shadow-md text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                                    title="Visualização em Grade"
                                >
                                    <LayoutGrid size={20} />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white shadow-md text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                                    title="Visualização em Lista"
                                >
                                    <ListIcon size={20} />
                                </button>
                                <button
                                    onClick={() => setViewMode('kanban')}
                                    className={`p-2.5 rounded-xl transition-all ${viewMode === 'kanban' ? 'bg-white shadow-md text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                                    title="Visualização em Kanban"
                                >
                                    <Columns size={20} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {viewMode === 'kanban' ? (
                        <KanbanBoard
                            columns={[
                                { id: 'SCHEDULED', title: 'Alertas / Agendados', count: 0, color: 'bg-amber-500' },
                                { id: 'IN_PROGRESS', title: 'Em Manutenção', count: 0, color: 'bg-blue-500' },
                                { id: 'COMPLETED', title: 'Concluídos', count: 0, color: 'bg-green-500' },
                            ]}
                            items={[
                                ...alerts.map((a: any) => ({ ...a, kanbanType: 'ALERT' })),
                                ...maintenances.map((m: any) => ({ ...m, kanbanType: 'MAINTENANCE' }))
                            ]}
                            getItemColumnId={(item: any) => {
                                if (item.kanbanType === 'ALERT') return 'SCHEDULED';
                                if (item.status === 'COMPLETED') return 'COMPLETED';
                                if (item.vehicle?.status === 'MAINTENANCE' || vehicles.find((v: any) => v.id === item.vehicleId)?.status === 'MAINTENANCE') return 'IN_PROGRESS';
                                return 'SCHEDULED';
                            }}
                            renderCard={(item: any) => (
                                <GlassCard
                                    key={item.id}
                                    className={`p-4 rounded-xl border transition-all group bg-white ${item.kanbanType === 'ALERT' ? 'border-l-4 border-l-amber-500' : ''}`}
                                    onClick={() => {
                                        if (item.kanbanType === 'ALERT') {
                                            setFormData({
                                                vehicleId: item.vehicleId,
                                                type: 'OTHER',
                                                nextDueKm: item.nextMaintenanceKm,
                                                nextDueDate: item.nextMaintenanceDate
                                                    ? new Date(item.nextMaintenanceDate).toISOString().split('T')[0]
                                                    : '',
                                                notes: `Gerado por alerta de ${item.templateName}`
                                            });
                                            setIsCreateModalOpen(true);
                                        } else if (item.status === 'PENDING') {
                                            setSelectedMaintenance(item);
                                            setCompleteData(prev => ({ ...prev, lastKm: item.vehicle?.currentKm || 0 }));
                                            setIsCompleteModalOpen(true);
                                        }
                                    }}
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={`p-2 rounded-lg ${item.kanbanType === 'ALERT' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                                            <Wrench size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-black text-blue-600 text-sm truncate uppercase tracking-tighter">
                                                {item.plate || item.vehicle?.plate}
                                            </h4>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase truncate">
                                                {item.templateName || maintenanceTypeMap[item.type] || item.type}
                                            </p>
                                        </div>
                                    </div>
                                    {item.kanbanType === 'ALERT' ? (
                                        <div className="bg-amber-50/50 p-2 rounded-lg border border-amber-100 mb-2">
                                            <p className="text-[10px] font-bold text-amber-700 uppercase leading-tight">
                                                {item.message}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-center text-[10px] mb-2 font-bold text-gray-400 uppercase">
                                            <span>KM: {item.status === 'COMPLETED' ? formatKm(item.lastKm) : formatKm(item.nextDueKm)}</span>
                                            {item.performedAt && <span>{new Date(item.performedAt).toLocaleDateString('pt-BR')}</span>}
                                        </div>
                                    )}
                                    <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-[10px] font-black text-blue-600 uppercase">Ver detalhes →</span>
                                    </div>
                                </GlassCard>
                            )}
                        />
                    ) : (
                        <>
                            {vehiclesInWorkshop.length > 0 && (
                                <div className="space-y-4">
                                    <h2 className="text-xl font-bold flex items-center gap-2 text-primary">
                                        <LayoutGrid className="w-6 h-6" /> Veículos na Oficina
                                    </h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                        {vehiclesInWorkshop.map((v: any) => (
                                            <GlassCard key={v.id} className="relative overflow-hidden group border-t-4 border-red-500">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 animate-pulse">
                                                        <Wrench size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-lg text-blue-600 ">{v.plate}</div>
                                                        <div className="text-[10px] font-bold text-muted-foreground uppercase">{v.model}</div>
                                                    </div>
                                                </div>
                                                <div className="text-xs font-bold text-red-500 flex items-center gap-1 uppercase tracking-tighter">
                                                    <Clock size={12} /> Em Manutenção Crítica
                                                </div>
                                            </GlassCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {alerts.length > 0 && (
                                <div className="space-y-4">
                                    <h2 className="text-xl font-bold flex items-center gap-2 text-amber-500">
                                        <AlertTriangle className="w-6 h-6" /> Alertas Preventivos
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {alerts.map((alert: any) => (
                                            <GlassCard
                                                key={alert.id}
                                                className={`border-l-4 transition-all flex flex-col ${alert.severity === 'CRITICAL' ? 'border-red-500 shadow-lg shadow-red-500/5' : 'border-amber-500'}`}
                                            >
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className={`p-2.5 rounded-xl ${alert.severity === 'CRITICAL' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                                                        <Wrench size={24} />
                                                    </div>
                                                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${alert.severity === 'CRITICAL' ? 'bg-red-100 text-red-700 ' : 'bg-amber-100 text-amber-700 '}`}>
                                                        {alert.templateName}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="text-2xl font-black text-gray-900 ">{alert.plate}</h3>
                                                    <div className="text-[10px] font-bold text-muted-foreground uppercase">{alert.model}</div>
                                                </div>
                                                <div className="space-y-2 mb-4 flex-grow bg-gray-50/50 p-3 rounded-xl border border-gray-100 ">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-muted-foreground font-medium">KM Atual:</span>
                                                        <span className="font-bold">{formatKm(alert.kmSinceLast + alert.baseKm)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-muted-foreground font-medium">Planificado:</span>
                                                        <span className="font-bold">{formatKm(alert.nextMaintenanceKm)}</span>
                                                    </div>
                                                    <div className="pt-2 border-t mt-2">
                                                        <p className={`text-[11px] font-bold uppercase ${alert.severity === 'CRITICAL' ? 'text-red-500' : 'text-amber-600'}`}>
                                                            {alert.message}
                                                        </p>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        setFormData({
                                                            vehicleId: alert.vehicleId,
                                                            type: 'OTHER',
                                                            nextDueKm: alert.nextMaintenanceKm,
                                                            nextDueDate: alert.nextMaintenanceDate
                                                                ? new Date(alert.nextMaintenanceDate).toISOString().split('T')[0]
                                                                : '',
                                                            notes: `Gerado por alerta de ${alert.templateName}`
                                                        });
                                                        setIsCreateModalOpen(true);
                                                    }}
                                                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${alert.severity === 'CRITICAL' ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}
                                                >
                                                    <Plus size={18} />
                                                    Iniciar Manutenção
                                                </button>
                                            </GlassCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                                    <CheckCircle2 className="w-6 h-6 text-green-500" /> Histórico de Serviços
                                </h2>
                                {viewMode === 'list' ? (
                                    <GlassCard transition={true} className="!p-0 overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-gray-50 border-b ">
                                                    <tr>
                                                        <th className="px-6 py-4 font-bold uppercase tracking-wider text-gray-400 ">Veículo</th>
                                                        <th className="px-6 py-4 font-bold uppercase tracking-wider text-gray-400 ">Tipo</th>
                                                        <th className="px-6 py-4 font-bold uppercase tracking-wider text-gray-400 ">Status</th>
                                                        <th className="px-6 py-4 font-bold uppercase tracking-wider text-gray-400 text-right">Data / KM</th>
                                                        <th className="px-6 py-4 font-bold uppercase tracking-wider text-gray-400 text-right">Ação</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 ">
                                                    {maintenances.map((maintenance: any) => (
                                                        <tr key={maintenance.id} className="group hover:bg-gray-50/50 transition-all">
                                                            <td className="px-6 py-5 font-bold text-blue-600 ">{maintenance.vehicle?.plate || '—'}</td>
                                                            <td className="px-6 py-5 font-medium">{maintenanceTypeMap[maintenance.type] || maintenance.type}</td>
                                                            <td className="px-6 py-5">
                                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${maintenance.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 ' :
                                                                    maintenance.status === 'COMPLETED' ? 'bg-green-100 text-green-700 ' :
                                                                        'bg-gray-100 text-gray-700 '
                                                                    }`}>
                                                                    {statusMap[maintenance.status] || maintenance.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-5 text-right font-medium text-muted-foreground">
                                                                {maintenance.status === 'COMPLETED' ? (
                                                                    <div className="flex flex-col items-end">
                                                                        <span className="font-bold text-gray-900 ">{formatCurrency(maintenance.cost)}</span>
                                                                        <span className="text-[10px]">{new Date(maintenance.performedAt).toLocaleDateString('pt-BR')}</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex flex-col items-end">
                                                                        <span className="font-bold text-orange-600 ">{formatKm(maintenance.nextDueKm)}</span>
                                                                        <span className="text-[10px]">PREVISTA</span>
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-5 text-right">
                                                                {maintenance.status === 'PENDING' && (
                                                                    <button
                                                                        onClick={() => {
                                                                            setSelectedMaintenance(maintenance);
                                                                            setCompleteData(prev => ({ ...prev, lastKm: maintenance.vehicle?.currentKm || 0 }));
                                                                            setIsCompleteModalOpen(true);
                                                                        }}
                                                                        className="text-primary hover:underline font-bold"
                                                                    >
                                                                        Concluir
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </GlassCard>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {maintenances.map((maintenance: any) => (
                                            <GlassCard key={maintenance.id} transition={true}>
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                                                        <Wrench size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-lg text-blue-600 ">{maintenance.vehicle?.plate || '—'}</div>
                                                        <div className="text-xs font-bold text-muted-foreground uppercase">{maintenanceTypeMap[maintenance.type] || maintenance.type}</div>
                                                    </div>
                                                </div>
                                                <div className="space-y-2 mb-4">
                                                    <div className="flex justify-between text-xs font-bold uppercase text-gray-400">
                                                        <span>Status</span>
                                                        <span className={maintenance.status === 'COMPLETED' ? 'text-green-600' : 'text-yellow-600'}>
                                                            {statusMap[maintenance.status] || maintenance.status}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between text-xs font-bold uppercase text-gray-400">
                                                        <span>{maintenance.status === 'COMPLETED' ? 'Custo' : 'KM Prevista'}</span>
                                                        <span className="text-gray-900">
                                                            {maintenance.status === 'COMPLETED' ? formatCurrency(maintenance.cost) : formatKm(maintenance.nextDueKm)}
                                                        </span>
                                                    </div>
                                                </div>
                                                {maintenance.status === 'PENDING' && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedMaintenance(maintenance);
                                                            setCompleteData(prev => ({ ...prev, lastKm: maintenance.vehicle?.currentKm || 0 }));
                                                            setIsCompleteModalOpen(true);
                                                        }}
                                                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all"
                                                    >
                                                        Concluir
                                                    </button>
                                                )}
                                            </GlassCard>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </>
            ) : (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <ListIcon className="text-blue-500" /> Catálogo de Serviços
                        </h2>
                        <button
                            onClick={() => setIsTemplateModalOpen(true)}
                            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg shadow-blue-500/20 transition-all"
                        >
                            <Plus size={18} /> Cadastrar Novo Serviço
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {templates.map((template: any) => (
                            <GlassCard key={template.id} className="border-t-4 border-blue-500">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                                        <Wrench size={20} />
                                    </div>
                                    <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2 py-1 rounded uppercase">
                                        {template.type === 'PREVENTIVE' ? 'Preventiva' : 'Corretiva'}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">{template.name}</h3>
                                <div className="space-y-2 mb-4 flex-grow">
                                    <div className="flex flex-wrap gap-1">
                                        {template.vehicleTypes.map((vt: string) => (
                                            <span key={vt} className="text-[9px] font-bold bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">
                                                {vt}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-xl space-y-2 mt-3 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Intervalo:</span>
                                            <span className="font-bold text-blue-600">{formatKm(template.intervalKm)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Tempo Médio:</span>
                                            <span className="font-bold">{template.averageDurationDays} dias</span>
                                        </div>
                                    </div>
                                    {template.description && (
                                        <p className="text-[10px] text-muted-foreground italic line-clamp-2 mt-2">
                                            "{template.description}"
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={() => {
                                        if (confirm('Deseja excluir este serviço do catálogo?')) {
                                            api.delete(`/maintenance-templates/${template.id}`).then(() => {
                                                queryClient.invalidateQueries({ queryKey: ['maintenance-templates'] });
                                                queryClient.invalidateQueries({ queryKey: ['maintenance-alerts'] });
                                            });
                                        }
                                    }}
                                    className="text-[10px] font-bold text-red-400 hover:text-red-500 uppercase tracking-tighter self-end"
                                >
                                    Excluir
                                </button>
                            </GlassCard>
                        ))}
                    </div>

                    {templates.length === 0 && (
                        <div className="bg-gray-50 border border-dashed rounded-3xl py-20 flex flex-col items-center justify-center text-center">
                            <Wrench className="w-12 h-12 text-gray-300 mb-4" />
                            <h3 className="text-xl font-bold text-gray-400">Nenhum serviço catalogado</h3>
                            <p className="text-muted-foreground max-w-sm mt-2">Cadastre os tipos de manutenção frequentes para agilizar o agendamento da sua frota.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-background rounded-3xl shadow-2xl border border-border p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Nova Manutenção</h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={(e) => {
                            e.preventDefault();
                            createMutation.mutate(formData);
                        }} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold ml-1">Veículo</label>
                                <select
                                    className="w-full p-3 bg-muted/30 border rounded-xl outline-none focus:border-primary"
                                    value={formData.vehicleId}
                                    onChange={e => setFormData({ ...formData, vehicleId: e.target.value })}
                                    required
                                >
                                    <option value="">Selecione um veículo</option>
                                    {vehicles.map((v: any) => (
                                        <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold ml-1">Tipo</label>
                                    <select
                                        className="w-full p-3 bg-muted/30 border rounded-xl outline-none focus:border-primary"
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="OIL">Troca de Óleo</option>
                                        <option value="TIRES">Pneus</option>
                                        <option value="INSPECTION">Inspeção</option>
                                        <option value="OTHER">Outros</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold ml-1">Prevista para (KM)</label>
                                    <input
                                        type="number"
                                        className="w-full p-3 bg-muted/30 border rounded-xl outline-none focus:border-primary"
                                        placeholder="0"
                                        value={formData.nextDueKm}
                                        onChange={e => setFormData({ ...formData, nextDueKm: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold ml-1">Data Prevista (Opcional)</label>
                                <input
                                    type="date"
                                    className="w-full p-3 bg-muted/30 border rounded-xl outline-none focus:border-primary"
                                    value={formData.nextDueDate}
                                    onChange={e => setFormData({ ...formData, nextDueDate: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold ml-1">Observações</label>
                                <textarea
                                    className="w-full p-3 bg-muted/30 border rounded-xl outline-none focus:border-primary min-h-[100px]"
                                    placeholder="Detalhes do serviço planejado..."
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={createMutation.isPending}
                                className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {createMutation.isPending ? 'Agendando...' : 'Agendar Manutenção'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Complete Modal */}
            {isCompleteModalOpen && selectedMaintenance && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-background rounded-3xl shadow-2xl border border-border p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Concluir Serviço</h2>
                            <button onClick={() => setIsCompleteModalOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="mb-6 p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center gap-4">
                            <div className="bg-primary/20 p-3 rounded-xl text-primary">
                                <Wrench size={24} />
                            </div>
                            <div>
                                <div className="font-black text-lg">{selectedMaintenance.vehicle?.plate}</div>
                                <div className="text-sm text-muted-foreground uppercase font-bold tracking-wider">{maintenanceTypeMap[selectedMaintenance.type] || selectedMaintenance.type}</div>
                            </div>
                        </div>

                        <form onSubmit={(e) => {
                            e.preventDefault();
                            completeMutation.mutate(completeData);
                        }} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold ml-1 flex items-center gap-1">
                                        <DollarSign size={14} /> Custo Real
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full p-3 bg-muted/30 border rounded-xl outline-none focus:border-primary"
                                        placeholder="0,00"
                                        value={completeData.cost}
                                        onChange={e => setCompleteData({ ...completeData, cost: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold ml-1 flex items-center gap-1">
                                        <ArrowRight size={14} /> KM do Serviço
                                    </label>
                                    <input
                                        type="number"
                                        className="w-full p-3 bg-muted/30 border rounded-xl outline-none focus:border-primary"
                                        placeholder="0"
                                        value={completeData.lastKm}
                                        onChange={e => setCompleteData({ ...completeData, lastKm: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold ml-1">Relatório Técnico</label>
                                <textarea
                                    className="w-full p-3 bg-muted/30 border rounded-xl outline-none focus:border-primary min-h-[100px]"
                                    placeholder="Descreva o que foi realizado..."
                                    value={completeData.notes}
                                    onChange={e => setCompleteData({ ...completeData, notes: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={completeMutation.isPending}
                                className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {completeMutation.isPending ? 'Finalizando...' : 'Confirmar Conclusão'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Template Modal */}
            {isTemplateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-background rounded-3xl shadow-2xl border border-border p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Novo Serviço no Catálogo</h2>
                            <button onClick={() => setIsTemplateModalOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const form = e.target as HTMLFormElement;
                            const name = (form.elements.namedItem('name') as HTMLInputElement).value;
                            const description = (form.elements.namedItem('description') as HTMLTextAreaElement).value;
                            const type = (form.elements.namedItem('type') as HTMLSelectElement).value;
                            const avgDays = Number((form.elements.namedItem('avgDays') as HTMLInputElement).value);
                            const intervalKm = Number((form.elements.namedItem('intervalKm') as HTMLInputElement).value);

                            // Get selected vehicle types
                            const selectedTypes = Array.from(form.querySelectorAll('input[name="vehicleTypes"]:checked'))
                                .map((cb: any) => cb.value);

                            if (selectedTypes.length === 0) {
                                alert('Selecione pelo menos um tipo de veículo');
                                return;
                            }

                            const intervalMonths = Number((form.elements.namedItem('intervalMonths') as HTMLInputElement)?.value || 12);

                            templateMutation.mutate({ name, description, type, averageDurationDays: avgDays, intervalKm, intervalMonths, vehicleTypes: selectedTypes });
                        }} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold ml-1">Nome do Serviço</label>
                                <input
                                    name="name"
                                    className="w-full p-3 bg-muted/30 border rounded-xl outline-none focus:border-primary"
                                    placeholder="Ex: Troca de Óleo, Revisão de Freios..."
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold ml-1">Descrição (Opcional)</label>
                                <textarea
                                    name="description"
                                    className="w-full p-3 bg-muted/30 border rounded-xl outline-none focus:border-primary min-h-[60px]"
                                    placeholder="Detalhes sobre o que este plano cobre..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold ml-1">Tipos de Veículo</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { label: 'Carro', value: 'CAR' },
                                        { label: 'Caminhão', value: 'TRUCK' },
                                        { label: 'Moto', value: 'MOTORCYCLE' },
                                        { label: 'Máquina', value: 'MACHINE' }
                                    ].map((type) => (
                                        <label key={type.value} className="flex items-center gap-2 p-2 border rounded-lg hover:bg-muted/50 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                name="vehicleTypes"
                                                value={type.value}
                                                className="w-4 h-4 text-blue-600 rounded bg-gray-100 border-gray-300 focus:ring-blue-500"
                                            />
                                            <span className="text-sm font-medium">{type.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold ml-1">Tipo</label>
                                    <select
                                        name="type"
                                        className="w-full p-3 bg-muted/30 border rounded-xl outline-none focus:border-primary"
                                    >
                                        <option value="PREVENTIVE">Preventiva</option>
                                        <option value="CORRECTIVE">Corretiva</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold ml-1">Intervalo (KM)</label>
                                    <input
                                        name="intervalKm"
                                        type="number"
                                        className="w-full p-3 bg-muted/30 border rounded-xl outline-none focus:border-primary"
                                        defaultValue={10000}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold ml-1">Intervalo (Meses) — Opcional</label>
                                <input
                                    name="intervalMonths"
                                    type="number"
                                    className="w-full p-3 bg-muted/30 border rounded-xl outline-none focus:border-primary"
                                    placeholder="Ex: 12 para anual"
                                    defaultValue={12}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold ml-1">Duração Média (Dias)</label>
                                <input
                                    name="avgDays"
                                    type="number"
                                    className="w-full p-3 bg-muted/30 border rounded-xl outline-none focus:border-primary"
                                    defaultValue={1}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={templateMutation.isPending}
                                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:scale-[1.02] transition-all disabled:opacity-50"
                            >
                                {templateMutation.isPending ? 'Salvando...' : 'Cadastrar Serviço'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

