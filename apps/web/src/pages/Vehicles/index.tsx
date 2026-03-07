import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { Plus, Edit, Trash, Search, LayoutGrid, List as ListIcon, Car, Truck as TruckIcon, Bike, Cpu, Filter, Play } from 'lucide-react';
import { useState } from 'react';
import { VehicleModal } from '../../components/VehicleModal';
import { StartJourneyModal } from '../Journeys/components/StartJourneyModal';
import { formatKm } from '../../lib/utils';
import { GlassCard, StatCard } from '../../components/ui/Cards';

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
    AVAILABLE: { label: 'Disponível', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    IN_USE: { label: 'Em Uso', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    MAINTENANCE: { label: 'Manutenção', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
    CRITICAL_ISSUE: { label: 'Problema Crítico', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

const typeIconMap = {
    CAR: Car,
    TRUCK: TruckIcon,
    MOTORCYCLE: Bike,
    MACHINE: Cpu,
};

import { useNavigate } from 'react-router-dom';

export function VehiclesList() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
    const [filter, setFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [isStartJourneyModalOpen, setIsStartJourneyModalOpen] = useState(false);
    const [vehicleToStart, setVehicleToStart] = useState<Vehicle | null>(null);

    const { data: vehicles, isLoading, error } = useQuery<Vehicle[]>({
        queryKey: ['vehicles'],
        queryFn: async () => {
            const res = await api.get('/vehicles');
            return res.data;
        },
        placeholderData: (previousData) => previousData
    });

    const filteredVehicles = vehicles?.filter(v => {
        const matchesSearch = v.plate.toLowerCase().includes(filter.toLowerCase()) ||
            v.model.toLowerCase().includes(filter.toLowerCase()) ||
            (v.brand && v.brand.toLowerCase().includes(filter.toLowerCase()));

        const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;

        return matchesSearch && matchesStatus;
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
            <TruckIcon className="w-12 h-12 text-blue-200 mb-4" />
            <div className="text-lg text-muted-foreground font-medium">Carregando frota...</div>
        </div>
    );

    if (error) return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center text-red-600 mb-4">
                <LayoutGrid size={32} />
            </div>
            <h3 className="text-lg font-bold text-red-600">Erro de Conexão</h3>
            <p className="text-muted-foreground mt-1">Não foi possível carregar os veículos. Verifique o servidor.</p>
        </div>
    );

    const totalVehicles = vehicles?.length || 0;
    const carsCount = vehicles?.filter(v => v.type === 'CAR').length || 0;
    const trucksCount = vehicles?.filter(v => v.type === 'TRUCK').length || 0;
    const machinesCount = vehicles?.filter(v => ['MACHINE', 'MOTORCYCLE'].includes(v.type)).length || 0;

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
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                        <TruckIcon size={32} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter gradient-text uppercase">
                            Frota de Veículos
                        </h1>
                        <p className="text-muted-foreground/60 font-black uppercase tracking-[0.2em] mt-1 text-[10px]">
                            Gestão e monitoramento de ativos e maquinário
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleAdd}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all font-bold group"
                >
                    <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                    Adicionar Veículo
                </button>
            </div>

            {/* Vehicles Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Total da Frota"
                    value={totalVehicles}
                    icon={<TruckIcon className="w-8 h-8" />}
                />
                <StatCard
                    label="Veículos Leves"
                    value={carsCount}
                    icon={<Car className="w-8 h-8" />}
                    variant="info"
                />
                <StatCard
                    label="Pesados / Caminhões"
                    value={trucksCount}
                    icon={<TruckIcon className="w-8 h-8" />}
                    variant="success"
                />
                <StatCard
                    label="Maquinário / Motos"
                    value={machinesCount}
                    icon={<Cpu className="w-8 h-8" />}
                    variant="warning"
                />
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-card p-4 rounded-2xl border border-border shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 items-center flex-1 w-full max-w-2xl">
                    <div className="flex items-center gap-3 bg-muted p-2 rounded-xl border border-border shadow-sm flex-1 w-full focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                        <Search size={22} className="text-muted-foreground ml-2" />
                        <input
                            placeholder="Buscar por placa, modelo ou marca..."
                            className="bg-transparent outline-none flex-1 py-2 font-medium"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-muted p-2 rounded-xl border border-border shadow-sm w-full md:w-auto">
                        <Filter size={20} className="text-muted-foreground ml-2" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-transparent outline-none text-sm font-bold pr-8 py-2 text-foreground"
                        >
                            <option value="ALL" className="bg-card">Todos os Status</option>
                            <option value="AVAILABLE" className="bg-card">Disponível</option>
                            <option value="IN_USE" className="bg-card">Em Uso</option>
                            <option value="MAINTENANCE" className="bg-card">Manutenção</option>
                            <option value="CRITICAL_ISSUE" className="bg-card">Problema Crítico</option>
                        </select>
                    </div>
                </div>

                <div className="flex bg-muted p-1 rounded-xl border border-border">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        title="Visualização em Cards"
                    >
                        <LayoutGrid size={20} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        title="Visualização em Lista"
                    >
                        <ListIcon size={20} />
                    </button>
                </div>
            </div>

            {viewMode === 'list' ? (
                <GlassCard className="!p-0 overflow-hidden border border-border">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/50 border-b border-border">
                                <tr>
                                    <th className="px-6 py-5 font-bold uppercase tracking-wider text-muted-foreground">Placa</th>
                                    <th className="px-6 py-5 font-bold uppercase tracking-wider text-muted-foreground">Marca/Modelo</th>
                                    <th className="px-6 py-5 font-bold uppercase tracking-wider text-muted-foreground text-center">Tipo</th>
                                    <th className="px-6 py-5 font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                                    <th className="px-6 py-5 font-bold uppercase tracking-wider text-muted-foreground">KM Atual</th>
                                    <th className="px-6 py-5 font-bold uppercase tracking-wider text-muted-foreground text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredVehicles?.map((vehicle) => (
                                    <tr
                                        key={vehicle.id}
                                        className="hover:bg-primary/5 transition-colors cursor-pointer"
                                        onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                                    >
                                        <td className="px-6 py-5 font-bold text-primary whitespace-nowrap uppercase">
                                            {vehicle.plate.length === 7
                                                ? `${vehicle.plate.slice(0, 3)}-${vehicle.plate.slice(3)}`
                                                : vehicle.plate}
                                        </td>
                                        <td className="px-6 py-5 text-foreground">
                                            <div className="font-bold">{vehicle.model}</div>
                                            <div className="text-xs text-muted-foreground">{vehicle.brand} {vehicle.year}</div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <div className="inline-flex p-2 bg-muted rounded-xl text-muted-foreground">
                                                {(() => {
                                                    const Icon = (typeIconMap as any)[vehicle.type] || Car;
                                                    return <Icon size={18} />;
                                                })()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusMap[vehicle.status].color}`}>
                                                {statusMap[vehicle.status].label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 font-black text-foreground">
                                            {formatKm(vehicle.currentKm)}
                                        </td>
                                        <td className="px-6 py-5 text-right space-x-2">
                                            <button
                                                onClick={() => handleEdit(vehicle)}
                                                className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                                                title="Editar Veículo"
                                            >
                                                <Edit size={20} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(vehicle.id)}
                                                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                                                title="Excluir Veículo"
                                            >
                                                <Trash size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </GlassCard>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredVehicles?.map((vehicle) => (
                        <GlassCard
                            key={vehicle.id}
                            className="group hover:-translate-y-1 transition-all overflow-hidden relative border border-border cursor-pointer"
                            onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                        >
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                <button onClick={() => handleEdit(vehicle)} className="p-2 bg-background shadow-lg rounded-full text-primary hover:scale-110 active:scale-95 transition-all">
                                    <Edit size={16} />
                                </button>
                                <button onClick={() => handleDelete(vehicle.id)} className="p-2 bg-background shadow-lg rounded-full text-destructive hover:scale-110 active:scale-95 transition-all">
                                    <Trash size={16} />
                                </button>
                            </div>

                            <div className="flex items-start gap-4 mb-6">
                                <div className="p-3 rounded-2xl bg-primary/10 text-primary ring-4 ring-primary/5">
                                    {(() => {
                                        const Icon = (typeIconMap as any)[vehicle.type] || Car;
                                        return <Icon size={28} />;
                                    })()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xl font-black text-foreground truncate uppercase tracking-tight">{vehicle.model}</div>
                                    <div className="text-xs text-muted-foreground font-bold truncate uppercase tracking-widest">{vehicle.brand}</div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm p-3 bg-muted/50 rounded-xl border border-border/50">
                                    <span className="text-muted-foreground font-medium">Placa</span>
                                    <span className="font-black text-primary uppercase tracking-wider">{vehicle.plate}</span>
                                </div>

                                <div className="flex justify-between items-center px-2 py-1">
                                    <span className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider">Odômetro</span>
                                    <span className="font-black text-foreground text-sm">{formatKm(vehicle.currentKm)}</span>
                                </div>

                                <div className="flex justify-between items-center px-2">
                                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${statusMap[vehicle.status].color}`}>
                                        {statusMap[vehicle.status].label}
                                    </span>
                                    <div className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter opacity-40">#{vehicle.id.slice(0, 8)}</div>
                                </div>

                                {vehicle.status === 'AVAILABLE' && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setVehicleToStart(vehicle);
                                            setIsStartJourneyModalOpen(true);
                                        }}
                                        className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <Play size={14} fill="white" />
                                        Iniciar Jornada
                                    </button>
                                )}
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}

            {filteredVehicles?.length === 0 && (
                <div className="text-center py-24 bg-muted/20 rounded-[2.5rem] border-2 border-dashed border-border">
                    <div className="mx-auto w-20 h-20 bg-muted rounded-full flex items-center justify-center text-muted-foreground/30 mb-6">
                        <Search size={40} />
                    </div>
                    <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">Nenhum veículo encontrado</h3>
                    <p className="text-muted-foreground font-medium max-w-sm mx-auto mt-2">Tente ajustar sua busca ou adicione um novo veículo à frota.</p>
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
