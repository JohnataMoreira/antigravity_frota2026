import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { Plus, Edit, Trash, Search, LayoutGrid, List as ListIcon, Car, Truck as TruckIcon, Bike, Cpu, Filter, Play, Columns } from 'lucide-react';
import { useState } from 'react';
import { VehicleModal } from '../../components/VehicleModal';
import { StartJourneyModal } from '../Journeys/components/StartJourneyModal';
import { formatKm } from '../../lib/utils';
import { KanbanBoard } from '../../components/KanbanBoard';
import { ExportDropdown } from '../../components/ExportDropdown';
import { ExportColumn } from '../../lib/export';

interface Vehicle {
    id: string;
    plate: string;
    model: string;
    brand: string;
    status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'CRITICAL_ISSUE';
    currentKm: number;
    type: 'CAR' | 'TRUCK' | 'MOTORCYCLE' | 'MACHINE';
    year?: number;
    fuelLevel?: number;
}

const statusMap = {
    AVAILABLE: { label: 'Disponível', color: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' },
    IN_USE: { label: 'Em Uso', color: 'bg-blue-500/10 text-blue-500 border border-blue-500/20' },
    MAINTENANCE: { label: 'Manutenção', color: 'bg-amber-500/10 text-amber-500 border border-amber-500/20' },
    CRITICAL_ISSUE: { label: 'Problema Crítico', color: 'bg-red-500/10 text-red-500 border border-red-500/20' },
};

const typeIconMap = {
    CAR: Car,
    TRUCK: TruckIcon,
    MOTORCYCLE: Bike,
    MACHINE: Cpu,
};

const exportColumns: ExportColumn<Vehicle>[] = [
    { header: 'Cód Interno', key: 'id', format: (val) => val.split('-')[0].toUpperCase() },
    { header: 'Placa', key: 'plate', format: (val) => val.length === 7 ? `${val.slice(0, 3)}-${val.slice(3)}`.toUpperCase() : val.toUpperCase() },
    { header: 'Marca', key: 'brand' },
    { header: 'Modelo', key: 'model' },
    { header: 'Ano', key: 'year', format: (val) => val ? val.toString() : '-' },
    { header: 'Tipo', key: 'type', format: (val) => val === 'CAR' ? 'Carro' : val === 'TRUCK' ? 'Caminhão' : val === 'MOTORCYCLE' ? 'Moto' : 'Máquina' },
    { header: 'Status', key: 'status', format: (val) => statusMap[val as keyof typeof statusMap]?.label || val },
    { header: 'KM Atual', key: 'currentKm', format: (val) => formatKm(val) },
    { header: 'Combustível', key: 'fuelLevel', format: (val) => val ? `${Math.round(val)}%` : '-' }
];

export function VehiclesList() {
    const queryClient = useQueryClient();
    const [viewMode, setViewMode] = useState<'list' | 'grid' | 'kanban'>('grid');
    const [filter, setFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [typeFilter, setTypeFilter] = useState<string>('ALL');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [isStartJourneyModalOpen, setIsStartJourneyModalOpen] = useState(false);
    const [vehicleToStart, setVehicleToStart] = useState<Vehicle | null>(null);

    const { data: vehicles, isLoading, error } = useQuery<Vehicle[]>({
        queryKey: ['vehicles'],
        queryFn: async () => {
            const res = await api.get('/vehicles');
            return res.data;
        }
    });

    const filteredVehicles = vehicles?.filter(v => {
        const matchesSearch = v.plate.toLowerCase().includes(filter.toLowerCase()) ||
            v.model.toLowerCase().includes(filter.toLowerCase()) ||
            (v.brand && v.brand.toLowerCase().includes(filter.toLowerCase()));

        const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
        const matchesType = typeFilter === 'ALL' || v.type === typeFilter;

        return matchesSearch && matchesStatus && matchesType;
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/vehicles/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
        }
    });

    const saveMutation = useMutation({
        mutationFn: (data: Partial<Vehicle>) => {
            if (selectedVehicle) {
                return api.patch(`/vehicles/${selectedVehicle.id}`, data);
            }
            return api.post('/vehicles', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
            setIsModalOpen(false);
        }
    });

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <TruckIcon className="w-12 h-12 text-muted-foreground/20 mb-4" />
            <div className="text-lg text-muted-foreground font-bold uppercase tracking-widest opacity-50">Carregando frota...</div>
        </div>
    );

    if (error) return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-600 mb-4">
                <LayoutGrid size={32} />
            </div>
            <h3 className="text-lg font-bold text-red-600">Erro de Conexão</h3>
            <p className="text-muted-foreground mt-1">Não foi possível carregar os veículos. Verifique o servidor.</p>
        </div>
    );

    const handleSave = (data: Partial<Vehicle>) => {
        saveMutation.mutate(data);
    };

    const handleEdit = (vehicle: Vehicle) => {
        setSelectedVehicle(vehicle);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este veículo?')) {
            deleteMutation.mutate(id);
        }
    };

    const handleAdd = () => {
        setSelectedVehicle(null);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter uppercase text-foreground">
                        Frota de Veículos
                    </h1>
                    <p className="text-muted-foreground mt-1">Gerencie os veículos e máquinas da sua empresa.</p>
                </div>
                <div className="flex items-center gap-3">
                    <ExportDropdown
                        data={filteredVehicles || []}
                        columns={exportColumns}
                        filename={`Frota2026_Veiculos_${new Date().toISOString().split('T')[0]}`}
                        pdfTitle="Relatório de Frota de Veículos"
                    />
                    <button
                        onClick={handleAdd}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-primary/20 transition-all font-black uppercase tracking-widest text-xs whitespace-nowrap"
                    >
                        <Plus size={20} />
                        Adicionar Veículo
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-card p-4 rounded-2xl border border-border">
                <div className="flex flex-col md:flex-row gap-4 items-center flex-1 w-full max-w-2xl">
                    <div className="flex items-center gap-3 bg-background p-2 rounded-xl border border-border flex-1 w-full focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                        <Search size={20} className="text-gray-400 ml-2" />
                        <input
                            placeholder="Buscar por placa, modelo ou marca..."
                            className="bg-transparent outline-none flex-1 py-2 text-sm font-medium"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-background p-2 rounded-xl border border-border shadow-sm w-full md:w-auto">
                        <Filter size={18} className="text-gray-400 ml-2" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-transparent outline-none text-sm font-bold pr-8 py-2"
                        >
                            <option value="ALL">Status: Todos</option>
                            <option value="AVAILABLE">Disponível</option>
                            <option value="IN_USE">Em Uso</option>
                            <option value="MAINTENANCE">Manutenção</option>
                            <option value="CRITICAL_ISSUE">Problema Crítico</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2 bg-background p-2 rounded-xl border border-border w-full md:w-auto">
                        <Car size={18} className="text-gray-400 ml-2" />
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="bg-transparent outline-none text-sm font-bold pr-8 py-2"
                        >
                            <option value="ALL">Tipo: Todos</option>
                            <option value="CAR">Carro</option>
                            <option value="TRUCK">Caminhão</option>
                            <option value="MOTORCYCLE">Moto</option>
                            <option value="MACHINE">Máquina / Outro</option>
                        </select>
                    </div>
                </div>

                <div className="flex bg-muted p-1.5 rounded-xl border border-border">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-card shadow-lg text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        title="Visualização em Cards"
                    >
                        <LayoutGrid size={20} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-card shadow-lg text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        title="Visualização em Lista"
                    >
                        <ListIcon size={20} />
                    </button>
                    <button
                        onClick={() => setViewMode('kanban')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-card shadow-lg text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        title="Visualização Kanban"
                    >
                        <Columns size={20} />
                    </button>
                </div>
            </div>

            {viewMode === 'list' ? (
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/50 border-b border-border">
                                <tr>
                                    <th className="px-6 py-4 font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Placa</th>
                                    <th className="px-6 py-4 font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Marca/Modelo</th>
                                    <th className="px-6 py-4 font-bold text-muted-foreground uppercase text-[10px] tracking-widest text-center">Tipo</th>
                                    <th className="px-6 py-4 font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Status</th>
                                    <th className="px-6 py-4 font-bold text-muted-foreground uppercase text-[10px] tracking-widest">KM Atual</th>
                                    <th className="px-6 py-4 font-bold text-muted-foreground uppercase text-[10px] tracking-widest text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y ">
                                {filteredVehicles?.map((vehicle) => (
                                    <tr key={vehicle.id} className="hover:bg-muted/30 transition-colors border-b border-border last:border-0">
                                        <td className="px-6 py-4 font-black text-primary whitespace-nowrap uppercase tracking-tighter text-lg">
                                            {vehicle.plate.length === 7
                                                ? `${vehicle.plate.slice(0, 3)}-${vehicle.plate.slice(3)}`
                                                : vehicle.plate}
                                        </td>
                                        <td className="px-6 py-4 text-foreground ">
                                            <div className="font-bold text-base">{vehicle.model}</div>
                                            <div className="text-xs text-muted-foreground font-bold uppercase">{vehicle.brand} {vehicle.year}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="inline-flex p-2 bg-muted rounded-lg text-muted-foreground border border-white/5">
                                                {(() => {
                                                    const Icon = (typeIconMap as any)[vehicle.type] || Car;
                                                    return <Icon size={18} />;
                                                })()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusMap[vehicle.status].color}`}>
                                                {statusMap[vehicle.status].label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-bold ">
                                            {formatKm(vehicle.currentKm)}
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button
                                                onClick={() => handleEdit(vehicle)}
                                                className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                                title="Editar Veículo"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(vehicle.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                title="Excluir Veículo"
                                            >
                                                <Trash size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredVehicles?.map((vehicle) => (
                        <div key={vehicle.id} className="bg-card p-5 rounded-3xl border border-border hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                <button onClick={() => handleEdit(vehicle)} className="p-2 bg-background border border-border shadow-lg rounded-full text-primary hover:scale-110 active:scale-95 transition-all">
                                    <Edit size={16} />
                                </button>
                                <button onClick={() => handleDelete(vehicle.id)} className="p-2 bg-background border border-border shadow-lg rounded-full text-destructive hover:scale-110 active:scale-95 transition-all">
                                    <Trash size={16} />
                                </button>
                            </div>

                            <div className="flex items-start gap-4 mb-4">
                                <div className="p-3 rounded-2xl bg-primary/10 text-primary ring-4 ring-primary/5 ">
                                    {(() => {
                                        const Icon = (typeIconMap as any)[vehicle.type] || Car;
                                        return <Icon size={28} />;
                                    })()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xl font-black text-foreground truncate tracking-tighter uppercase">{vehicle.model}</div>
                                    <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest truncate">{vehicle.brand}</div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-xs p-2.5 bg-muted/50 rounded-xl border border-white/5">
                                    <span className="text-muted-foreground font-bold uppercase tracking-widest text-[9px]">Placa</span>
                                    <span className="font-black text-primary uppercase text-sm tracking-widest">{vehicle.plate}</span>
                                </div>

                                <div className="flex justify-between items-center text-xs px-2">
                                    <span className="text-muted-foreground font-bold uppercase tracking-widest text-[9px]">Quilometragem</span>
                                    <span className="font-black text-foreground uppercase text-xs">{formatKm(vehicle.currentKm)}</span>
                                </div>

                                <div className="flex justify-between items-center pt-2 px-2">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusMap[vehicle.status].color}`}>
                                        {statusMap[vehicle.status].label}
                                    </span>
                                    <div className="text-[10px] text-muted-foreground/40 font-black uppercase">Cod: {vehicle.id.split('-')[0]}</div>
                                </div>

                                {vehicle.status === 'AVAILABLE' && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setVehicleToStart(vehicle);
                                            setIsStartJourneyModalOpen(true);
                                        }}
                                        className="w-full mt-2 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <Play size={12} fill="currentColor" />
                                        Iniciar Jornada
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <KanbanBoard
                    columns={[
                        { id: 'IN_USE', title: 'Em Jornada', count: 0, color: 'bg-blue-500' },
                        { id: 'AVAILABLE', title: 'Disponíveis', count: 0, color: 'bg-green-500' },
                        { id: 'MAINTENANCE', title: 'Manutenção', count: 0, color: 'bg-yellow-500' },
                        { id: 'CRITICAL_ISSUE', title: 'Problemas', count: 0, color: 'bg-red-500' },
                    ]}
                    items={filteredVehicles || []}
                    getItemColumnId={(vehicle) => vehicle.status}
                    renderCard={(vehicle) => (
                        <div key={vehicle.id} className="bg-card p-4 rounded-2xl border border-border hover:shadow-lg transition-all group">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                    {(() => {
                                        const Icon = (typeIconMap as any)[vehicle.type] || Car;
                                        return <Icon size={20} />;
                                    })()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-black text-foreground text-sm truncate uppercase tracking-tighter">{vehicle.model}</h4>
                                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{vehicle.plate}</p>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-[10px]">
                                <span className="font-black text-muted-foreground/60 uppercase">KM: {formatKm(vehicle.currentKm)}</span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(vehicle)} className="text-primary p-1 hover:bg-primary/10 rounded">
                                        <Edit size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                />
            )}

            {filteredVehicles?.length === 0 && (
                <div className="text-center py-20 bg-card rounded-3xl border-2 border-dashed border-border ">
                    <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center text-muted-foreground/30 mb-4">
                        <Search size={32} />
                    </div>
                    <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Nenhum veículo encontrado</h3>
                    <p className="text-muted-foreground font-medium">Tente ajustar sua busca ou adicione um novo veículo.</p>
                </div>
            )}
            <VehicleModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                vehicle={selectedVehicle}
            />
            {vehicleToStart && (
                <StartJourneyModal
                    isOpen={isStartJourneyModalOpen}
                    onClose={() => setIsStartJourneyModalOpen(false)}
                    vehicle={vehicleToStart}
                />
            )}
        </div>
    );
}

