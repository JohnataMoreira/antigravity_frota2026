import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { useState } from 'react';
import { GlassCard } from '../../components/ui/Cards';
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
 Edit2
} from 'lucide-react';
import { UserModal } from './UserModal';

export function UsersList() {
 const queryClient = useQueryClient();
 const [search, setSearch] = useState('');
 const [roleFilter, setRoleFilter] = useState('ALL');
 const [selectedUser, setSelectedUser] = useState<any>(null);
 const [isModalOpen, setIsModalOpen] = useState(false);

 const { data: users = [], isLoading } = useQuery({
 queryKey: ['users', search, roleFilter],
 queryFn: async () => {
 const res = await api.get('/users', {
 params: { search, role: roleFilter }
 });
 return res.data;
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

 if (isLoading) return <div className="p-8 text-center animate-pulse">Carregando usuários...</div>;

 return (
 <div className="space-y-8">
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div>
 <h1 className="text-4xl font-extrabold tracking-tight gradient-text">
 Gestão de Funcionários
 </h1>
 <p className="text-muted-foreground mt-2 text-lg">
 Administre gestores e motoristas da sua organização.
 </p>
 </div>

 <button
 onClick={handleAdd}
 className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all group"
 >
 <Plus size={20} className="group-hover:rotate-90 transition-transform" />
 Novo Funcionário
 </button>
 </div>

 {/* Filter Bar */}
 <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
 <div className="flex flex-col md:flex-row gap-4 items-center flex-1 w-full max-w-2xl">
 <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-100 shadow-sm flex-1 w-full focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
 <Search size={22} className="text-gray-400 ml-2" />
 <input
 placeholder="Buscar por nome, email ou CPF..."
 className="bg-transparent outline-none flex-1 py-2 font-medium"
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 />
 </div>

 <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-100 shadow-sm w-full md:w-auto">
 <Filter size={20} className="text-gray-400 ml-2" />
 <select
 value={roleFilter}
 onChange={(e) => setRoleFilter(e.target.value)}
 className="bg-transparent outline-none text-sm font-bold pr-8 py-2"
 >
 <option value="ALL">Todos os Papéis</option>
 <option value="ADMIN">Gestores</option>
 <option value="DRIVER">Motoristas</option>
 </select>
 </div>
 </div>
 </div>

 {/* Users Grid */}
 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
 {users.map((user: any) => (
 <GlassCard key={user.id} className={`group transition-all hover:scale-[1.02] border-t-4 ${user.active ? 'border-blue-500' : 'border-gray-400 opacity-60'}`}>
 <div className="flex justify-between items-start mb-4">
 <div className={`p-3 rounded-2xl ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-600 ' : 'bg-blue-100 text-blue-600 '}`}>
 {user.role === 'ADMIN' ? <Shield size={24} /> : <Truck size={24} />}
 </div>
 <div className="flex gap-2">
 <button
 onClick={() => handleEdit(user)}
 className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-blue-500"
 >
 <Edit2 size={18} />
 </button>
 <button
 onClick={() => toggleStatusMutation.mutate(user.id)}
 disabled={toggleStatusMutation.isPending}
 className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${user.active ? 'text-green-500' : 'text-red-500'}`}
 title={user.active ? 'Desativar Usuário' : 'Ativar Usuário'}
 >
 {user.active ? <UserCheck size={18} /> : <UserX size={18} />}
 </button>
 </div>
 </div>

 <div className="space-y-4">
 <div>
 <h3 className="text-xl font-bold truncate">{user.name}</h3>
 <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/90 ">
 {user.role === 'ADMIN' ? 'Gestor Administrativo' : 'Motorista Operacional'}
 </p>
 </div>

 <div className="space-y-2 text-sm font-medium">
 <div className="flex items-center gap-2 text-muted-foreground/90 ">
 <Mail size={14} className="text-primary/70" />
 <span className="truncate">{user.email}</span>
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
 <div className="pt-3 border-t ">
 <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">CNH</div>
 <div className="font-mono text-sm tracking-widest">{user.licenseNumber}</div>
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

