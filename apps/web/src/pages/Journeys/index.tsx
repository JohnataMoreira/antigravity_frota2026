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

            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 items-center flex-1 w-full max-w-4xl">
                    <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-100 shadow-sm flex-1 w-full focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
                        <Search size={22} className="text-gray-400 ml-2" />
                        <input
                            placeholder="Buscar placa..."
                            className="bg-transparent outline-none flex-1 py-2 text-sm font-medium"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-100 shadow-sm w-full md:w-auto">
                        <Filter size={20} className="text-gray-400 ml-2" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="bg-transparent outline-none text-sm font-bold pr-8 py-2"
                        >
                            <option value="ALL">Status: Todos</option>
                            <option value="IN_PROGRESS">Em Andamento</option>
                            <option value="COMPLETED">Finalizadas</option>
                        </select>
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

            {viewMode === 'list' ? (
                <GlassCard transition={true} className="!p-0 overflow-hidden">
                    <div className="overflow-x-auto text-foreground">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50/50 border-b border-gray-100 ">
                                <tr>
                                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-gray-400 ">Veículo</th>
                                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-gray-400 ">Motorista</th>
                                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-gray-400 ">Status</th>
                                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-gray-400 ">Início / Fim</th>
                                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-gray-400 text-right">KM Percorrida</th>
                                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-gray-400 text-right">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 ">
                                {filtered.map((journey: any) => (
                                    <tr key={journey.id} className="group hover:bg-gray-50/50 transition-all">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-blue-600 ">{journey.vehicle?.plate || '—'}</span>
                                                {journey.isLongRunning && (
                                                    <span title="Jornada prolongada (>12h)">
                                                        <AlertTriangle size={14} className="text-amber-500 animate-pulse" />
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 font-medium">{journey.driver?.name || '—'}</td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col gap-1">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider w-fit ${journey.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700 ' :
                                                    journey.status === 'COMPLETED' ? 'bg-green-100 text-green-700 ' :
                                                        'bg-gray-100 text-gray-700 '
                                                    }`}>
                                                    {journey.status === 'IN_PROGRESS' ? 'Em Jornada' : 'Finalizada'}
                                                </span>
                                                <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                                                    <Clock size={10} /> {formatDuration(journey.durationMinutes)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-muted-foreground font-medium">
                                            <div className="flex flex-col">
                                                <span className="text-xs">{formatDateTime(journey.startTime)}</span>
                                                {journey.endTime && <span className="text-[10px] opacity-70">bloqueio: {formatDateTime(journey.endTime)}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right font-bold text-gray-900 uppercase">
                                            {journey.endKm ? formatKm(journey.endKm - journey.startKm) : '—'}
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {journey.status === 'IN_PROGRESS' && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedJourney(journey);
                                                            setIsFinishModalOpen(true);
                                                        }}
                                                        className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-xl transition-all"
                                                        title="Finalizar Jornada"
                                                    >
                                                        <Flag size={20} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => navigate(`/journeys/${journey.id}`)}
                                                    className="p-2 hover:bg-blue-50 text-blue-600 rounded-xl transition-all"
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
                        <GlassCard key={journey.id} transition={true} className="group overflow-hidden relative">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 rounded-2xl bg-blue-100/50 text-blue-600 ">
                                    <Map size={24} />
                                </div>
                                <div>
                                    <div className="text-xl font-black text-blue-600 ">{journey.vehicle?.plate || '—'}</div>
                                    <div className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">{journey.vehicle?.model || 'Desconhecido'}</div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">Motorista</div>
                                    <div className="font-bold truncate">{journey.driver?.name || '—'}</div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-2.5 bg-gray-50 rounded-xl border ">
                                        <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">Km Percorrida</div>
                                        <div className="text-sm font-black text-gray-900 uppercase">
                                            {journey.endKm ? formatKm(journey.endKm - journey.startKm) : '—'}
                                        </div>
                                    </div>
                                    <div className="p-2.5 bg-gray-50 rounded-xl border ">
                                        <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">Status</div>
                                        <span className={`text-[10px] font-black uppercase ${journey.status === 'IN_PROGRESS' ? 'text-blue-600 ' : 'text-green-600 '}`}>
                                            {journey.status === 'IN_PROGRESS' ? 'Em Jornada' : 'Finalizada'}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-2 border-t flex justify-between items-center text-[10px] text-gray-500">
                                    <span>{new Date(journey.startTime).toLocaleDateString('pt-BR')}</span>
                                    {journey.checklists?.length > 0 && (
                                        <button
                                            onClick={() => navigate(`/journeys/${journey.id}`)}
                                            className="text-blue-600 font-bold hover:underline underline-offset-4"
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
                            className="p-4 rounded-xl border border-gray-100 hover:shadow-md transition-all group bg-white cursor-pointer"
                            onClick={() => navigate(`/journeys/${j.id}`)}
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                                    <Map size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-gray-900 text-sm truncate uppercase tracking-tighter">{j.vehicle?.model || 'Veículo'}</h4>
                                    <p className="text-[10px] text-blue-600 font-black uppercase">{j.vehicle?.plate || 'S/PLACA'}</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-[10px]">
                                    <span className="text-gray-400 font-bold uppercase">Motorista</span>
                                    <span className="font-bold text-gray-700 truncate max-w-[100px]">{j.driver?.name || '—'}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px]">
                                    <span className="text-gray-400 font-bold uppercase">Início</span>
                                    <span className="font-bold text-gray-700">{formatDateTime(j.startTime).split(' ')[0]}</span>
                                </div>
                            </div>
                        </GlassCard>
                    )}
                />
            )}

            {filtered.length === 0 && (
                <div className="text-center py-20 bg-white/50 rounded-3xl border-2 border-dashed border-gray-200 ">
                    <p className="text-muted-foreground font-medium">Nenhuma jornada encontrada para os termos buscados.</p>
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

