import { useState, useEffect } from 'react';
import { usersApi } from '../services/users';
import { Users, Plus, Trash2, Edit2, UserPlus, Search, Phone, Calendar, MapPin, SearchCheck, LayoutGrid, List as ListIcon } from 'lucide-react';
import { GlassCard } from '../components/ui/Cards';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'DRIVER';
    licenseNumber?: string;
    phone?: string;
    cpf?: string;
    birthDate?: string;
    entryDate?: string;
    addressStreet?: string;
    addressNumber?: string;
    addressComplement?: string;
    addressNeighborhood?: string;
    addressCity?: string;
    addressState?: string;
    addressZipCode?: string;
    active: boolean;
    createdAt: string;
}

export function Drivers() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [search, setSearch] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'DRIVER' as 'ADMIN' | 'DRIVER',
        licenseNumber: '',
        phone: '',
        cpf: '',
        birthDate: '',
        entryDate: '',
        addressStreet: '',
        addressNumber: '',
        addressComplement: '',
        addressNeighborhood: '',
        addressCity: '',
        addressState: '',
        addressZipCode: '',
    });

    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    useEffect(() => {
        const timer = setTimeout(() => {
            loadUsers(search);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const loadUsers = async (searchTerm?: string) => {
        setLoading(true); // Ensure loading state is active during search
        try {
            const response = await usersApi.getUsers(searchTerm);
            setUsers(response.data);
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleZipCodeBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        const cep = e.target.value.replace(/\D/g, '');
        if (cep.length === 8) {
            try {
                const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                const data = await res.json();
                if (!data.erro) {
                    setFormData(prev => ({
                        ...prev,
                        addressStreet: data.logradouro,
                        addressNeighborhood: data.bairro,
                        addressCity: data.localidade,
                        addressState: data.uf,
                    }));
                }
            } catch (err) {
                console.error("Erro ao buscar CEP:", err);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = { ...formData };
            if (editingUser) {
                await usersApi.updateUser(editingUser.id, payload as any);
            } else {
                await usersApi.createUser(payload as any);
            }
            setIsModalOpen(false);
            resetForm();
            loadUsers(search);
        } catch (error: any) {
            console.error('Error saving user:', error);
            alert(error.response?.data?.message || 'Erro ao salvar funcionário');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja realmente excluir este funcionário?')) return;

        try {
            await usersApi.deleteUser(id);
            loadUsers(search);
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Erro ao excluir funcionário');
        }
    };

    const openEditModal = (user: User) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: '',
            role: user.role,
            licenseNumber: user.licenseNumber || '',
            phone: user.phone || '',
            cpf: user.cpf || '',
            birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : '',
            entryDate: user.entryDate ? new Date(user.entryDate).toISOString().split('T')[0] : '',
            addressStreet: user.addressStreet || '',
            addressNumber: user.addressNumber || '',
            addressComplement: user.addressComplement || '',
            addressNeighborhood: user.addressNeighborhood || '',
            addressCity: user.addressCity || '',
            addressState: user.addressState || '',
            addressZipCode: user.addressZipCode || '',
        });
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            password: '',
            role: 'DRIVER',
            licenseNumber: '',
            phone: '',
            cpf: '',
            birthDate: '',
            entryDate: '',
            addressStreet: '',
            addressNumber: '',
            addressComplement: '',
            addressNeighborhood: '',
            addressCity: '',
            addressState: '',
            addressZipCode: '',
        });
        setEditingUser(null);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        resetForm();
    };

    if (loading && users.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <Users className="w-12 h-12 text-blue-200 mb-4" />
                <div className="text-lg text-muted-foreground font-medium">Sincronizando equipe...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight gradient-text">
                        Gestão de Equipe
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Administre motoristas, administradores e seus dados detalhados.
                    </p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setIsModalOpen(true);
                    }}
                    className="flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-blue-500/25"
                >
                    <UserPlus className="w-5 h-5" />
                    Novo Funcionário
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 group max-w-xl w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar por nome, email ou CPF..."
                        className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl border dark:border-gray-700 shadow-sm">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-md text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                        title="Visualização em Grade"
                    >
                        <LayoutGrid size={20} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-md text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                        title="Visualização em Lista"
                    >
                        <ListIcon size={20} />
                    </button>
                </div>
            </div>

            {/* Users Display */}
            {viewMode === 'list' ? (
                <GlassCard transition={true} className="!p-0 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-700">
                                <tr className="text-gray-400 dark:text-gray-400">
                                    <th className="py-4 px-6 font-bold uppercase tracking-wider">Funcionário</th>
                                    <th className="py-4 px-6 font-bold uppercase tracking-wider">Contato / CPF</th>
                                    <th className="py-4 px-6 font-bold uppercase tracking-wider">Cargo</th>
                                    <th className="py-4 px-6 font-bold uppercase tracking-wider">CNH</th>
                                    <th className="py-4 px-6 font-bold uppercase tracking-wider text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {users.map((user) => (
                                    <tr key={user.id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all">
                                        <td className="py-5 px-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/10 group-hover:scale-110 transition-transform">
                                                    <Users className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors uppercase tracking-tight">{user.name}</div>
                                                    <div className="text-xs text-muted-foreground">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-sm font-bold">
                                                    <Phone className="w-3.5 h-3.5 text-blue-500" />
                                                    {user.phone || '—'}
                                                </div>
                                                <div className="text-xs text-gray-400 font-mono font-medium">{user.cpf || 'CPF não informado'}</div>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                }`}>
                                                {user.role === 'ADMIN' ? 'Administrador' : 'Motorista'}
                                            </span>
                                        </td>
                                        <td className="py-5 px-6 text-sm font-black text-gray-500 dark:text-gray-400">
                                            {user.licenseNumber || '—'}
                                        </td>
                                        <td className="py-5 px-6 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => openEditModal(user)}
                                                    className="p-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 rounded-xl transition-all"
                                                    title="Editar"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user.id)}
                                                    className="p-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded-xl transition-all"
                                                    title="Excluir"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </GlassCard>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {users.map((user) => (
                        <GlassCard key={user.id} transition={true} className="relative group">
                            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEditModal(user)} className="p-2 bg-white dark:bg-gray-800 shadow-xl rounded-full text-blue-600 hover:scale-110 active:scale-95 transition-all">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDelete(user.id)} className="p-2 bg-white dark:bg-gray-800 shadow-xl rounded-full text-red-600 hover:scale-110 active:scale-95 transition-all">
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="flex flex-col items-center text-center mb-6">
                                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-2xl shadow-blue-500/30 mb-4 group-hover:scale-105 transition-transform">
                                    <Users className="w-10 h-10" />
                                </div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{user.name}</h3>
                                <p className="text-xs text-muted-foreground mt-1 mb-4">{user.email}</p>
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                    {user.role === 'ADMIN' ? 'Administrador' : 'Motorista'}
                                </span>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-400 font-bold uppercase tracking-tighter">CNH</span>
                                    <span className="font-black text-gray-900 dark:text-white">{user.licenseNumber || '—'}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-400 font-bold uppercase tracking-tighter">CPF</span>
                                    <span className="font-mono text-gray-700 dark:text-gray-300">{user.cpf || '—'}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-400 font-bold uppercase tracking-tighter">Telefone</span>
                                    <span className="font-bold text-blue-600 dark:text-blue-400">{user.phone || '—'}</span>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}

            {(users.length === 0 && !loading) && (
                <div className="text-center py-20 flex flex-col items-center bg-white/50 dark:bg-gray-800/20 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400 mb-4">
                        <SearchCheck size={32} />
                    </div>
                    <h3 className="text-xl font-black">Nenhum funcionário encontrado</h3>
                    <p className="text-muted-foreground font-medium">Tente buscar por outro nome, email ou CPF.</p>
                </div>
            )}


            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="glass-card max-w-4xl w-full p-8 max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl relative">
                        <div className="absolute top-0 right-0 p-4">
                            <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 rounded-full transition-all text-gray-400"><Plus className="rotate-45" /></button>
                        </div>

                        <h2 className="text-3xl font-black mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            {editingUser ? 'Editar Cadastro' : 'Novo Funcionário'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                {/* Seção 1: Dados Pessoais */}
                                <div className="space-y-6">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <Users size={14} /> Dados Profissionais
                                    </h3>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">Nome Completo</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                            required
                                        />
                                    </div>

                                    {!editingUser && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-gray-700 ml-1">Email</label>
                                                <input
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-gray-700 ml-1">Senha</label>
                                                <input
                                                    type="password"
                                                    value={formData.password}
                                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                                    required
                                                    minLength={6}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700 ml-1">Telefone</label>
                                            <input
                                                type="text"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                                placeholder="(00) 00000-0000"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700 ml-1">CPF</label>
                                            <input
                                                type="text"
                                                value={formData.cpf}
                                                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                                                className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-mono"
                                                placeholder="000.000.000-00"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-1">
                                                <Calendar size={14} /> Data de Nascimento
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.birthDate}
                                                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                                                className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-1">
                                                <Calendar size={14} /> Data de Admissão
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.entryDate}
                                                onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })}
                                                className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700 ml-1">Cargo</label>
                                            <select
                                                value={formData.role}
                                                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'DRIVER' })}
                                                className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold"
                                            >
                                                <option value="DRIVER">Motorista</option>
                                                <option value="ADMIN">Administrador</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700 ml-1">CNH</label>
                                            <input
                                                type="text"
                                                value={formData.licenseNumber}
                                                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                                                className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Seção 2: Endereço */}
                                <div className="space-y-6">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <MapPin size={14} /> Localização / Endereço
                                    </h3>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="col-span-1 space-y-2">
                                            <label className="text-sm font-bold text-gray-700 ml-1">CEP</label>
                                            <input
                                                type="text"
                                                value={formData.addressZipCode}
                                                onChange={(e) => setFormData({ ...formData, addressZipCode: e.target.value })}
                                                onBlur={handleZipCodeBlur}
                                                placeholder="00000-000"
                                                className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold text-blue-600"
                                            />
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <label className="text-sm font-bold text-gray-700 ml-1">Cidade</label>
                                            <input
                                                type="text"
                                                value={formData.addressCity}
                                                onChange={(e) => setFormData({ ...formData, addressCity: e.target.value })}
                                                className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-4 gap-4">
                                        <div className="col-span-3 space-y-2">
                                            <label className="text-sm font-bold text-gray-700 ml-1">Rua / Logradouro</label>
                                            <input
                                                type="text"
                                                value={formData.addressStreet}
                                                onChange={(e) => setFormData({ ...formData, addressStreet: e.target.value })}
                                                className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                            />
                                        </div>
                                        <div className="col-span-1 space-y-2">
                                            <label className="text-sm font-bold text-gray-700 ml-1">Nº</label>
                                            <input
                                                type="text"
                                                value={formData.addressNumber}
                                                onChange={(e) => setFormData({ ...formData, addressNumber: e.target.value })}
                                                className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">Bairro</label>
                                        <input
                                            type="text"
                                            value={formData.addressNeighborhood}
                                            onChange={(e) => setFormData({ ...formData, addressNeighborhood: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700 ml-1">UF</label>
                                            <input
                                                type="text"
                                                maxLength={2}
                                                value={formData.addressState}
                                                onChange={(e) => setFormData({ ...formData, addressState: e.target.value.toUpperCase() })}
                                                className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold uppercase"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700 ml-1">Complemento</label>
                                            <input
                                                type="text"
                                                value={formData.addressComplement}
                                                onChange={(e) => setFormData({ ...formData, addressComplement: e.target.value })}
                                                className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-8">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 px-8 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                                >
                                    Descartar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] transition-all"
                                >
                                    {editingUser ? 'Atualizar Dados' : 'Finalizar Cadastro'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
