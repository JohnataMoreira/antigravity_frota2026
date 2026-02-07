import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { useState } from 'react';

export function JourneysList() {
    const [filter, setFilter] = useState('');

    const { data: journeys = [] } = useQuery({
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

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Jornadas</h1>
            </div>

            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Buscar por veículo ou motorista..."
                    className="w-full px-4 py-2 border rounded-lg"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />
            </div>

            <div className="bg-white rounded-lg shadow">
                <table className="w-full">
                    <thead className="border-b">
                        <tr>
                            <th className="text-left p-4">Veículo</th>
                            <th className="text-left p-4">Motorista</th>
                            <th className="text-left p-4">Status</th>
                            <th className="text-left p-4">Início</th>
                            <th className="text-left p-4">Fim</th>
                            <th className="text-left p-4">KM Percorrida</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((journey: any) => (
                            <tr key={journey.id} className="border-b hover:bg-gray-50">
                                <td className="p-4 font-medium">{journey.vehicle?.plate || 'N/A'}</td>
                                <td className="p-4">{journey.driver?.name || 'N/A'}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-sm ${journey.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                                            journey.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                'bg-gray-100 text-gray-800'
                                        }`}>
                                        {journey.status}
                                    </span>
                                </td>
                                <td className="p-4 text-sm text-gray-600">
                                    {new Date(journey.startTime).toLocaleString('pt-BR')}
                                </td>
                                <td className="p-4 text-sm text-gray-600">
                                    {journey.endTime ? new Date(journey.endTime).toLocaleString('pt-BR') : '-'}
                                </td>
                                <td className="p-4">
                                    {journey.endKm ? `${journey.endKm - journey.startKm} km` : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
