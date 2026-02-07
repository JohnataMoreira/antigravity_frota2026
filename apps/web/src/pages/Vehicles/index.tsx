import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { Plus, Edit, Trash, Search } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

interface Vehicle {
    id: string;
    plate: string;
    model: string;
    brand: string;
    status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'CRITICAL_ISSUE';
    currentKm: number;
}

export function VehiclesList() {
    const { data: vehicles, isLoading, error } = useQuery<Vehicle[]>({
        queryKey: ['vehicles'],
        queryFn: async () => {
            const res = await api.get('/vehicles');
            return res.data;
        }
    });

    const [filter, setFilter] = useState('');

    const filteredVehicles = vehicles?.filter(v =>
        v.plate.toLowerCase().includes(filter.toLowerCase()) ||
        v.model.toLowerCase().includes(filter.toLowerCase())
    );

    if (isLoading) return <div className="p-4">Loading vehicles...</div>;
    if (error) return <div className="p-4 text-red-500">Error loading vehicles</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Vehicles</h1>
                <Link to="/vehicles/new" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                    <Plus size={18} />
                    Add Vehicle
                </Link>
            </div>

            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg border shadow-sm max-w-sm">
                <Search size={20} className="text-gray-400" />
                <input
                    placeholder="Search plate or model..."
                    className="bg-transparent outline-none flex-1"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 border-b">
                        <tr>
                            <th className="px-6 py-4 font-semibold">Plate</th>
                            <th className="px-6 py-4 font-semibold">Brand/Model</th>
                            <th className="px-6 py-4 font-semibold">Status</th>
                            <th className="px-6 py-4 font-semibold">Current KM</th>
                            <th className="px-6 py-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {filteredVehicles?.map((vehicle) => (
                            <tr key={vehicle.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="px-6 py-4 font-medium">{vehicle.plate}</td>
                                <td className="px-6 py-4">{vehicle.brand} {vehicle.model}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold
                                        ${vehicle.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' : ''}
                                        ${vehicle.status === 'IN_USE' ? 'bg-blue-100 text-blue-700' : ''}
                                        ${vehicle.status === 'MAINTENANCE' ? 'bg-yellow-100 text-yellow-700' : ''}
                                        ${vehicle.status === 'CRITICAL_ISSUE' ? 'bg-red-100 text-red-700' : ''}
                                    `}>
                                        {vehicle.status.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4">{vehicle.currentKm} km</td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button className="text-gray-500 hover:text-blue-600"><Edit size={18} /></button>
                                </td>
                            </tr>
                        ))}
                        {filteredVehicles?.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    No vehicles found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
