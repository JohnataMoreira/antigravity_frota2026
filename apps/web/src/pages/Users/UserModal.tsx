import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { X, User, Mail, Lock, CreditCard, Phone, MapPin, Calendar, Shield, Truck } from 'lucide-react';
import { DocumentVault } from '../../components/DocumentVault';

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    user?: any;
}

export function UserModal({ isOpen, onClose, user }: UserModalProps) {
    const queryClient = useQueryClient();
    const isEdit = !!user;
    const [activeTab, setActiveTab] = useState<'info' | 'documents'>('info');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'DRIVER' as 'ADMIN' | 'DRIVER',
        cpf: '',
        phone: '',
        licenseNumber: '',
        birthDate: '',
        entryDate: '',
        addressStreet: '',
        addressNumber: '',
        addressNeighborhood: '',
        addressCity: '',
        addressState: '',
        addressZipCode: '',
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                password: '', // Password field is optional in edit
                role: user.role || 'DRIVER',
                cpf: user.cpf || '',
                phone: user.phone || '',
                licenseNumber: user.licenseNumber || '',
                birthDate: user.birthDate ? user.birthDate.split('T')[0] : '',
                entryDate: user.entryDate ? user.entryDate.split('T')[0] : '',
                addressStreet: user.addressStreet || '',
                addressNumber: user.addressNumber || '',
                addressNeighborhood: user.addressNeighborhood || '',
                addressCity: user.addressCity || '',
                addressState: user.addressState || '',
                addressZipCode: user.addressZipCode || '',
            });
        }
    }, [user]);

    const mutation = useMutation({
        mutationFn: (data: any) => {
            if (isEdit) {
                return api.patch(`/users/${user.id}`, data);
            }
            return api.post('/users', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            onClose();
        },
        onError: (err: any) => {
            alert(err.response?.data?.message || 'Erro ao salvar usuário');
        }
    });

    const handleCepBlur = async () => {
        const cep = formData.addressZipCode.replace(/\D/g, '');
        if (cep.length === 8) {
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                const data = await response.json();
                if (!data.erro) {
                    setFormData(prev => ({
                        ...prev,
                        addressStreet: data.logradouro || '',
                        addressNeighborhood: data.bairro || '',
                        addressCity: data.localidade || '',
                        addressState: data.uf || '',
                    }));
                }
            } catch (error) {
                console.error('Error fetching CEP:', error);
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation for Drivers
        if (formData.role === 'DRIVER' && !formData.licenseNumber) {
            alert('CNH é obrigatória para motoristas');
            return;
        }

        const payload = { ...formData };
        if (!payload.password) delete (payload as any).password;

        mutation.mutate(payload);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-3xl font-black">{isEdit ? 'Editar Funcionário' : 'Novo Funcionário'}</h2>
                        <p className="text-muted-foreground font-bold text-sm uppercase tracking-widest mt-1">
                            {formData.role === 'ADMIN' ? 'Gestor Administrativo' : 'Motorista Operacional'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {isEdit && (
                    <div className="flex gap-4 mb-8 border-b ">
                        <button
                            onClick={() => setActiveTab('info')}
                            className={`pb-4 px-2 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === 'info' ? 'text-blue-600' : 'text-muted-foreground'}`}
                        >
                            Informações Gerais
                            {activeTab === 'info' && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-full" />}
                        </button>
                        <button
                            onClick={() => setActiveTab('documents')}
                            className={`pb-4 px-2 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === 'documents' ? 'text-blue-600' : 'text-muted-foreground'}`}
                        >
                            Cofre de Documentos
                            {activeTab === 'documents' && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-full" />}
                        </button>
                    </div>
                )}

                {activeTab === 'info' ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Papel</label>
                                <div className="flex bg-gray-100 p-1 rounded-2xl">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role: 'DRIVER' })}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${formData.role === 'DRIVER' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
                                    >
                                        <Truck size={18} /> Motorista
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role: 'ADMIN' })}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${formData.role === 'ADMIN' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400'}`}
                                    >
                                        <Shield size={18} /> Gestor
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Nome Completo</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                        <User size={20} />
                                    </div>
                                    <input
                                        required
                                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">E-mail Corporativo</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                        <Mail size={20} />
                                    </div>
                                    <input
                                        required
                                        type="email"
                                        disabled={isEdit}
                                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium disabled:opacity-50"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
                                    {isEdit ? 'Nova Senha (opcional)' : 'Senha de Acesso'}
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                        <Lock size={20} />
                                    </div>
                                    <input
                                        required={!isEdit}
                                        type="password"
                                        placeholder={isEdit ? "••••••••" : ""}
                                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Personal & Professional Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-t ">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">CPF</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                        <CreditCard size={20} />
                                    </div>
                                    <input
                                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                        value={formData.cpf}
                                        onChange={e => setFormData({ ...formData, cpf: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Telefone / WhatsApp</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                        <Phone size={20} />
                                    </div>
                                    <input
                                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Data de Nascimento</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                        <Calendar size={20} />
                                    </div>
                                    <input
                                        type="date"
                                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                        value={formData.birthDate}
                                        onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Data de Admissão</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                        <Calendar size={20} />
                                    </div>
                                    <input
                                        type="date"
                                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                        value={formData.entryDate}
                                        onChange={e => setFormData({ ...formData, entryDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            {formData.role === 'DRIVER' && (
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Nº da CNH</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                            <Truck size={20} />
                                        </div>
                                        <input
                                            required
                                            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium font-mono uppercase tracking-widest"
                                            placeholder="Ex: 01234567890"
                                            value={formData.licenseNumber}
                                            onChange={e => setFormData({ ...formData, licenseNumber: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Address Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-t ">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">CEP</label>
                                <input
                                    maxLength={9}
                                    placeholder="00000-000"
                                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                    value={formData.addressZipCode}
                                    onChange={e => setFormData({ ...formData, addressZipCode: e.target.value })}
                                    onBlur={handleCepBlur}
                                />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Logradouro / Rua</label>
                                <input
                                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                    value={formData.addressStreet}
                                    onChange={e => setFormData({ ...formData, addressStreet: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Número</label>
                                <input
                                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                    value={formData.addressNumber}
                                    onChange={e => setFormData({ ...formData, addressNumber: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Bairro</label>
                                <input
                                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                    value={formData.addressNeighborhood}
                                    onChange={e => setFormData({ ...formData, addressNeighborhood: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Cidade</label>
                                <input
                                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                    value={formData.addressCity}
                                    onChange={e => setFormData({ ...formData, addressCity: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Estado (UF)</label>
                                <input
                                    maxLength={2}
                                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium uppercase"
                                    placeholder="EX: MG"
                                    value={formData.addressState}
                                    onChange={e => setFormData({ ...formData, addressState: e.target.value.toUpperCase() })}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t ">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-2xl font-bold transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={mutation.isPending}
                                className={`px-12 py-4 rounded-2xl font-bold text-white shadow-xl transition-all active:scale-[0.98] ${mutation.isPending ? 'bg-gray-400' : 'bg-primary hover:bg-primary/90 shadow-primary/20'}`}
                            >
                                {mutation.isPending ? 'Salvando...' : 'Salvar Funcionário'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <DocumentVault targetId={user.id} targetType="USER" />
                )}
            </div>
        </div>
    );
}

