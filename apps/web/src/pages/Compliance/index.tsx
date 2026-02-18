import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { GlassCard } from '../../components/ui/Cards';
import {
    ShieldCheck,
    FileText,
    AlertTriangle,
    CheckCircle2,
    Search,
    Filter,
    Download,
    Trash2,
    User,
    Truck,
    Clock
} from 'lucide-react';
import { formatDateTime } from '../../lib/utils';
import { clsx } from 'clsx';

export default function CompliancePage() {
    const queryClient = useQueryClient();
    const [filter, setFilter] = useState<'ALL' | 'EXPIRED' | 'WARNING' | 'VALID'>('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    const { data: documents, isLoading } = useQuery({
        queryKey: ['compliance-all', filter],
        queryFn: async () => {
            const params: any = {};
            if (filter === 'EXPIRED') params.expired = 'true';
            // Note: WARNING filter could be implemented via a custom endpoint or client-side
            const res = await api.get('/compliance/documents', { params });
            return res.data;
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/compliance/documents/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['compliance-all'] })
    });

    const getStatus = (expiryDate: string | null) => {
        if (!expiryDate) return { label: 'Sem Validade', color: 'text-gray-500', icon: Clock };
        const expiry = new Date(expiryDate);
        const today = new Date();
        const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { label: 'Expirado', color: 'text-red-500', icon: AlertTriangle };
        if (diffDays <= 30) return { label: 'Atenção', color: 'text-amber-500', icon: AlertTriangle };
        return { label: 'Válido', color: 'text-emerald-500', icon: CheckCircle2 };
    };

    const filteredDocs = documents?.filter((doc: any) => {
        const matchesSearch =
            doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.vehicle?.plate?.toLowerCase().includes(searchTerm.toLowerCase());

        if (filter === 'ALL') return matchesSearch;
        const status = getStatus(doc.expiryDate);
        if (filter === 'EXPIRED' && status.label === 'Expirado') return matchesSearch;
        if (filter === 'WARNING' && status.label === 'Atenção') return matchesSearch;
        if (filter === 'VALID' && status.label === 'Válido') return matchesSearch;
        return false;
    });

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
                    <ShieldCheck className="w-10 h-10 text-blue-600" />
                    Auditoria de Conformidade
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">Central de Inteligência e Gestão de Documentos</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <GlassCard className="flex flex-col items-center justify-center p-6 text-center">
                    <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-600 mb-2">
                        <FileText size={24} />
                    </div>
                    <p className="text-2xl font-black">{documents?.length || 0}</p>
                    <p className="text-xs font-bold uppercase text-muted-foreground">Total de Arquivos</p>
                </GlassCard>

                <GlassCard className="flex flex-col items-center justify-center p-6 text-center border-red-500/20">
                    <div className="p-3 bg-red-500/10 rounded-2xl text-red-600 mb-2">
                        <AlertTriangle size={24} />
                    </div>
                    <p className="text-2xl font-black">{documents?.filter((d: any) => getStatus(d.expiryDate).label === 'Expirado').length || 0}</p>
                    <p className="text-xs font-bold uppercase text-muted-foreground">Documentos Vencidos</p>
                </GlassCard>

                <GlassCard className="flex flex-col items-center justify-center p-6 text-center border-amber-500/20">
                    <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-600 mb-2">
                        <Clock size={24} />
                    </div>
                    <p className="text-2xl font-black">{documents?.filter((d: any) => getStatus(d.expiryDate).label === 'Atenção').length || 0}</p>
                    <p className="text-xs font-bold uppercase text-muted-foreground">Próximos ao Vencimento</p>
                </GlassCard>

                <GlassCard className="flex flex-col items-center justify-center p-6 text-center border-emerald-500/20">
                    <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-600 mb-2">
                        <CheckCircle2 size={24} />
                    </div>
                    <p className="text-2xl font-black">{documents?.filter((d: any) => getStatus(d.expiryDate).label === 'Válido').length || 0}</p>
                    <p className="text-xs font-bold uppercase text-muted-foreground">Em Conformidade</p>
                </GlassCard>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-gray-950 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                <div className="flex gap-2 p-1 bg-gray-50 dark:bg-gray-900 rounded-xl w-full md:w-auto">
                    {(['ALL', 'EXPIRED', 'WARNING', 'VALID'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={clsx(
                                "flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                                filter === f ? "bg-white dark:bg-gray-800 text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            {f === 'ALL' ? 'Todos' : f === 'EXPIRED' ? 'Vencidos' : f === 'WARNING' ? 'Alerta' : 'Válidos'}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nome, placa ou funcionário..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <GlassCard className="overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-800">
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Documento</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Vinculado a</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Nº / Identificador</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Validade</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Status</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-6 py-4 h-16 bg-gray-50/50 dark:bg-gray-900/20" />
                                    </tr>
                                ))
                            ) : filteredDocs?.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground font-bold">
                                        Nenhum documento encontrado com os filtros atuais.
                                    </td>
                                </tr>
                            ) : filteredDocs?.map((doc: any) => {
                                const status = getStatus(doc.expiryDate);
                                return (
                                    <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600">
                                                    <FileText size={18} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm">{doc.name}</p>
                                                    <p className="text-[10px] uppercase font-black text-gray-400">{doc.type}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {doc.user ? (
                                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                    <User size={14} className="text-blue-500" />
                                                    <span className="font-medium">{doc.user.name}</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                    <Truck size={14} className="text-purple-500" />
                                                    <span className="font-mono font-bold uppercase">{doc.vehicle?.plate}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-mono text-gray-500">{doc.number || '---'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm">
                                                <p className="font-medium">{doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : 'Sem data'}</p>
                                                <p className="text-[10px] text-gray-400">{doc.issueDate ? `Emitido em ${new Date(doc.issueDate).toLocaleDateString()}` : ''}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={clsx("flex items-center gap-1.5 text-xs font-black uppercase tracking-tighter", status.color)}>
                                                <status.icon size={14} />
                                                {status.label}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <a
                                                    href={doc.fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 rounded-lg transition-colors"
                                                    title="Visualizar"
                                                >
                                                    <Download size={18} />
                                                </a>
                                                <button
                                                    onClick={() => {
                                                        if (confirm('Deseja excluir este documento permanentemente?')) {
                                                            deleteMutation.mutate(doc.id);
                                                        }
                                                    }}
                                                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 rounded-lg transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </GlassCard>
        </div>
    );
}
