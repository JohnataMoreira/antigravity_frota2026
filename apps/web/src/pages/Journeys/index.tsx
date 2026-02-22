import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, Search, ClipboardList, CheckCircle2, AlertCircle, X, MapPin, Clock, LayoutGrid, List as ListIcon, Filter, AlertTriangle, Flag, Columns } from 'lucide-react';
import { GlassCard } from '../../components/ui/Cards';
import { formatKm, formatDateTime, formatDuration } from '../../lib/utils';
import { FinishJourneyModal } from './components/FinishJourneyModal';
import { KanbanBoard } from '../../components/KanbanBoard';
import { ExportDropdown } from '../../components/ExportDropdown';
import { ExportColumn } from '../../lib/export';

const exportColumns: ExportColumn<any>[] = [
    { header: 'Cód', key: 'id', format: (val) => val.split('-')[0].toUpperCase() },
    { header: 'Placa', key: 'vehicle', format: (val) => val?.plate || '—' },
    { header: 'Motorista', key: 'driver', format: (val) => val?.name || '—' },
    { header: 'Destino', key: 'destinationName', format: (val) => val || '—' },
    { header: 'Status', key: 'status', format: (val) => val === 'IN_PROGRESS' ? 'Em Jornada' : 'Finalizada' },
    { header: 'Início', key: 'startTime', format: (val) => formatDateTime(val) },
    { header: 'Fim', key: 'endTime', format: (val) => val ? formatDateTime(val) : '—' },
    { header: 'KM Inicial', key: 'startKm', format: (val) => formatKm(val) },
    { header: 'KM Final', key: 'endKm', format: (val) => val ? formatKm(val) : '—' },
    { header: 'Distância', key: 'id', format: (_, row) => row.endKm ? formatKm(row.endKm - row.startKm) : '—' },
    { header: 'Duração', key: 'durationMinutes', format: (val) => formatDuration(val) }
];

export function JourneysList() {
    const navigate = useNavigate();
    const [filter, setFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');
    const [selectedJourney, setSelectedJourney] = useState<any>(null);
    const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'grid' | 'kanban'>('list');

    const { data: journeys = [], isLoading } = useQuery({
        queryKey: ['journeys'],
        queryFn: async () => {
            const res = await api.get('/journeys');
            return res.data;
        }
    });

    const filtered = journeys.filter((j: any) => {
        const matchesSearch = j.vehicle?.plate?.toLowerCase().includes(filter.toLowerCase()) ||
            j.driver?.name?.toLowerCase().includes(filter.toLowerCase());

        const matchesStatus = statusFilter === 'ALL' || j.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

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
                <div className="flex items-center gap-3">
                    <ExportDropdown
                        data={filtered}
                        columns={exportColumns}
                        filename={`Frota2026_Jornadas_${new Date().toISOString().split('T')[0]}`}
                        pdfTitle="Relatório de Jornadas"
                    />
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-card p-4 rounded-2xl border border-border/50 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 items-center flex-1 w-full max-w-4xl">
                    <div className="flex items-center gap-3 bg-muted/30 p-2 rounded-xl border border-border shadow-sm flex-1 w-full focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                        <Search size={22} className="text-muted-foreground/40 ml-2" />
                        <input
                            placeholder="Buscar placa..."
                            className="bg-transparent outline-none flex-1 py-2 text-sm font-black uppercase tracking-tight text-foreground placeholder:text-muted-foreground/30"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-xl border border-border shadow-sm w-full md:w-auto">
                        <Filter size={20} className="text-muted-foreground/40 ml-2" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="bg-transparent outline-none text-[10px] font-black uppercase tracking-widest pr-8 py-2 text-foreground"
                        >
                            <option value="ALL">Status: Todos</option>
                            <option value="IN_PROGRESS">Em Andamento</option>
                            <option value="COMPLETED">Finalizadas</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-3 bg-muted/30 p-2 rounded-xl border border-border shadow-sm w-full md:w-auto text-foreground">
                        <input
                            type="date"
                            className="bg-transparent outline-none text-[10px] font-black uppercase py-1 px-2"
                            title="Data Inicial"
                        />
                        <span className="text-border">|</span>
                        <input
                            type="date"
                            className="bg-transparent outline-none text-[10px] font-black uppercase py-1 px-2"
                            title="Data Final"
                        />
                    </div>
                </div>

                <div className="flex bg-muted p-1.5 rounded-xl border border-border shadow-sm">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-background shadow-md text-primary' : 'text-muted-foreground/40 hover:text-foreground'}`}
                        title="Visualização em Grade"
                    >
                        <LayoutGrid size={20} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-background shadow-md text-primary' : 'text-muted-foreground/40 hover:text-foreground'}`}
                        title="Visualização em Lista"
                    >
                        <ListIcon size={20} />
                    </button>
                    <button
                        onClick={() => setViewMode('kanban')}
                        className={`p-2.5 rounded-xl transition-all ${viewMode === 'kanban' ? 'bg-background shadow-md text-primary' : 'text-muted-foreground/40 hover:text-foreground'}`}
                        title="Visualização em Kanban"
                    >
                        <Columns size={20} />
                    </button>
                </div>
            </div>

            {viewMode === 'list' ? (
                <GlassCard transition={true} className="!p-0 overflow-hidden border border-border/50">
                    <div className="overflow-x-auto text-foreground">
                        <table className="w-full text-left text-sm font-black uppercase tracking-tighter">
                            <thead className="bg-muted/50 border-b border-border ">
                                <tr className="text-muted-foreground/40 text-[10px] tracking-[0.2em]">
                                    <th className="px-6 py-4">Veículo</th>
                                    <th className="px-6 py-4">Motorista</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Início / Fim</th>
                                    <th className="px-6 py-4 text-right">KM Percorrida</th>
                                    <th className="px-6 py-4 text-right">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border ">
                                {filtered.map((journey: any) => (
                                    <tr key={journey.id} className="group hover:bg-primary/5 transition-all">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <span className="font-black text-primary ">{journey.vehicle?.plate || '—'}</span>
                                                {journey.isLongRunning && (
                                                    <span title="Jornada prolongada (>12h)">
                                                        <AlertTriangle size={14} className="text-amber-500 animate-pulse" />
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 font-black text-foreground">{journey.driver?.name || '—'}</td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col gap-1">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider w-fit border ${journey.status === 'IN_PROGRESS' ? 'bg-primary/10 text-primary border-primary/20' :
                                                    journey.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                        'bg-muted text-muted-foreground border-border'
                                                    }`}>
                                                    {journey.status === 'IN_PROGRESS' ? 'Em Jornada' : 'Finalizada'}
                                                </span>
                                                <span className="text-[10px] font-black text-muted-foreground/60 flex items-center gap-1 uppercase tracking-tighter">
                                                    <Clock size={10} /> {formatDuration(journey.durationMinutes)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-muted-foreground/60 font-black uppercase">
                                            <div className="flex flex-col">
                                                <span className="text-xs">{formatDateTime(journey.startTime)}</span>
                                                {journey.endTime && <span className="text-[10px] opacity-70">bloqueio: {formatDateTime(journey.endTime)}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right font-black text-foreground uppercase tracking-wider">
                                            {journey.endKm ? formatKm(journey.endKm - journey.startKm) : '—'}
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {journey.status === 'IN_PROGRESS' && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedJourney(journey);
                                                            setIsFinishModalOpen(true);
                                                        }}
                                                        className="p-2.5 hover:bg-emerald-500/10 text-emerald-500 rounded-xl transition-all"
                                                        title="Finalizar Jornada"
                                                    >
                                                        <Flag size={20} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => navigate(`/journeys/${journey.id}`)}
                                                    className="p-2.5 hover:bg-primary/10 text-primary rounded-xl transition-all"
                                                    title="Ver Detalhes"
                                                >
                                                    <ClipboardList size={22} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </GlassCard>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filtered.map((journey: any) => (
                        <GlassCard key={journey.id} transition={true} className="group overflow-hidden relative border border-border/50 hover:border-primary/30">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20">
                                    <Map size={24} />
                                </div>
                                <div>
                                    <div className="text-xl font-black text-primary tracking-tighter uppercase">{journey.vehicle?.plate || '—'}</div>
                                    <div className="text-[10px] text-muted-foreground/60 uppercase font-bold tracking-widest">{journey.vehicle?.model || 'Desconhecido'}</div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="text-[10px] text-muted-foreground/40 font-black uppercase tracking-[0.2em] mb-1">Motorista</div>
                                    <div className="font-black text-foreground uppercase tracking-tight text-sm truncate">{journey.driver?.name || '—'}</div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-2.5 bg-muted/40 rounded-xl border border-border/50 ">
                                        <div className="text-[10px] text-muted-foreground/40 font-black uppercase tracking-[0.2em] mb-1">Km Percorrida</div>
                                        <div className="text-sm font-black text-foreground uppercase tracking-wider">
                                            {journey.endKm ? formatKm(journey.endKm - journey.startKm) : '—'}
                                        </div>
                                    </div>
                                    <div className="p-2.5 bg-muted/40 rounded-xl border border-border/50 ">
                                        <div className="text-[10px] text-muted-foreground/40 font-black uppercase tracking-[0.2em] mb-1">Status</div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${journey.status === 'IN_PROGRESS' ? 'text-primary' : 'text-emerald-500'}`}>
                                            {journey.status === 'IN_PROGRESS' ? 'Em Jornada' : 'Finalizada'}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-border flex justify-between items-center text-[10px] text-muted-foreground/60 font-black uppercase tracking-widest">
                                    <span>{new Date(journey.startTime).toLocaleDateString('pt-BR')}</span>
                                    {journey.checklists?.length > 0 && (
                                        <button
                                            onClick={() => navigate(`/journeys/${journey.id}`)}
                                            className="text-primary hover:text-primary/80 transition-colors"
                                        >
                                            Ver Detalhes
                                        </button>
                                    )}
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            ) : (
                <KanbanBoard
                    columns={[
                        { id: 'IN_PROGRESS', title: 'Em Andamento', count: 0, color: 'bg-blue-500' },
                        { id: 'COMPLETED', title: 'Finalizadas', count: 0, color: 'bg-green-500' },
                    ]}
                    items={filtered}
                    getItemColumnId={(j: any) => j.status}
                    renderCard={(j: any) => (
                        <GlassCard
                            key={j.id}
                            transition={true}
                            className="p-4 rounded-3xl border border-border/50 hover:border-primary/30 transition-all group bg-card/50 backdrop-blur cursor-pointer"
                            onClick={() => navigate(`/journeys/${j.id}`)}
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                                    <Map size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-black text-foreground text-sm truncate uppercase tracking-tighter group-hover:text-primary transition-colors">{j.vehicle?.model || 'Veículo'}</h4>
                                    <p className="text-[10px] text-primary font-black uppercase tracking-wider">{j.vehicle?.plate || 'S/PLACA'}</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tighter">
                                    <span className="text-muted-foreground/40">Motorista</span>
                                    <span className="text-foreground truncate max-w-[100px]">{j.driver?.name || '—'}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tighter">
                                    <span className="text-muted-foreground/40">Início</span>
                                    <span className="text-foreground">{formatDateTime(j.startTime).split(' ')[0]}</span>
                                </div>
                            </div>
                        </GlassCard>
                    )}
                />
            )}

            {filtered.length === 0 && (
                <div className="text-center py-20 bg-card/30 backdrop-blur rounded-3xl border-2 border-dashed border-border/40 ">
                    <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">Nenhuma jornada encontrada para os termos buscados.</p>
                </div>
            )}

            {selectedJourney && (
                <FinishJourneyModal
                    isOpen={isFinishModalOpen}
                    onClose={() => setIsFinishModalOpen(false)}
                    journey={selectedJourney}
                />
            )}
        </div>
    );
}

