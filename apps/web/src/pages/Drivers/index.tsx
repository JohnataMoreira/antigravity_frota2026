import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { Plus, Edit, Search } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

interface Driver {
    id: string;
    name: string;
    email: string;
    licenseNumber: string;
    active: boolean;
}

export function DriversList() {
    const { data: drivers, isLoading, error } = useQuery<Driver[]>({
        queryKey: ['drivers'],
        queryFn: async () => {
            const res = await api.get('/drivers');
            return res.data;
        }
    });

    const [filter, setFilter] = useState('');

    const filteredDrivers = drivers?.filter(d =>
        d.name.toLowerCase().includes(filter.toLowerCase()) ||
        d.email.toLowerCase().includes(filter.toLowerCase())
    );

    if (isLoading) return <div className="p-4">Loading drivers...</div>;
    if (error) return <div className="p-4 text-red-500">Error loading drivers</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Drivers</h1>
                <Link to="/drivers/new" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                    <Plus size={18} />
                    Add Driver
                </Link>
            </div>

            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg border shadow-sm max-w-sm">
                <Search size={20} className="text-gray-400" />
                <input
                    placeholder="Search name or email..."
                    className="bg-transparent outline-none flex-1"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 border-b">
                        <tr>
                            <th className="px-6 py-4 font-semibold">Name</th>
                            <th className="px-6 py-4 font-semibold">Email</th>
                            <th className="px-6 py-4 font-semibold">License (CNH)</th>
                            <th className="px-6 py-4 font-semibold">Status</th>
                            <th className="px-6 py-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {filteredDrivers?.map((driver) => (
                            <tr key={driver.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="px-6 py-4 font-medium">{driver.name}</td>
                                <td className="px-6 py-4">{driver.email}</td>
                                <td className="px-6 py-4">{driver.licenseNumber}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold
                                        ${driver.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                                    `}>
                                        {driver.active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button className="text-gray-500 hover:text-blue-600"><Edit size={18} /></button>
                                </td>
                            </tr>
                        ))}
                        {filteredDrivers?.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    No drivers found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
