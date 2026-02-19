import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';
import { GlassCard, Badge } from '../../../components/ui';
import { X, AlertTriangle, User, Calendar, MapPin, DollarSign, CheckCircle, Search, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FineModalProps {
    isOpen: boolean;
    onClose: () => void;
    fine: any;
}

export function FineModal({ isOpen, onClose, fine }: FineModalProps) {
    const queryClient = useQueryClient();

    const identifyMutation = useMutation({
        mutationFn: () => api.post(`/fines/${fine.id}/auto-identify`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['fines'] });
            onClose();
        }
    });

    const statusMutation = useMutation({
        mutationFn: (status: string) => api.patch(`/fines/${fine.id}/status`, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['fines'] });
            onClose();
        }
    });

    if (!isOpen || !fine) return null;

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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

            <GlassCard className="w-full max-w-2xl relative z-10 animate-in zoom-in-95 duration-200 !p-0 overflow-hidden border-none shadow-2xl">
                <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500 rounded-xl text-slate-900">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tight">Detalhes da Infração</h2>
                            <p className="text-xs font-bold opacity-60 uppercase tracking-widest">Controle de Multas e Condutor</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Documento / Nauto</label>
                                <p className="text-lg font-black text-slate-800 uppercase">{fine.notificationNumber || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Placa do Veículo</label>
                                <p className="text-lg font-black text-slate-800 uppercase">{fine.vehicle?.plate}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Atual</label>
                                <div>
                                    <Badge variant={getStatusVariant(fine.status)} className="px-3 py-1 font-black uppercase text-[10px]">
                                        {fine.status}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data e Hora</label>
                                <div className="flex items-center gap-2 text-slate-700 font-bold">
                                    <Calendar size={16} className="text-slate-400" />
                                    {format(new Date(fine.occurredAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Código / Pontos</label>
                                <p className="text-slate-700 font-black">{fine.infractionCode} - {fine.points} Pontos</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Original</label>
                                <div className="flex items-center gap-1 text-2xl font-black text-slate-900">
                                    <span className="text-sm">R$</span>
                                    {fine.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-50 rounded-2xl border-2 border-slate-100">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Descrição</label>
                        <p className="text-sm font-bold text-slate-700 leading-relaxed">{fine.description}</p>
                        <div className="mt-4 flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-tight">
                            <MapPin size={14} />
                            {fine.location}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <User size={16} />
                            Identificação do Condutor
                        </h3>

                        {fine.driver ? (
                            <div className="p-6 bg-emerald-50 rounded-2xl border-2 border-emerald-100 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-emerald-200 rounded-full flex items-center justify-center text-emerald-700">
                                        <User size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Responsável Identificado</p>
                                        <p className="text-lg font-black text-emerald-900 uppercase tracking-tight">{fine.driver.name}</p>
                                    </div>
                                </div>
                                <CheckCircle className="text-emerald-500" size={32} />
                            </div>
                        ) : (
                            <div className="p-6 bg-amber-50 rounded-2xl border-2 border-amber-100 space-y-4">
                                <div>
                                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Status de Identificação</p>
                                    <p className="text-sm font-bold text-amber-900 leading-relaxed">
                                        Este veículo exige a identificação do condutor para evitar a multa NIC (Não Identificação de Condutor) que dobra o valor da autuação.
                                    </p>
                                </div>
                                <button
                                    onClick={() => identifyMutation.mutate()}
                                    disabled={identifyMutation.isPending}
                                    className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50"
                                >
                                    {identifyMutation.isPending ? 'Analisando Jornadas...' : 'Tentar Identificação Automática'}
                                    <Search size={18} />
                                </button>
                                <p className="text-center text-[9px] font-black text-amber-600 uppercase tracking-tighter">
                                    Cruzaremos o horário da infração com os registros de jornadas ativas.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 bg-slate-50 border-t flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-3 font-black text-xs uppercase tracking-widest text-slate-500 hover:text-slate-800 transition-all">
                        Fechar
                    </button>
                    {fine.status === 'PENDING_IDENTIFICATION' && (
                        <button
                            onClick={() => statusMutation.mutate('APPEAL')}
                            className="bg-white border-2 border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:border-slate-300 transition-all"
                        >
                            Informar Recurso
                        </button>
                    )}
                    {fine.status !== 'PAID' && (
                        <button
                            onClick={() => statusMutation.mutate('PAID')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 flex items-center gap-2 transition-all active:scale-95"
                        >
                            Marcar como Paga
                            <CheckCircle size={18} />
                        </button>
                    )}
                </div>
            </GlassCard>
        </div>
    );
}
