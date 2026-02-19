import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { GlassCard, Badge } from '../../components/ui';
import { Search, Filter, Plus, AlertTriangle, User, Calendar, MapPin, DollarSign, ArrowRight, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FineModal } from './components/FineModal';

export default function FinesList() {
    const [search, setSearch] = useState('');
    const [selectedFine, setSelectedFine] = useState<any>(null);

    const { data: fines, isLoading } = useQuery({
        queryKey: ['fines'],
        queryFn: () => api.get('/fines').then(res => res.data)
    });

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'PAID': return 'success';
            case 'IDENTIFIED': return 'default';
            case 'PENDING_IDENTIFICATION': return 'warning';
            case 'APPEAL': return 'info';
            case 'CANCELED': return 'danger';
            default: return 'default';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'PAID': return 'Pago';
            case 'IDENTIFIED': return 'Condutor Identificado';
            case 'PENDING_IDENTIFICATION': return 'Identificação Pendente';
            case 'APPEAL': return 'Em Recurso';
            case 'CANCELED': return 'Cancelada';
            default: return status;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight uppercase">Gestão de Multas</h1>
                    <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Controle de Infrações e Conformidade</p>
                </div>
                <button className="bg-slate-900 border border-slate-700 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 shadow-xl shadow-slate-200">
                    <Plus size={18} />
                    Registrar Multa
                </button>
            </div>

            <GlassCard className="!p-4 border-2 border-slate-100">
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por placa, motorista ou Nauto..."
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-slate-200 outline-none"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button className="px-6 py-3 bg-white border-2 border-slate-100 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-600 flex items-center gap-2 hover:bg-slate-50 transition-all">
                        <Filter size={18} />
                        Filtros
                    </button>
                </div>
            </GlassCard>

            <div className="grid grid-cols-1 gap-4">
                {isLoading ? (
                    <div className="p-20 text-center text-slate-400 animate-pulse font-bold uppercase tracking-widest">Carregando infrações...</div>
                ) : fines?.length === 0 ? (
                    <div className="p-20 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-slate-100">
                            <ShieldCheck size={32} className="text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Nenhuma multa registrada</p>
                    </div>
                ) : (
                    fines?.map((fine: any) => (
                        <GlassCard
                            key={fine.id}
                            onClick={() => setSelectedFine(fine)}
                            className={`hover:border-slate-300 transition-all cursor-pointer border-l-8 ${fine.status === 'PENDING_IDENTIFICATION' ? 'border-l-amber-500' : 'border-l-slate-200'
                                }`}
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-2xl ${fine.status === 'PENDING_IDENTIFICATION' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
                                        <AlertTriangle size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-lg font-black text-slate-800 uppercase tracking-tight">{fine.vehicle?.plate}</span>
                                            <Badge variant={getStatusVariant(fine.status)} className="text-[10px] uppercase font-black px-2 py-0.5">
                                                {getStatusLabel(fine.status)}
                                            </Badge>
                                        </div>
                                        <p className="text-sm font-bold text-slate-600">{fine.description}</p>
                                        <div className="flex items-center gap-4 mt-2">
                                            <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                <Calendar size={12} />
                                                {format(new Date(fine.occurredAt), "dd 'de' MMMM, HH:mm", { locale: ptBR })}
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                <MapPin size={12} />
                                                {fine.location || 'Local não informado'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8">
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Motorista</p>
                                        <div className="flex items-center justify-end gap-2">
                                            <User size={14} className="text-slate-400" />
                                            <span className="text-sm font-black text-slate-700 uppercase">{fine.driver?.name || 'Não identificado'}</span>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor</p>
                                        <div className="flex items-center justify-end gap-1 font-black text-slate-900">
                                            <span className="text-xs">R$</span>
                                            <span className="text-xl tracking-tighter">{fine.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        {fine.status === 'PENDING_IDENTIFICATION' && (
                                            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-tight">Elegível a 40% OFF (SNE)</p>
                                        )}
                                    </div>

                                    <div className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                        <ArrowRight size={20} className="text-slate-400" />
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    ))
                )}
            </div>

            <FineModal
                isOpen={!!selectedFine}
                onClose={() => setSelectedFine(null)}
                fine={selectedFine}
            />
        </div>
    );
}
