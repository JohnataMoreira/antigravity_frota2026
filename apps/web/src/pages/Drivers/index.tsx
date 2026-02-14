import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { Plus, Edit, Search, Users, ShieldCheck, Mail, User } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GlassCard, StatCard } from '../../components/ui/Cards';

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

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center py-20 animate-pulse text-muted-foreground">
            <Users className="w-12 h-12 mb-4 opacity-20" />
            <p>Carregando motoristas...</p>
        </div>
    );

    if (error) return (
        <div className="p-10 text-center bg-red-50 dark:bg-red-900/10 rounded-3xl border border-red-100 dark:border-red-900/20">
            <p className="text-red-600 font-bold">Erro ao carregar motoristas</p>
            <p className="text-red-400 text-sm mt-1">Verifique a conexão com o servidor.</p>
        </div>
    );

    const activeCount = drivers?.filter(d => d.active).length || 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight gradient-text">Recursos Humanos</h1>
                    <p className="text-muted-foreground mt-2 text-lg">Gestão e monitoramento de motoristas parceiros.</p>
                </div>
                <Link to="/drivers/new" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all font-bold group">
                    <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                    Novo Motorista
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard label="Total de Motoristas" value={drivers?.length || 0} icon={<Users className="w-8 h-8" />} />
                <StatCard label="Ativos no Sistema" value={activeCount} icon={<ShieldCheck className="w-8 h-8" />} variant="success" />
                <StatCard label="Inativos" value={(drivers?.length || 0) - activeCount} icon={<User className="w-8 h-8" />} variant="warning" />
            </div>

            <div className="flex items-center gap-3 bg-white dark:bg-gray-800/50 p-2 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm max-w-md focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
                <Search size={22} className="text-gray-400 ml-2" />
                <input
                    placeholder="Buscar por nome ou email..."
                    className="bg-transparent outline-none flex-1 py-2 font-medium"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />
            </div>

            <GlassCard className="!p-0 overflow-hidden border border-gray-100 dark:border-gray-800">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50/50 dark:bg-gray-800/80 border-b dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-5 font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Motorista</th>
                                <th className="px-6 py-5 font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Documento (CNH)</th>
                                <th className="px-6 py-5 font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 text-center">Status</th>
                                <th className="px-6 py-5 font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-gray-800">
                            {filteredDrivers?.map((driver) => (
                                <tr key={driver.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                <User size={20} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-base text-gray-900 dark:text-white">{driver.name}</div>
                                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Mail size={12} />
                                                    {driver.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 font-mono text-gray-600 dark:text-gray-400">{driver.licenseNumber}</td>
                                    <td className="px-6 py-5 text-center">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest
                                            ${driver.active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}
                                        `}>
                                            {driver.active ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <button className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all">
                                            <Edit size={20} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredDrivers?.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-muted-foreground italic">
                                        Nenhum motorista encontrado com os critérios de busca.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </GlassCard>
        </div>
    );
}
