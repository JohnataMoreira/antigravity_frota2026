import { useState, useEffect } from 'react';
import { usersApi } from '../services/users';
import { Users, Plus, Trash2, Edit2, UserPlus, Search, Phone, Calendar, MapPin, SearchCheck, LayoutGrid, List as ListIcon, Camera, Upload, Columns, Map } from 'lucide-react';
import { GlassCard } from '../components/ui/Cards';
import { CameraCapture } from '../components/ui/CameraCapture';
import { api } from '../lib/axios';
import { KanbanBoard } from '../components/KanbanBoard';

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
    avatarUrl?: string;
    active: boolean;
    createdAt: string;
}

export function Drivers() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [search, setSearch] = useState('');
    const [journeys, setJourneys] = useState<any[]>([]);

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
        avatarUrl: '',
    });

    const [tempAvatar, setTempAvatar] = useState<File | null>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);

    const [viewMode, setViewMode] = useState<'list' | 'grid' | 'kanban'>('grid');

    useEffect(() => {
        const timer = setTimeout(() => {
            loadUsers(search);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const loadUsers = async (searchTerm?: string) => {
        setLoading(true);
        try {
            const [usersRes, journeysRes] = await Promise.all([
                usersApi.getUsers(searchTerm),
                api.get('/journeys')
            ]);
            setUsers(usersRes.data);
            setJourneys(journeysRes.data);
        } catch (error) {
            console.error('Error loading data:', error);
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
            let avatarUrl = formData.avatarUrl;

            // If there's a new photo, upload it first
            if (tempAvatar) {
                const uploadData = new FormData();
                uploadData.append('file', tempAvatar);
                uploadData.append('type', 'IMAGE');
                const uploadRes = await api.post('/attachments/upload', uploadData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                avatarUrl = uploadRes.data.url;
            }

            const payload = { ...formData, avatarUrl };
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
            avatarUrl: user.avatarUrl || '',
        });
        setTempAvatar(null);
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
            avatarUrl: '',
        });
        setTempAvatar(null);
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
                    className="flex items-center justify-center gap-2 px-8 py-3.5 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20"
                >
                    <UserPlus className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    Novo Funcionário
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 group max-w-xl w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar por nome, email ou CPF..."
                        className="w-full pl-12 pr-4 py-3.5 bg-card border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-foreground placeholder:text-muted-foreground/40"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex bg-muted p-1.5 rounded-2xl border border-border shadow-sm">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-background shadow-md text-primary' : 'text-muted-foreground/40 hover:text-foreground'}`}
                        title="Visualização em Grade"
                    >
                        <LayoutGrid size={20} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-background shadow-md text-primary' : 'text-muted-foreground/40 hover:text-foreground'}`}
                        title="Visualização em Lista"
                    >
                        <ListIcon size={20} />
                    </button>
                    <button
                        onClick={() => setViewMode('kanban')}
                        className={`p-2.5 rounded-xl transition-all ${viewMode === 'kanban' ? 'bg-background shadow-md text-primary' : 'text-muted-foreground/40 hover:text-foreground'}`}
                        title="Visualização Kanban"
                    >
                        <Columns size={20} />
                    </button>
                </div>
            </div>

            {/* Users Display */}
            {viewMode === 'list' ? (
                <GlassCard transition={true} className="!p-0 overflow-hidden border border-border/50">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/50 border-b border-border">
                                <tr className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">
                                    <th className="py-4 px-6">Funcionário</th>
                                    <th className="py-4 px-6">Contato / CPF</th>
                                    <th className="py-4 px-6">Cargo</th>
                                    <th className="py-4 px-6">CNH</th>
                                    <th className="py-4 px-6 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {users.map((user: User) => (
                                    <tr key={user.id} className="group hover:bg-primary/5 transition-all">
                                        <td className="py-5 px-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/10 group-hover:scale-110 transition-transform overflow-hidden relative">
                                                    {user.avatarUrl ? (
                                                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center">
                                                            <Users className="w-6 h-6" />
                                                            <span className="text-[6px] font-bold uppercase">Sem Foto</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-black text-foreground group-hover:text-primary transition-colors uppercase tracking-tight">{user.name}</div>
                                                    <div className="text-[10px] text-muted-foreground/60 font-bold uppercase">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-sm font-black text-foreground">
                                                    <Phone className="w-3.5 h-3.5 text-primary" />
                                                    {user.phone || '—'}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground/50 font-mono font-bold uppercase tracking-widest">{user.cpf || 'CPF não informado'}</div>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${user.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' : 'bg-primary/10 text-primary border border-primary/20'
                                                }`}>
                                                {user.role === 'ADMIN' ? 'Administrador' : 'Motorista'}
                                            </span>
                                        </td>
                                        <td className="py-5 px-6 text-sm font-black text-muted-foreground/80">
                                            {user.licenseNumber || '—'}
                                        </td>
                                        <td className="py-5 px-6 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => openEditModal(user)}
                                                    className="p-2.5 hover:bg-primary/10 text-primary rounded-xl transition-all"
                                                    title="Editar"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user.id)}
                                                    className="p-2.5 hover:bg-destructive/10 text-destructive rounded-xl transition-all"
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
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {users.map((user: User) => (
                        <GlassCard key={user.id} transition={true} className="relative group p-0 overflow-hidden flex flex-col">
                            {/* Actions Overlay */}
                            <div className="absolute top-4 right-4 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEditModal(user)} className="p-2 bg-background/80 backdrop-blur shadow-xl rounded-full text-primary hover:scale-110 active:scale-95 transition-all border border-border">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDelete(user.id)} className="p-2 bg-background/80 backdrop-blur shadow-xl rounded-full text-destructive hover:scale-110 active:scale-95 transition-all border border-border">
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            {/* Prominent Photo Area */}
                            <div className="h-48 w-full bg-muted relative group-hover:scale-105 transition-transform duration-500">
                                {user.avatarUrl ? (
                                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-muted/50 text-muted-foreground/30">
                                        <Users className="w-16 h-16 opacity-20" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] mt-2">Sem Foto</span>
                                        <button
                                            onClick={() => openEditModal(user)}
                                            className="mt-4 flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full text-[10px] font-black uppercase shadow-sm hover:scale-105 transition-all"
                                        >
                                            <Camera size={12} /> Adicionar Foto
                                        </button>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                                <div className="absolute bottom-4 left-4 text-white z-10">
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${user.role === 'ADMIN' ? 'bg-purple-500' : 'bg-primary'}`}>
                                        {user.role === 'ADMIN' ? 'Admin' : 'Condutor'}
                                    </span>
                                </div>
                            </div>

                            <div className="p-5 flex-1 flex flex-col bg-card/50">
                                <div className="mb-4">
                                    <h3 className="text-xl font-black text-foreground uppercase tracking-tight break-words leading-tight group-hover:text-primary transition-colors">{user.name}</h3>
                                    <p className="text-[10px] text-muted-foreground/60 mt-1 truncate font-bold uppercase tracking-wider">{user.email}</p>
                                </div>

                                <div className="space-y-3 pt-4 border-t border-border mt-auto">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground/40 font-black uppercase tracking-tighter">CNH</span>
                                        <span className="font-black text-foreground">{user.licenseNumber || '—'}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground/40 font-black uppercase tracking-tighter">Telefone</span>
                                        <span className="font-black text-primary">{user.phone || '—'}</span>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            ) : (
                <KanbanBoard
                    columns={[
                        { id: 'IN_JOURNEY', title: 'Em Jornada', count: 0, color: 'bg-green-500' },
                        { id: 'AVAILABLE', title: 'Disponíveis', count: 0, color: 'bg-blue-500' },
                        { id: 'INACTIVE', title: 'Inativos/Pendentes', count: 0, color: 'bg-gray-400' },
                    ]}
                    items={users}
                    getItemColumnId={(user) => {
                        if (!user.active) return 'INACTIVE';
                        const hasActiveJourney = journeys.some(j => j.driverId === user.id && j.status === 'IN_PROGRESS');
                        return hasActiveJourney ? 'IN_JOURNEY' : 'AVAILABLE';
                    }}
                    renderCard={(user) => (
                        <GlassCard transition={true} className="!p-4 relative group border border-border/50 hover:border-primary/30 transition-all">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                                    {user.avatarUrl ? (
                                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                                            <Users size={20} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-black text-foreground uppercase tracking-tighter text-sm truncate group-hover:text-primary transition-colors">{user.name}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${user.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-500' : 'bg-primary/10 text-primary'}`}>
                                            {user.role === 'ADMIN' ? 'Admin' : 'Motorista'}
                                        </span>
                                        {journeys.some(j => j.driverId === user.id && j.status === 'IN_PROGRESS') && (
                                            <span className="text-[8px] font-black uppercase text-emerald-500 flex items-center gap-0.5">
                                                <Map size={8} /> Em Viagem
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                                    <button onClick={() => openEditModal(user)} className="p-1.5 hover:bg-primary/10 text-primary rounded-lg">
                                        <Edit2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </GlassCard>
                    )}
                />
            )}

            {(users.length === 0 && !loading) && (
                <div className="text-center py-20 flex flex-col items-center bg-card/30 backdrop-blur rounded-3xl border-2 border-dashed border-border/40">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center text-muted-foreground/30 mb-4">
                        <SearchCheck size={32} />
                    </div>
                    <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Nenhum funcionário encontrado</h3>
                    <p className="text-muted-foreground/60 font-bold uppercase text-xs tracking-widest mt-2">Tente buscar por outro nome, email ou CPF.</p>
                </div>
            )}


            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-background/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="glass-card max-w-4xl w-full p-8 max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl relative bg-card border border-border/50">
                        <div className="absolute top-0 right-0 p-4">
                            <button onClick={handleCloseModal} className="p-2 hover:bg-muted rounded-full transition-all text-muted-foreground/40"><Plus className="rotate-45" /></button>
                        </div>

                        <h2 className="text-3xl font-black mb-8 bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent uppercase tracking-tighter">
                            {editingUser ? 'Editar Cadastro' : 'Novo Funcionário'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                {/* Seção 1: Dados Pessoais */}
                                <div className="space-y-6">
                                    <h3 className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Users size={14} /> Dados Profissionais e Foto
                                    </h3>

                                    <div className="flex items-center gap-6 p-4 bg-muted/30 rounded-3xl border border-border/50 mb-4">
                                        <div className="w-24 h-24 rounded-2xl bg-card shadow-md overflow-hidden flex items-center justify-center group relative border-2 border-dashed border-border/50">
                                            {tempAvatar || formData.avatarUrl ? (
                                                <img
                                                    src={tempAvatar ? URL.createObjectURL(tempAvatar) : formData.avatarUrl}
                                                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                                    alt="Avatar Preview"
                                                />
                                            ) : (
                                                <Users className="w-10 h-10 text-muted-foreground/20" />
                                            )}
                                            {(tempAvatar || formData.avatarUrl) && (
                                                <div
                                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                                                    onClick={() => {
                                                        setTempAvatar(null);
                                                        setFormData(prev => ({ ...prev, avatarUrl: '' }));
                                                    }}
                                                >
                                                    <Trash2 className="text-white w-6 h-6" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">Foto de Perfil</p>
                                            <div className="flex gap-2">
                                                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary/10 text-primary rounded-xl font-black uppercase tracking-widest text-[10px] cursor-pointer hover:bg-primary/20 transition-all border border-primary/20">
                                                    <Upload size={14} /> Upload
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) setTempAvatar(file);
                                                        }}
                                                    />
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsCameraOpen(true)}
                                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-500/10 text-purple-500 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-purple-500/20 transition-all border border-purple-500/20"
                                                >
                                                    <Camera size={14} /> Tirar Foto
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-muted-foreground/60 ml-1 uppercase tracking-wider">Nome Completo</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-3 bg-muted/50 border border-border/50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground font-black uppercase tracking-tight placeholder:text-muted-foreground/30"
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
                                            <label className="text-xs font-black text-muted-foreground/60 ml-1 uppercase tracking-wider">Telefone</label>
                                            <input
                                                type="text"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                className="w-full px-4 py-3 bg-muted/50 border border-border/50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground font-bold"
                                                placeholder="(00) 00000-0000"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-muted-foreground/60 ml-1 uppercase tracking-wider">CPF</label>
                                            <input
                                                type="text"
                                                value={formData.cpf}
                                                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                                                className="w-full px-4 py-3 bg-muted/50 border border-border/50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono text-foreground font-bold"
                                                placeholder="000.000.000-00"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-muted-foreground/60 ml-1 uppercase tracking-wider flex items-center gap-1">
                                                <Calendar size={14} /> Data de Nascimento
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.birthDate}
                                                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                                                className="w-full px-4 py-3 bg-muted/50 border border-border/50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-muted-foreground/60 ml-1 uppercase tracking-wider flex items-center gap-1">
                                                <Calendar size={14} /> Data de Admissão
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.entryDate}
                                                onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })}
                                                className="w-full px-4 py-3 bg-muted/50 border border-border/50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground font-bold"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-muted-foreground/60 ml-1 uppercase tracking-wider">Cargo</label>
                                            <select
                                                value={formData.role}
                                                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'DRIVER' })}
                                                className="w-full px-4 py-3 bg-muted/50 border border-border/50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 transition-all font-black text-foreground uppercase tracking-widest text-xs"
                                            >
                                                <option value="DRIVER">Motorista</option>
                                                <option value="ADMIN">Administrador</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-muted-foreground/60 ml-1 uppercase tracking-wider">CNH</label>
                                            <input
                                                type="text"
                                                value={formData.licenseNumber}
                                                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                                                className="w-full px-4 py-3 bg-muted/50 border border-border/50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 transition-all font-black text-foreground uppercase tracking-tight"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Seção 2: Endereço */}
                                <div className="space-y-6">
                                    <h3 className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <MapPin size={14} /> Localização / Endereço
                                    </h3>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="col-span-1 space-y-2">
                                            <label className="text-xs font-black text-muted-foreground/60 ml-1 uppercase tracking-wider">CEP</label>
                                            <input
                                                type="text"
                                                value={formData.addressZipCode}
                                                onChange={(e) => setFormData({ ...formData, addressZipCode: e.target.value })}
                                                onBlur={handleZipCodeBlur}
                                                placeholder="00000-000"
                                                className="w-full px-4 py-3 bg-muted/50 border border-border/50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 transition-all font-black text-primary"
                                            />
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <label className="text-xs font-black text-muted-foreground/60 ml-1 uppercase tracking-wider">Cidade</label>
                                            <input
                                                type="text"
                                                value={formData.addressCity}
                                                onChange={(e) => setFormData({ ...formData, addressCity: e.target.value })}
                                                className="w-full px-4 py-3 bg-muted/50 border border-border/50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground font-bold"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-4 gap-4">
                                        <div className="col-span-3 space-y-2">
                                            <label className="text-xs font-black text-muted-foreground/60 ml-1 uppercase tracking-wider">Rua / Logradouro</label>
                                            <input
                                                type="text"
                                                value={formData.addressStreet}
                                                onChange={(e) => setFormData({ ...formData, addressStreet: e.target.value })}
                                                className="w-full px-4 py-3 bg-muted/50 border border-border/50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground"
                                            />
                                        </div>
                                        <div className="col-span-1 space-y-2">
                                            <label className="text-xs font-black text-muted-foreground/60 ml-1 uppercase tracking-wider">Nº</label>
                                            <input
                                                type="text"
                                                value={formData.addressNumber}
                                                onChange={(e) => setFormData({ ...formData, addressNumber: e.target.value })}
                                                className="w-full px-4 py-3 bg-muted/50 border border-border/50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 transition-all font-black text-foreground"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-muted-foreground/60 ml-1 uppercase tracking-wider">Bairro</label>
                                        <input
                                            type="text"
                                            value={formData.addressNeighborhood}
                                            onChange={(e) => setFormData({ ...formData, addressNeighborhood: e.target.value })}
                                            className="w-full px-4 py-3 bg-muted/50 border border-border/50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-muted-foreground/60 ml-1 uppercase tracking-wider">UF</label>
                                            <input
                                                type="text"
                                                maxLength={2}
                                                value={formData.addressState}
                                                onChange={(e) => setFormData({ ...formData, addressState: e.target.value.toUpperCase() })}
                                                className="w-full px-4 py-3 bg-muted/50 border border-border/50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 transition-all font-black text-foreground uppercase"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-muted-foreground/60 ml-1 uppercase tracking-wider">Complemento</label>
                                            <input
                                                type="text"
                                                value={formData.addressComplement}
                                                onChange={(e) => setFormData({ ...formData, addressComplement: e.target.value })}
                                                className="w-full px-4 py-3 bg-muted/50 border border-border/50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-8 border-t border-border mt-8">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 px-8 py-4 bg-muted text-muted-foreground/60 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-muted/80 transition-all"
                                >
                                    Descartar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98] transition-all"
                                >
                                    {editingUser ? 'Atualizar Dados' : 'Finalizar Cadastro'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {isCameraOpen && (
                <CameraCapture
                    onCapture={(file) => {
                        setTempAvatar(file);
                        setIsCameraOpen(false);
                    }}
                    onClose={() => setIsCameraOpen(false)}
                />
            )}
        </div>
    );
}
