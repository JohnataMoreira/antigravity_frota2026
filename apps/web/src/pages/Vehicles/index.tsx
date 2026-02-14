import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { Plus, Edit, Trash, Search, LayoutGrid, List as ListIcon, Car, Truck as TruckIcon, Bike, Cpu, Filter } from 'lucide-react';
import { useState } from 'react';
import { VehicleModal } from '../../components/VehicleModal';
import { formatKm } from '../../lib/utils';

interface Vehicle {
    id: string;
    plate: string;
    model: string;
    brand: string;
    status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'CRITICAL_ISSUE';
    currentKm: number;
    type: 'CAR' | 'TRUCK' | 'MOTORCYCLE' | 'MACHINE';
    year?: number;
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

export function VehiclesList() {
    const queryClient = useQueryClient();
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
    const [filter, setFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

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
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Frota de Veículos
                    </h1>
                    <p className="text-muted-foreground mt-1">Gerencie os veículos e máquinas da sua empresa.</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all font-medium"
                >
                    <Plus size={20} />
                    Adicionar Veículo
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex flex-col md:flex-row gap-4 items-center flex-1 w-full max-w-2xl">
                    <div className="flex items-center gap-3 bg-white dark:bg-gray-800/50 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex-1 w-full focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
                        <div className="pl-3 text-gray-400">
                            <Search size={20} />
                        </div>
                        <input
                            placeholder="Buscar por placa, modelo ou marca..."
                            className="bg-transparent outline-none flex-1 py-2 text-sm"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-white dark:bg-gray-800/50 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm w-full md:w-auto">
                        <Filter size={18} className="text-gray-400 ml-2" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-transparent outline-none text-sm font-medium pr-8 py-2"
                        >
                            <option value="ALL">Todos os Status</option>
                            <option value="AVAILABLE">Disponível</option>
                            <option value="IN_USE">Em Uso</option>
                            <option value="MAINTENANCE">Manutenção</option>
                            <option value="CRITICAL_ISSUE">Problema Crítico</option>
                        </select>
                    </div>
                </div>

                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border dark:border-gray-700 self-end md:self-center">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        title="Visualização em Cards"
                    >
                        <LayoutGrid size={20} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        title="Visualização em Lista"
                    >
                        <ListIcon size={20} />
                    </button>
                </div>
            </div>

            {viewMode === 'list' ? (
                <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800/80 border-b dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-4 font-bold text-gray-500 dark:text-gray-400">Placa</th>
                                    <th className="px-6 py-4 font-bold text-gray-500 dark:text-gray-400">Marca/Modelo</th>
                                    <th className="px-6 py-4 font-bold text-gray-500 dark:text-gray-400 text-center">Tipo</th>
                                    <th className="px-6 py-4 font-bold text-gray-500 dark:text-gray-400">Status</th>
                                    <th className="px-6 py-4 font-bold text-gray-500 dark:text-gray-400">KM Atual</th>
                                    <th className="px-6 py-4 font-bold text-gray-500 dark:text-gray-400 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {filteredVehicles?.map((vehicle) => (
                                    <tr key={vehicle.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="px-6 py-4 font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap uppercase">
                                            {vehicle.plate.length === 7
                                                ? `${vehicle.plate.slice(0, 3)}-${vehicle.plate.slice(3)}`
                                                : vehicle.plate}
                                        </td>
                                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                            <div className="font-semibold">{vehicle.model}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">{vehicle.brand} {vehicle.year}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="inline-flex p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-500">
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
                                        <td className="px-6 py-4 font-bold dark:text-gray-200">
                                            {formatKm(vehicle.currentKm)}
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button
                                                onClick={() => handleEdit(vehicle)}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                                                title="Editar Veículo"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(vehicle.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
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
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredVehicles?.map((vehicle) => (
                        <div key={vehicle.id} className="glass-card p-5 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                <button onClick={() => handleEdit(vehicle)} className="p-2 bg-white dark:bg-gray-800 shadow-lg rounded-full text-blue-600 hover:scale-110 active:scale-95 transition-all">
                                    <Edit size={16} />
                                </button>
                                <button onClick={() => handleDelete(vehicle.id)} className="p-2 bg-white dark:bg-gray-800 shadow-lg rounded-full text-red-600 hover:scale-110 active:scale-95 transition-all">
                                    <Trash size={16} />
                                </button>
                            </div>

                            <div className="flex items-start gap-4 mb-4">
                                <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 ring-4 ring-blue-50/50 dark:ring-blue-900/10">
                                    {(() => {
                                        const Icon = (typeIconMap as any)[vehicle.type] || Car;
                                        return <Icon size={28} />;
                                    })()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xl font-bold text-gray-900 dark:text-white truncate">{vehicle.model}</div>
                                    <div className="text-sm text-gray-500 font-medium truncate">{vehicle.brand}</div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                    <span className="text-gray-500">Placa</span>
                                    <span className="font-bold text-blue-600 dark:text-blue-400 uppercase">{vehicle.plate}</span>
                                </div>

                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Quilometragem</span>
                                    <span className="font-semibold text-gray-900 dark:text-gray-100 uppercase">{formatKm(vehicle.currentKm)}</span>
                                </div>

                                <div className="flex justify-between items-center pt-2">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusMap[vehicle.status].color}`}>
                                        {statusMap[vehicle.status].label}
                                    </span>
                                    <div className="text-[10px] text-gray-400 font-bold uppercase">Cod: {vehicle.id.split('-')[0]}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {filteredVehicles?.length === 0 && (
                <div className="text-center py-20 bg-white dark:bg-gray-800/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400 mb-4">
                        <Search size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Nenhum veículo encontrado</h3>
                    <p className="text-muted-foreground">Tente ajustar sua busca ou adicione um novo veículo.</p>
                </div>
            )}
            <VehicleModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                vehicle={selectedVehicle}
            />
        </div>
    );
}
