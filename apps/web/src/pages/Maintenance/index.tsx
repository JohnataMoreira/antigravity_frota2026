import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/axios';

export function MaintenanceList() {
    const { data: maintenances = [] } = useQuery({
        queryKey: ['maintenances'],
        queryFn: async () => {
            const res = await api.get('/maintenance');
            return res.data;
        }
    });

    const pending = maintenances.filter((m: any) => m.status === 'PENDING');
    const completed = maintenances.filter((m: any) => m.status === 'COMPLETED');

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Manutenções</h1>

            {pending.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-red-600">⚠️ Alertas Pendentes</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pending.map((maintenance: any) => (
                            <div key={maintenance.id} className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold">{maintenance.vehicle?.plate}</h3>
                                    <span className="text-xs bg-red-200 px-2 py-1 rounded">{maintenance.type}</span>
                                </div>
                                <p className="text-sm text-gray-700">
                                    KM Atual: <strong>{maintenance.vehicle?.currentKm}</strong>
                                </p>
                                <p className="text-sm text-gray-700">
                                    Próxima Manutenção: <strong>{maintenance.nextDueKm} km</strong>
                                </p>
                                {maintenance.vehicle?.currentKm >= maintenance.nextDueKm && (
                                    <div className="mt-2 text-red-700 font-semibold text-sm">
                                        🚨 VENCIDA!
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div>
                <h2 className="text-xl font-semibold mb-4">Histórico de Manutenções</h2>
                <div className="bg-white rounded-lg shadow">
                    <table className="w-full">
                        <thead className="border-b">
                            <tr>
                                <th className="text-left p-4">Veículo</th>
                                <th className="text-left p-4">Tipo</th>
                                <th className="text-left p-4">KM Realizada</th>
                                <th className="text-left p-4">Próxima em</th>
                                <th className="text-left p-4">Status</th>
                                <th className="text-left p-4">Data</th>
                            </tr>
                        </thead>
                        <tbody>
                            {maintenances.map((maintenance: any) => (
                                <tr key={maintenance.id} className="border-b hover:bg-gray-50">
                                    <td className="p-4 font-medium">{maintenance.vehicle?.plate || 'N/A'}</td>
                                    <td className="p-4">{maintenance.type}</td>
                                    <td className="p-4">{maintenance.lastKm || '-'}</td>
                                    <td className="p-4">{maintenance.nextDueKm} km</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-sm ${maintenance.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                maintenance.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                    'bg-gray-100 text-gray-800'
                                            }`}>
                                            {maintenance.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-gray-600">
                                        {maintenance.performedAt ?
                                            new Date(maintenance.performedAt).toLocaleDateString('pt-BR') :
                                            '-'
                                        }
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
