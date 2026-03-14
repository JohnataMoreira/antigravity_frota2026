import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SEO } from '@/components/SEO';
import { api } from '../../lib/axios';
import { useState } from 'react';
import { GlassCard, StatCard } from '../../components/ui/Cards';
import {
    Users as UsersIcon,
    Search,
    Filter,
    Plus,
    MoreVertical,
    UserCheck,
    UserX,
    Shield,
    Truck,
    Mail,
    Phone,
    Calendar,
    Edit2,
    Link as LinkIcon,
    Trash2
} from 'lucide-react';
import { UserModal } from './UserModal';
// import { InviteModal } from './InviteModal';
import { ExportDropdown } from '../../components/ExportDropdown';
import { ExportColumn } from '../../lib/export';
import { clsx } from 'clsx';

const exportColumns: ExportColumn<any>[] = [
    { header: 'Nome', key: 'name' },
    { header: 'Email', key: 'email' },
    { header: 'CPF', key: 'document', format: (val) => val || '—' },
    { header: 'Papel', key: 'role', format: (val) => val === 'ADMIN' ? 'Gestor' : 'Motorista' },
    { header: 'Status', key: 'active', format: (val) => val ? 'Ativo' : 'Inativo' },
    { header: 'Data Cadastro', key: 'createdAt', format: (val) => new Date(val).toLocaleDateString('pt-BR') }
];

export function UsersList() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    // const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

    const { data: usersData = [], isLoading } = useQuery({
        queryKey: ['users', search, roleFilter],
        queryFn: async () => {
            const res = await api.get('/users', {
                params: { search, role: roleFilter }
            });
            return res.data;
        },
        placeholderData: (previousData) => previousData
    });

    const activeCount = usersData.filter((u: any) => u.active).length;
    const driverCount = usersData.filter((u: any) => u.role === 'DRIVER').length;
    const adminCount = usersData.filter((u: any) => u.role === 'ADMIN').length;

    const { data: invites = [] } = useQuery({
        queryKey: ['invites'],
        queryFn: async () => {
            const res = await api.get('/invites');
            return res.data;
        }
    });

    const users = usersData.filter((u: any) => {
        if (statusFilter === 'ACTIVE') return u.active === true;
        if (statusFilter === 'INACTIVE') return u.active === false;
        return true;
    });

    const cancelInviteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/invites/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invites'] });
        }
    });

    const toggleStatusMutation = useMutation({
        mutationFn: (userId: string) => api.patch(`/users/${userId}/toggle`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        }
    });

    const handleEdit = (user: any) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedUser(null);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <SEO 
                title="Colaboradores" 
                description="Gestão de motoristas, gestores e permissões da organização." 
            />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                        <UsersIcon size={32} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter gradient-text uppercase">
                            Recursos Humanos
                        </h1>
                        <p className="text-muted-foreground/60 font-black uppercase tracking-[0.2em] mt-1 text-[10px]">
                            Administração de gestores e motoristas da organização
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3 items-center">
                    <ExportDropdown
                        data={users}
                        columns={exportColumns}
                        filename={`Frota2026_Usuarios_${new Date().toISOString().split('T')[0]}`}
                        pdfTitle="Relatório de Recursos Humanos"
                    />

                    <button
                        onClick={handleAdd}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all group"
                    >
                        <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                        Novo Funcionário
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    label="Total de Colaboradores"
                    value={usersData.length}
                    icon={<UsersIcon className="w-8 h-8" />}
                />
                <StatCard
                    label="Gestores / Equipe"
                    value={adminCount}
                    icon={<Shield className="w-8 h-8" />}
                    variant="info"
                />
                <StatCard
                    label="Motoristas Ativos"
                    value={driverCount}
                    icon={<Truck className="w-8 h-8" />}
                    variant="success"
                />
            </div>

            {/* Pending Invites Section */}
            {invites.some((i: any) => i.status === 'PENDING') && (
                <div className="animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center gap-3 mb-4">
                        <Mail className="text-primary" size={20} />
                        <h2 className="text-xl font-bold text-foreground">Convites Pendentes</h2>
                        <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs font-black">
                            {invites.filter((i: any) => i.status === 'PENDING').length}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        {invites.filter((i: any) => i.status === 'PENDING').map((invite: any) => (
                            <div key={invite.id} className="bg-card border border-border p-4 rounded-2xl flex justify-between items-center shadow-sm group hover:border-primary/50 transition-all">
                                <div className="space-y-1 overflow-hidden">
                                    <p className="text-sm font-bold truncate text-foreground">{invite.email}</p>
                                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">
                                        Papel: {invite.role === 'ADMIN' ? 'Gestor' : 'Motorista'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        if (confirm('Deseja cancelar este convite?')) {
                                            cancelInviteMutation.mutate(invite.id);
                                        }
                                    }}
                                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-card p-4 rounded-2xl border border-border shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 items-center flex-1 w-full max-w-2xl">
                    <div className="flex items-center gap-3 bg-muted p-2 rounded-xl border border-border shadow-sm flex-1 w-full focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                        <Search size={22} className="text-muted-foreground ml-2" />
                        <input
                            placeholder="Buscar por nome, email ou CPF..."
                            className="bg-transparent outline-none flex-1 py-2 font-medium"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-muted p-2 rounded-xl border border-border shadow-sm w-full md:w-auto">
                        <Filter size={20} className="text-muted-foreground ml-2" />
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="bg-transparent outline-none text-sm font-bold pr-8 py-2 text-foreground"
                        >
                            <option value="ALL" className="bg-card">Papel: Todos</option>
                            <option value="ADMIN" className="bg-card">Gestores</option>
                            <option value="DRIVER" className="bg-card">Motoristas</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2 bg-muted p-2 rounded-xl border border-border shadow-sm w-full md:w-auto">
                        <UserCheck size={20} className="text-muted-foreground ml-2" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-transparent outline-none text-sm font-bold pr-8 py-2 text-foreground"
                        >
                            <option value="ALL" className="bg-card">Status: Todos</option>
                            <option value="ACTIVE" className="bg-card">Ativos</option>
                            <option value="INACTIVE" className="bg-card">Inativos</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Users Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {users.map((user: any) => (
                    <GlassCard key={user.id} className={`group transition-all hover:scale-[1.02] border-t-4 ${user.active ? 'border-primary' : 'border-muted-foreground opacity-60'}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-2xl ${user.role === 'ADMIN' ? 'bg-emerald-500/10 text-emerald-500 ' : 'bg-primary/10 text-primary '}`}>
                                {user.role === 'ADMIN' ? <Shield size={24} /> : <Truck size={24} />}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEdit(user)}
                                    className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-primary"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => toggleStatusMutation.mutate(user.id)}
                                    disabled={toggleStatusMutation.isPending}
                                    className={`p-2 hover:bg-muted rounded-lg transition-colors ${user.active ? 'text-emerald-500' : 'text-destructive'}`}
                                    title={user.active ? 'Desativar Usuário' : 'Ativar Usuário'}
                                >
                                    {user.active ? <UserCheck size={18} /> : <UserX size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h3 className="text-xl font-bold truncate text-foreground">{user.name}</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/90 ">
                                    {user.role === 'ADMIN' ? 'Gestor Administrativo' : 'Motorista Operacional'}
                                </p>
                            </div>

                            <div className="space-y-2 text-sm font-medium">
                                <div className="flex items-center gap-2 text-muted-foreground/90 ">
                                    <Mail size={14} className="text-primary/70 shrink-0" />
                                    <span className="truncate flex-1">{user.email}</span>
                                </div>
                                {user.phone && (
                                    <div className="flex items-center gap-2 text-muted-foreground/90 ">
                                        <Phone size={14} className="text-primary/70" />
                                        <span>{user.phone}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-muted-foreground/90 ">
                                    <Calendar size={14} />
                                    <span>Cadastrado em {new Date(user.createdAt).toLocaleDateString('pt-BR')}</span>
                                </div>
                            </div>

                            {user.role === 'DRIVER' && user.licenseNumber && (
                                <div className="pt-3 border-t border-border">
                                    <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">CNH</div>
                                    <div className="font-mono text-sm tracking-widest text-foreground">{user.licenseNumber}</div>
                                </div>
                            )}
                        </div>
                    </GlassCard>
                ))}
            </div>

            {isModalOpen && (
                <UserModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    user={selectedUser}
                />
            )}


        </div>
    );
}

