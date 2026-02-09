import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { useState } from 'react';
import { Map, Search, ClipboardList, CheckCircle2, AlertCircle, X, MapPin, Clock, LayoutGrid, List as ListIcon } from 'lucide-react';
import { GlassCard } from '../../components/ui/Cards';

export function JourneysList() {
    const [filter, setFilter] = useState('');
    const [selectedJourney, setSelectedJourney] = useState<any>(null);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    const { data: journeys = [], isLoading } = useQuery({
        queryKey: ['journeys'],
        queryFn: async () => {
            const res = await api.get('/journeys');
            return res.data;
        }
    });

    const filtered = journeys.filter((j: any) =>
        j.vehicle?.plate?.toLowerCase().includes(filter.toLowerCase()) ||
        j.driver?.name?.toLowerCase().includes(filter.toLowerCase())
    );

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <Map className="w-12 h-12 text-blue-200 mb-4" />
            <div className="text-lg text-muted-foreground font-medium">Carregando jornadas...</div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight gradient-text">
                        Registro de Jornadas
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Acompanhe o histórico de movimentação da sua frota.
                    </p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative group flex-1 max-w-xl w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar por veículo ou motorista..."
                        className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>

                <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl border dark:border-gray-700 shadow-sm">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-md text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                        title="Visualização em Grade"
                    >
                        <LayoutGrid size={20} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-md text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                        title="Visualização em Lista"
                    >
                        <ListIcon size={20} />
                    </button>
                </div>
            </div>

            {viewMode === 'list' ? (
                <GlassCard transition={true} className="!p-0 overflow-hidden">
                    <div className="overflow-x-auto text-foreground">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50/50 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400">Veículo</th>
                                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400">Motorista</th>
                                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400">Status</th>
                                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400">Início / Fim</th>
                                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400 text-right">KM Percorrida</th>
                                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400 text-right">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {filtered.map((journey: any) => (
                                    <tr key={journey.id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all">
                                        <td className="px-6 py-5 font-bold text-blue-600 dark:text-blue-400">{journey.vehicle?.plate || '—'}</td>
                                        <td className="px-6 py-5 font-medium">{journey.driver?.name || '—'}</td>
                                        <td className="px-6 py-5">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${journey.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' :
                                                journey.status === 'COMPLETED' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' :
                                                    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                                }`}>
                                                {journey.status === 'IN_PROGRESS' ? 'Em Jornada' : 'Finalizada'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-muted-foreground font-medium">
                                            <div className="flex flex-col">
                                                <span>{new Date(journey.startTime).toLocaleString('pt-BR')}</span>
                                                {journey.endTime && <span className="text-xs opacity-70">término: {new Date(journey.endTime).toLocaleString('pt-BR')}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right font-bold text-gray-900 dark:text-white">
                                            {journey.endKm ? `${(journey.endKm - journey.startKm).toLocaleString()} km` : '—'}
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            {journey.checklists?.length > 0 && (
                                                <button
                                                    onClick={() => setSelectedJourney(journey)}
                                                    className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl transition-all"
                                                    title="Ver Checklists"
                                                >
                                                    <ClipboardList size={22} />
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filtered.map((journey: any) => (
                        <GlassCard key={journey.id} transition={true} className="group overflow-hidden relative">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 rounded-2xl bg-blue-100/50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                    <Map size={24} />
                                </div>
                                <div>
                                    <div className="text-xl font-black text-blue-600 dark:text-blue-400">{journey.vehicle?.plate || '—'}</div>
                                    <div className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">{journey.vehicle?.model || 'Desconhecido'}</div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase mb-1">Motorista</div>
                                    <div className="font-bold dark:text-white truncate">{journey.driver?.name || '—'}</div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border dark:border-gray-700">
                                        <div className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase mb-1">Km Percorrida</div>
                                        <div className="text-sm font-black text-gray-900 dark:text-white">
                                            {journey.endKm ? `${(journey.endKm - journey.startKm).toLocaleString('pt-BR')} km` : '—'}
                                        </div>
                                    </div>
                                    <div className="p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border dark:border-gray-700">
                                        <div className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase mb-1">Status</div>
                                        <span className={`text-[10px] font-black uppercase ${journey.status === 'IN_PROGRESS' ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'}`}>
                                            {journey.status === 'IN_PROGRESS' ? 'Em Jornada' : 'Finalizada'}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-2 border-t dark:border-gray-700 flex justify-between items-center text-[10px] text-gray-500">
                                    <span>{new Date(journey.startTime).toLocaleDateString('pt-BR')}</span>
                                    {journey.checklists?.length > 0 && (
                                        <button
                                            onClick={() => setSelectedJourney(journey)}
                                            className="text-blue-600 dark:text-blue-400 font-bold hover:underline underline-offset-4"
                                        >
                                            Ver Checklists
                                        </button>
                                    )}
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}

            {/* Checklist Modal */}
            {selectedJourney && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-2xl bg-background rounded-3xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-6 bg-muted/30 border-b">
                            <div>
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    <ClipboardList className="text-primary" />
                                    Auditoria de Checklists
                                </h2>
                                <p className="text-sm text-muted-foreground">Veículo {selectedJourney.vehicle?.plate} • {selectedJourney.driver?.name}</p>
                            </div>
                            <button onClick={() => setSelectedJourney(null)} className="p-2 hover:bg-muted rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {selectedJourney.checklists.sort((a: any, b: any) => a.type === 'CHECKOUT' ? -1 : 1).map((checklist: any) => (
                                    <div key={checklist.id} className="space-y-4">
                                        <div className="flex items-center justify-between pb-2 border-b">
                                            <h3 className="font-black uppercase tracking-widest text-xs text-muted-foreground">
                                                {checklist.type === 'CHECKOUT' ? 'Saída (Início)' : 'Retorno (Fim)'}
                                            </h3>
                                            <span className="text-[10px] font-medium opacity-60">
                                                {new Date(checklist.createdAt).toLocaleString('pt-BR')}
                                            </span>
                                        </div>

                                        <div className="space-y-2">
                                            {checklist.items.map((item: any, idx: number) => (
                                                <div key={idx} className="flex items-start gap-3 p-3 bg-muted/20 rounded-xl border border-border/40">
                                                    {item.status === 'OK' ?
                                                        <CheckCircle2 size={18} className="text-green-500 mt-0.5 shrink-0" /> :
                                                        <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
                                                    }
                                                    <div className="flex-grow">
                                                        <div className="font-bold text-sm">{item.itemId}</div>
                                                        {item.notes && <p className="text-xs text-muted-foreground mt-1 italic">"{item.notes}"</p>}
                                                    </div>
                                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${item.status === 'OK' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {item.status}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-6 bg-muted/30 border-t flex justify-between items-center">
                            <div className="flex gap-4 text-xs font-medium text-muted-foreground">
                                <span className="flex items-center gap-1"><MapPin size={12} /> Localização capturada</span>
                                <span className="flex items-center gap-1"><Clock size={12} /> Timestamp verificado</span>
                            </div>
                            <button
                                onClick={() => setSelectedJourney(null)}
                                className="px-6 py-2 bg-foreground text-background rounded-xl font-bold transition-all hover:opacity-90"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {filtered.length === 0 && (
                <div className="text-center py-20 bg-white/50 dark:bg-gray-800/20 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <p className="text-muted-foreground font-medium">Nenhuma jornada encontrada para os termos buscados.</p>
                </div>
            )}
        </div>
    );
}
