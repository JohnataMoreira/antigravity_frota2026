import React, { useState } from 'react';
import { Shield, Key, LogOut, Clock, User, Globe, Activity, Search, Filter } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../../lib/axios';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

interface AuditLog {
    id: string;
    action: string;
    entity: string;
    entityId: string;
    createdAt: string;
    userId: string;
    metadata: any;
    user?: {
        name: string;
        email: string;
    };
}

export function SecurityTab() {
    const [page, setPage] = useState(1);
    const limit = 10;

    const { data: auditData, isLoading } = useQuery({
        queryKey: ['audit-logs', page],
        queryFn: async () => {
            const res = await api.get(`/audit?page=${page}&limit=${limit}`);
            return res.data;
        }
    });

    const logoutAllMutation = useMutation({
        mutationFn: () => api.post('/auth/logout-all'),
        onSuccess: () => {
            toast.success('Solicitação enviada. Outras sessões serão encerradas.');
        },
        onError: () => {
            toast.error('Falha ao processar solicitação.');
        }
    });

    const getActionColor = (action: string) => {
        switch (action) {
            case 'CREATE': return 'text-green-500 bg-green-500/10';
            case 'UPDATE': return 'text-blue-500 bg-blue-500/10';
            case 'DELETE': return 'text-red-500 bg-red-500/10';
            case 'LOGIN': return 'text-primary bg-primary/10';
            case 'LOGOUT': return 'text-amber-500 bg-amber-500/10';
            default: return 'text-gray-500 bg-gray-500/10';
        }
    };

    const getEntityIcon = (entity: string) => {
        switch (entity) {
            case 'Vehicle': return <Activity size={14} />;
            case 'User': return <User size={14} />;
            case 'Organization': return <Shield size={14} />;
            default: return <Activity size={14} />;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-muted/30 border border-border rounded-3xl">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-primary/5 text-primary rounded-2xl">
                            <Shield size={24} />
                        </div>
                        <div>
                            <h4 className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Status de Segurança</h4>
                            <p className="font-black text-lg">PROTEGIDO</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-muted/30 border border-border rounded-3xl">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-amber-500/5 text-amber-500 rounded-2xl">
                            <Globe size={24} />
                        </div>
                        <div>
                            <h4 className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Último Acesso</h4>
                            <p className="font-black text-sm uppercase">Brasil • Chrome</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-3xl flex flex-col justify-between">
                    <div className="flex items-center gap-3 mb-2">
                        <Key size={18} className="text-red-500" />
                        <h4 className="font-black uppercase tracking-widest text-[10px] text-red-500">Sessões Ativas</h4>
                    </div>
                    <button
                        onClick={() => logoutAllMutation.mutate()}
                        disabled={logoutAllMutation.isPending}
                        className="w-full mt-2 py-2 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all disabled:opacity-50"
                    >
                        {logoutAllMutation.isPending ? 'PROCESSANDO...' : 'Sair de todos os dispositivos'}
                    </button>
                </div>
            </div>

            {/* Audit Log Table */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-tight">Logs de Auditoria</h3>
                        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Histórico completo de alterações no sistema</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 bg-muted rounded-xl hover:bg-muted/80 transition-colors">
                            <Filter size={16} />
                        </button>
                        <button className="p-2 bg-muted rounded-xl hover:bg-muted/80 transition-colors">
                            <Search size={16} />
                        </button>
                    </div>
                </div>

                <div className="bg-muted/10 border border-border rounded-[2.5rem] overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-muted/30 border-b border-border">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Evento</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Entidade</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Usuário</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Data/Hora</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Detalhes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-4 h-16 bg-muted/5"></td>
                                    </tr>
                                ))
                            ) : (
                                auditData?.items.map((log: AuditLog) => (
                                    <tr key={log.id} className="hover:bg-muted/20 transition-colors group">
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${getActionColor(log.action)}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="p-1.5 bg-muted rounded-lg text-muted-foreground">
                                                    {getEntityIcon(log.entity)}
                                                </span>
                                                <span className="text-[10px] font-bold uppercase tracking-widest">{log.entity}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary text-[10px] font-black">
                                                    {log.user?.name?.substring(0, 2).toUpperCase() || '??'}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black uppercase tracking-tight">{log.user?.name || 'Desconhecido'}</span>
                                                    <span className="text-[9px] text-muted-foreground font-medium">{log.user?.email || '---'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Clock size={12} />
                                                <span className="text-[10px] font-bold uppercase">
                                                    {format(new Date(log.createdAt), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline underline-offset-4">
                                                Ver Metadata
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    <div className="p-4 bg-muted/20 border-t border-border flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Página {page} de {Math.ceil((auditData?.total || 0) / limit)}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1 bg-muted border border-border rounded-lg text-[10px] font-black uppercase disabled:opacity-50"
                            >
                                Anterior
                            </button>
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={page >= Math.ceil((auditData?.total || 0) / limit)}
                                className="px-3 py-1 bg-muted border border-border rounded-lg text-[10px] font-black uppercase disabled:opacity-50"
                            >
                                Próxima
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
