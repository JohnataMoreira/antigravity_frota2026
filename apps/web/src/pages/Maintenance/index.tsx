import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { Wrench, AlertTriangle, CheckCircle2, Search, Calendar, LayoutGrid, List as ListIcon, Plus, X, DollarSign, ArrowRight } from 'lucide-react';
import { GlassCard } from '../../components/ui/Cards';
import { useState } from 'react';

export function MaintenanceList() {
    const queryClient = useQueryClient();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
    const [selectedMaintenance, setSelectedMaintenance] = useState<any>(null);

    // Form states
    const [formData, setFormData] = useState({
        vehicleId: '',
        type: 'OIL' as any,
        nextDueKm: 0,
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

    const createMutation = useMutation({
        mutationFn: (data: any) => api.post('/maintenance', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maintenances'] });
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
            setIsCreateModalOpen(false);
            setFormData({ vehicleId: '', type: 'OIL', nextDueKm: 0, notes: '' });
        }
    });

    const completeMutation = useMutation({
        mutationFn: (data: any) => api.post(`/maintenance/${selectedMaintenance.id}/complete`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maintenances'] });
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
            setIsCompleteModalOpen(false);
            setSelectedMaintenance(null);
            setCompleteData({ cost: 0, lastKm: 0, notes: '' });
        }
    });

    const pending = maintenances.filter((m: any) => m.status === 'PENDING');

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
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <Plus size={20} />
                        Nova Manutenção
                    </button>

                    <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl border dark:border-gray-700 shadow-sm">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-md text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Alertas em Grade"
                        >
                            <LayoutGrid size={20} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-md text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Histórico Completo"
                        >
                            <ListIcon size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {pending.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-red-500">
                        <AlertTriangle className="w-6 h-6" /> Alertas Críticos
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pending.map((maintenance: any) => (
                            <GlassCard key={maintenance.id} className="border-l-4 border-red-500/50 hover:border-red-500 transition-all flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-red-50 dark:bg-red-900/20 p-2.5 rounded-xl text-red-600">
                                        <Wrench size={24} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-3 py-1 rounded-full">{maintenance.type}</span>
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{maintenance.vehicle?.plate}</h3>
                                <div className="space-y-2 mb-4 flex-grow">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground font-medium">KM Atual:</span>
                                        <span className="font-bold">{maintenance.vehicle?.currentKm.toLocaleString()} km</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground font-medium">Próxima em:</span>
                                        <span className="font-bold text-red-600">{maintenance.nextDueKm.toLocaleString()} km</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        setSelectedMaintenance(maintenance);
                                        setCompleteData(prev => ({ ...prev, lastKm: maintenance.vehicle?.currentKm || 0 }));
                                        setIsCompleteModalOpen(true);
                                    }}
                                    className="w-full mt-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-200 dark:shadow-none"
                                >
                                    <CheckCircle2 size={18} />
                                    Concluir Serviço
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
                <GlassCard transition={true} className="!p-0 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-4 font-black uppercase tracking-wider text-muted-foreground/80">Veículo</th>
                                    <th className="px-6 py-4 font-black uppercase tracking-wider text-muted-foreground/80">Tipo</th>
                                    <th className="px-6 py-4 font-black uppercase tracking-wider text-muted-foreground/80">Status</th>
                                    <th className="px-6 py-4 font-black uppercase tracking-wider text-muted-foreground/80 text-right">Data / KM</th>
                                    <th className="px-6 py-4 font-black uppercase tracking-wider text-muted-foreground/80 text-right">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {maintenances.map((maintenance: any) => (
                                    <tr key={maintenance.id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-all">
                                        <td className="px-6 py-5 font-bold text-blue-600 dark:text-blue-400">{maintenance.vehicle?.plate || '—'}</td>
                                        <td className="px-6 py-5 font-medium">{maintenance.type}</td>
                                        <td className="px-6 py-5">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${maintenance.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                maintenance.status === 'COMPLETED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                                }`}>
                                                {maintenance.status === 'PENDING' ? 'Pendente' : 'Realizada'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right font-medium text-muted-foreground">
                                            {maintenance.performedAt ?
                                                new Date(maintenance.performedAt).toLocaleDateString('pt-BR') :
                                                maintenance.nextDueKm.toLocaleString() + ' km'
                                            }
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
            </div>

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
                                <div className="text-sm text-muted-foreground uppercase font-bold tracking-wider">{selectedMaintenance.type}</div>
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
        </div>
    );
}
