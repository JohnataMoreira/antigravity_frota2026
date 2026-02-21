import { useState } from 'react';
import { api } from '../../lib/axios';
import { X, Mail, Shield, User, Loader2, Plus } from 'lucide-react';
import { useQueryClient, useMutation } from '@tanstack/react-query';

interface InviteModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function InviteModal({ isOpen, onClose }: InviteModalProps) {
    const queryClient = useQueryClient();
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('DRIVER');
    const [error, setError] = useState('');

    const inviteMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await api.post('/invites', data);
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['invites'] });
            // Show success or copy link
            const inviteUrl = `${window.location.origin}/register?token=${data.token}`;
            navigator.clipboard.writeText(inviteUrl);
            alert('Convite criado! O link foi copiado para sua área de transferência.');
            onClose();
        },
        onError: (err: any) => {
            setError(err.response?.data?.message || 'Erro ao enviar convite');
        }
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Mail className="text-blue-600" />
                        Convidar Membro
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl font-medium">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-700 ml-1">E-mail do Convidado</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                                <input
                                    type="email"
                                    placeholder="exemplo@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-700 ml-1">Papel no Sistema</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setRole('DRIVER')}
                                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${role === 'DRIVER' ? 'border-blue-500 bg-blue-50/50 text-blue-600' : 'border-gray-100 hover:border-gray-200'}`}
                                >
                                    <User size={24} />
                                    <span className="text-xs font-bold uppercase tracking-wider">Motorista</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole('ADMIN')}
                                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${role === 'ADMIN' ? 'border-purple-500 bg-purple-50/50 text-purple-600' : 'border-gray-100 hover:border-gray-200'}`}
                                >
                                    <Shield size={24} />
                                    <span className="text-xs font-bold uppercase tracking-wider">Gestor</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <p className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg border border-blue-100 leading-relaxed font-medium">
                        Ao clicar em "Gerar Convite", um link único será criado e copiado. O convidado deverá usar este link para realizar o cadastro.
                    </p>

                    <button
                        onClick={() => inviteMutation.mutate({ email, role })}
                        disabled={inviteMutation.isPending || !email}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 mt-4"
                    >
                        {inviteMutation.isPending ? (
                            <Loader2 className="animate-spin" />
                        ) : (
                            <>
                                <Plus size={20} />
                                Gerar Convite
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
