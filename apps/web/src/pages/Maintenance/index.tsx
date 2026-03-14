import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { Wrench, AlertTriangle, CheckCircle2, Search, LayoutGrid, List as ListIcon, Plus, X, DollarSign, ArrowRight, Clock } from 'lucide-react';
import { GlassCard, StatCard } from '../../components/ui/Cards';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SEO } from '@/components/SEO';
import { formatCurrency, formatKm } from '../../lib/utils';

export function MaintenanceList() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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
        notes: ''
    });

    const maintenanceTypeMap: Record<string, string> = {
        'OIL': 'maintenance.types.OIL',
        'TIRES': 'maintenance.types.TIRES',
        'INSPECTION': 'maintenance.types.INSPECTION',
        'REPAIR': 'maintenance.types.REPAIR',
        'OTHER': 'maintenance.types.OTHER'
    };

    const statusMap: Record<string, string> = {
        'PENDING': 'maintenance.status.PENDING',
        'COMPLETED': 'maintenance.status.COMPLETED',
        'CANCELED': 'maintenance.status.CANCELED'
    };

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
            setFormData({ vehicleId: '', type: 'OIL', nextDueKm: 0, notes: '' });
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
            <Wrench className="w-12 h-12 text-emerald-200 mb-4" />
            <div className="text-lg text-muted-foreground font-medium">{t('common.loading')}</div>
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <SEO 
                title={t('maintenance.title')} 
                description={t('maintenance.description')} 
            />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                        <Wrench size={32} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter gradient-text uppercase">
                            {t('maintenance.header_title')}
                        </h1>
                        <p className="text-muted-foreground/60 font-black uppercase tracking-[0.2em] mt-1 text-[10px]">
                            {t('maintenance.header_subtitle')}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label={t('maintenance.stats.total_records')} value={stats.total} icon={<Wrench className="w-8 h-8" />} />
                <StatCard label={t('maintenance.stats.km_alerts')} value={stats.alertCount} icon={<AlertTriangle className="w-8 h-8" />} variant={stats.alertCount > 0 ? 'warning' : 'default'} />
                <StatCard label={t('maintenance.stats.in_workshop')} value={stats.inWorkshop} icon={<LayoutGrid className="w-8 h-8" />} variant={stats.inWorkshop > 0 ? 'danger' : 'default'} />
                <StatCard label={t('maintenance.stats.total_investment')} value={formatCurrency(stats.totalCost)} icon={<DollarSign className="w-8 h-8" />} variant="info" />
            </div>

            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl w-fit border dark:border-gray-700 shadow-inner">
                <button
                    onClick={() => setActiveTab('maintenances')}
                    className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'maintenances' ? 'bg-white dark:bg-gray-700 shadow-md text-blue-600' : 'text-gray-500'}`}
                >
                    {t('maintenance.tabs.alerts')}
                </button>
                <button
                    onClick={() => setActiveTab('catalog')}
                    className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'catalog' ? 'bg-white dark:bg-gray-700 shadow-md text-blue-600' : 'text-gray-500'}`}
                >
                    {t('maintenance.tabs.catalog')}
                </button>
            </div>

            {activeTab === 'maintenances' ? (
                <>
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-gray-800/20 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                        <div className="flex flex-col md:flex-row gap-4 items-center flex-1 w-full max-w-2xl">
                            <div className="flex items-center gap-3 bg-white dark:bg-gray-800/50 p-2 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex-1 w-full focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
                                <Search size={22} className="text-gray-400 ml-2" />
                                <input
                                    placeholder={t('maintenance.search_placeholder')}
                                    className="bg-transparent outline-none flex-1 py-2 font-medium"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all group"
                            >
                                <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                                {t('maintenance.buttons.new_maintenance')}
                            </button>

                            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border dark:border-gray-700 shadow-sm">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-400'}`}
                                >
                                    <LayoutGrid size={20} />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-400'}`}
                                >
                                    <ListIcon size={20} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {vehiclesInWorkshop.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-primary">
                                <LayoutGrid className="w-6 h-6" /> {t('maintenance.sections.in_workshop')}
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {vehiclesInWorkshop.map((v: any) => (
                                    <GlassCard key={v.id} className="relative overflow-hidden group border-t-4 border-red-500">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 animate-pulse">
                                                <Wrench size={20} />
                                            </div>
                                            <div>
                                                <div className="font-black text-lg text-blue-600 dark:text-blue-400">{v.plate}</div>
                                                <div className="text-[10px] font-bold text-muted-foreground uppercase">{v.model}</div>
                                            </div>
                                        </div>
                                        <div className="text-xs font-bold text-red-500 flex items-center gap-1 uppercase tracking-tighter">
                                            <Clock size={12} /> {t('maintenance.workshop.critical')}
                                        </div>
                                    </GlassCard>
                                ))}
                            </div>
                        </div>
                    )}

                    {alerts.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-amber-500">
                                <AlertTriangle className="w-6 h-6" /> {t('maintenance.sections.preventive_alerts')}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {alerts.map((alert: any) => (
                                    <GlassCard
                                        key={alert.id}
                                        className={`border-l-4 transition-all flex flex-col ${alert.severity === 'CRITICAL' ? 'border-red-500 shadow-lg shadow-red-500/5' : 'border-amber-500'}`}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`p-2.5 rounded-xl ${alert.severity === 'CRITICAL' ? 'bg-red-50 dark:bg-red-900/20 text-red-600' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600'}`}>
                                                <Wrench size={24} />
                                            </div>
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${alert.severity === 'CRITICAL' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'}`}>
                                                {alert.templateName}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-2xl font-black text-gray-900 dark:text-white">{alert.plate}</h3>
                                            <div className="text-[10px] font-bold text-muted-foreground uppercase">{alert.model}</div>
                                        </div>
                                        <div className="space-y-2 mb-4 flex-grow bg-gray-50/50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/5">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-muted-foreground font-medium">{t('maintenance.alerts.current_km')}</span>
                                                <span className="font-bold">{formatKm(alert.kmSinceLast + alert.baseKm)}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-muted-foreground font-medium">{t('maintenance.alerts.planned_km')}</span>
                                                <span className="font-bold">{formatKm(alert.nextMaintenanceKm)}</span>
                                            </div>
                                            <div className="pt-2 border-t dark:border-white/5 mt-2">
                                                <p className={`text-[11px] font-bold uppercase ${alert.severity === 'CRITICAL' ? 'text-red-500' : 'text-amber-600'}`}>
                                                    {alert.message}
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => {
                                                setFormData({
                                                    vehicleId: alert.vehicleId,
                                                    type: 'OTHER', // Fallback or mapping needed
                                                    nextDueKm: alert.nextMaintenanceKm,
                                                    notes: `Gerado por alerta de ${alert.templateName}`
                                                });
                                                setIsCreateModalOpen(true);
                                            }}
                                            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${alert.severity === 'CRITICAL' ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}
                                        >
                                            <Plus size={18} />
                                            {t('maintenance.alerts.start_maintenance')}
                                        </button>
                                    </GlassCard>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                            <CheckCircle2 className="w-6 h-6 text-green-500" /> {t('maintenance.sections.service_history')}
                        </h2>
                        <GlassCard transition={true} className="!p-0 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-800/80 border-b dark:border-gray-700">
                                        <tr>
                                            <th className="px-6 py-4 font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400">{t('maintenance.table.vehicle')}</th>
                                            <th className="px-6 py-4 font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400">{t('maintenance.table.type')}</th>
                                            <th className="px-6 py-4 font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400">{t('maintenance.table.status')}</th>
                                            <th className="px-6 py-4 font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400 text-right">{t('maintenance.table.date_km')}</th>
                                            <th className="px-6 py-4 font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400 text-right">{t('maintenance.table.action')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {maintenances.map((maintenance: any) => (
                                            <tr key={maintenance.id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-all">
                                                <td className="px-6 py-5 font-bold text-blue-600 dark:text-blue-400">{maintenance.vehicle?.plate || '—'}</td>
                                                <td className="px-6 py-5 font-medium">{maintenanceTypeMap[maintenance.type] ? t(maintenanceTypeMap[maintenance.type]) : maintenance.type}</td>
                                                <td className="px-6 py-5">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${maintenance.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                        maintenance.status === 'COMPLETED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                            'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                                        }`}>
                                                        {statusMap[maintenance.status] ? t(statusMap[maintenance.status]) : maintenance.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-right font-medium text-muted-foreground">
                                                    {maintenance.status === 'COMPLETED' ? (
                                                        <div className="flex flex-col items-end">
                                                            <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(maintenance.cost)}</span>
                                                            <span className="text-[10px]">{new Date(maintenance.performedAt).toLocaleDateString('pt-BR')}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-end">
                                                            <span className="font-bold text-orange-600">{formatKm(maintenance.nextDueKm)}</span>
                                                            <span className="text-[10px]">{t('maintenance.table.predicted')}</span>
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
                                                            {t('maintenance.buttons.complete')}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </GlassCard>
                    </div>
                </>
            ) : (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <ListIcon className="text-blue-500" /> {t('maintenance.tabs.catalog')}
                        </h2>
                        <button
                            onClick={() => setIsTemplateModalOpen(true)}
                            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg shadow-blue-500/20 transition-all"
                        >
                            <Plus size={18} /> {t('maintenance.buttons.new_service')}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {templates.map((template: any) => (
                            <GlassCard key={template.id} className="border-t-4 border-blue-500">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg text-blue-600">
                                        <Wrench size={20} />
                                    </div>
                                    <span className="text-[10px] font-black bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded uppercase">
                                        {template.type === 'PREVENTIVE' ? t('maintenance.catalog.preventive') : t('maintenance.catalog.corrective')}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{template.name}</h3>
                                <div className="space-y-2 mb-4 flex-grow">
                                    <div className="flex flex-wrap gap-1">
                                        {template.vehicleTypes.map((vt: string) => (
                                            <span key={vt} className="text-[9px] font-bold bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-500">
                                                {vt}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl space-y-2 mt-3 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">{t('maintenance.catalog.interval')}</span>
                                            <span className="font-bold text-blue-600">{formatKm(template.intervalKm)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">{t('maintenance.catalog.avg_time')}</span>
                                            <span className="font-bold">{template.averageDurationDays} {t('maintenance.catalog.days')}</span>
                                        </div>
                                    </div>
                                    {template.description && (
                                        <p className="text-[10px] text-muted-foreground italic line-clamp-2 mt-2">
                                            "{template.description}"
                                        </p>
                                    )}
                                </div>
                                <div className="flex justify-between items-center mt-3">
                                    <button
                                        onClick={() => {
                                            if (confirm(t('maintenance.catalog.delete_confirm'))) {
                                                api.delete(`/maintenance-templates/${template.id}`).then(() => {
                                                    queryClient.invalidateQueries({ queryKey: ['maintenance-templates'] });
                                                    queryClient.invalidateQueries({ queryKey: ['maintenance-alerts'] });
                                                });
                                            }
                                        }}
                                        className="text-[10px] font-bold text-red-400 hover:text-red-500 uppercase tracking-tighter"
                                    >
                                        {t('maintenance.catalog.delete')}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setFormData({
                                                ...formData,
                                                type: template.type === 'PREVENTIVE' ? 'INSPECTION' : 'REPAIR',
                                                notes: `Baseado no modelo: ${template.name}`
                                            });
                                            setIsCreateModalOpen(true);
                                        }}
                                        className="text-primary hover:underline font-black text-[10px] uppercase tracking-widest"
                                    >
                                        {t('maintenance.catalog.use_template')}
                                    </button>
                                </div>
                            </GlassCard>
                        ))}
                    </div>

                    {templates.length === 0 && (
                        <div className="bg-gray-50 dark:bg-gray-800/20 border border-dashed rounded-3xl py-20 flex flex-col items-center justify-center text-center">
                            <Wrench className="w-12 h-12 text-gray-300 mb-4" />
                            <h3 className="text-xl font-bold text-gray-400">{t('maintenance.catalog.empty')}</h3>
                            <p className="text-muted-foreground max-w-sm mt-2">{t('maintenance.catalog.empty_desc')}</p>
                        </div>
                    )}
                </div >
            )}

            {/* Create Modal */}
            {
                isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="w-full max-w-md bg-background rounded-3xl shadow-2xl border border-border p-6 animate-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold">{t('maintenance.modal.new.title')}</h2>
                                <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={(e) => {
                                e.preventDefault();
                                createMutation.mutate(formData);
                            }} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold ml-1">{t('maintenance.modal.new.vehicle')}</label>
                                    <select
                                        className="w-full p-3 bg-muted/30 border rounded-xl outline-none focus:border-primary"
                                        value={formData.vehicleId}
                                        onChange={e => setFormData({ ...formData, vehicleId: e.target.value })}
                                        required
                                    >
                                        <option value="">{t('maintenance.modal.new.select_vehicle')}</option>
                                        {vehicles.map((v: any) => (
                                            <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold ml-1">{t('maintenance.modal.new.type')}</label>
                                        <select
                                            className="w-full p-3 bg-muted/30 border rounded-xl outline-none focus:border-primary"
                                            value={formData.type}
                                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                                        >
                                            <option value="OIL">{t('maintenance.types.OIL')}</option>
                                            <option value="TIRES">{t('maintenance.types.TIRES')}</option>
                                            <option value="INSPECTION">{t('maintenance.types.INSPECTION')}</option>
                                            <option value="OTHER">{t('maintenance.types.OTHER')}</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold ml-1">{t('maintenance.modal.new.planned_km')}</label>
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
                                    <label className="text-sm font-bold ml-1">{t('maintenance.modal.new.notes')}</label>
                                    <textarea
                                        className="w-full p-3 bg-muted/30 border rounded-xl outline-none focus:border-primary min-h-[100px]"
                                        placeholder={t('maintenance.modal.new.notes_placeholder')}
                                        value={formData.notes}
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={createMutation.isPending}
                                    className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    {createMutation.isPending ? t('maintenance.modal.new.pending') : t('maintenance.modal.new.submit')}
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Complete Modal */}
            {
                isCompleteModalOpen && selectedMaintenance && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="w-full max-w-md bg-background rounded-3xl shadow-2xl border border-border p-6 animate-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold">{t('maintenance.modal.complete.title')}</h2>
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
                                    <div className="text-sm text-muted-foreground uppercase font-bold tracking-wider">{maintenanceTypeMap[selectedMaintenance.type] ? t(maintenanceTypeMap[selectedMaintenance.type]) : selectedMaintenance.type}</div>
                                </div>
                            </div>

                            <form onSubmit={(e) => {
                                e.preventDefault();
                                completeMutation.mutate(completeData);
                            }} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold ml-1 flex items-center gap-1">
                                            <DollarSign size={14} /> {t('maintenance.modal.complete.real_cost')}
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
                                            <ArrowRight size={14} /> {t('maintenance.modal.complete.service_km')}
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
                                    <label className="text-sm font-bold ml-1">{t('maintenance.modal.complete.technical_report')}</label>
                                    <textarea
                                        className="w-full p-3 bg-muted/30 border rounded-xl outline-none focus:border-primary min-h-[100px]"
                                        placeholder={t('maintenance.modal.complete.technical_report_placeholder')}
                                        value={completeData.notes}
                                        onChange={e => setCompleteData({ ...completeData, notes: e.target.value })}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={completeMutation.isPending}
                                    className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    {completeMutation.isPending ? t('maintenance.modal.complete.pending') : t('maintenance.modal.complete.submit')}
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Template Modal */}
            {
                isTemplateModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="w-full max-w-md bg-background rounded-3xl shadow-2xl border border-border p-6 animate-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold">{t('maintenance.modal.catalog.title')}</h2>
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

                                templateMutation.mutate({ name, description, type, averageDurationDays: avgDays, intervalKm, vehicleTypes: selectedTypes });
                            }} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold ml-1">{t('maintenance.modal.catalog.name')}</label>
                                    <input
                                        name="name"
                                        className="w-full p-3 bg-muted/30 border rounded-xl outline-none focus:border-primary"
                                        placeholder={t('maintenance.modal.catalog.name_placeholder')}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold ml-1">{t('maintenance.modal.catalog.description')}</label>
                                    <textarea
                                        name="description"
                                        className="w-full p-3 bg-muted/30 border rounded-xl outline-none focus:border-primary min-h-[60px]"
                                        placeholder={t('maintenance.modal.catalog.description_placeholder')}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold ml-1">{t('maintenance.modal.catalog.vehicle_types')}</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { label: t('maintenance.modal.catalog.types_CAR'), value: 'CAR' },
                                            { label: t('maintenance.modal.catalog.types_TRUCK'), value: 'TRUCK' },
                                            { label: t('maintenance.modal.catalog.types_MOTORCYCLE'), value: 'MOTORCYCLE' },
                                            { label: t('maintenance.modal.catalog.types_MACHINE'), value: 'MACHINE' }
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
                                        <label className="text-sm font-bold ml-1">{t('maintenance.modal.catalog.type')}</label>
                                        <select
                                            name="type"
                                            className="w-full p-3 bg-muted/30 border rounded-xl outline-none focus:border-primary"
                                        >
                                            <option value="PREVENTIVE">{t('maintenance.catalog.preventive')}</option>
                                            <option value="CORRECTIVE">{t('maintenance.catalog.corrective')}</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold ml-1">{t('maintenance.modal.catalog.interval_km')}</label>
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
                                    <label className="text-sm font-bold ml-1">{t('maintenance.modal.catalog.avg_duration')}</label>
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
                                    {templateMutation.isPending ? t('maintenance.modal.catalog.pending') : t('maintenance.modal.catalog.submit')}
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

