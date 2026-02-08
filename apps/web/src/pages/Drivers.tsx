import { useState, useEffect } from 'react';
import { usersApi } from '../services/users';
import { Users, Plus, Trash2, Edit2, UserPlus } from 'lucide-react';
import { GlassCard } from '../components/ui/Cards';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'DRIVER';
    licenseNumber?: string;
    createdAt: string;
}

export function Drivers() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'DRIVER' as 'ADMIN' | 'DRIVER',
        licenseNumber: '',
    });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const response = await usersApi.getUsers();
            setUsers(response.data);
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingUser) {
                await usersApi.updateUser(editingUser.id, {
                    name: formData.name,
                    role: formData.role,
                    licenseNumber: formData.licenseNumber || undefined,
                });
            } else {
                await usersApi.createUser({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    role: formData.role,
                    licenseNumber: formData.licenseNumber || undefined,
                });
            }
            setIsModalOpen(false);
            resetForm();
            loadUsers();
        } catch (error: any) {
            console.error('Error saving user:', error);
            alert(error.response?.data?.message || 'Erro ao salvar funcionário');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja realmente excluir este funcionário?')) return;

        try {
            await usersApi.deleteUser(id);
            loadUsers();
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
        });
        setEditingUser(null);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        resetForm();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-lg text-muted-foreground">Carregando...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight gradient-text">
                        Funcionários
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Gerencie os funcionários da organização
                    </p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setIsModalOpen(true);
                    }}
                    className="
            flex items-center gap-2 px-6 py-3
            bg-primary text-primary-foreground
            rounded-lg font-medium
            hover:scale-105 active:scale-95
            transition-all duration-200
            shadow-lg hover:shadow-xl
          "
                >
                    <UserPlus className="w-5 h-5" />
                    Adicionar Funcionário
                </button>
            </div>

            {/* Users Table */}
            <GlassCard gradient={true}>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border/50">
                                <th className="text-left py-4 px-4 font-semibold">Nome</th>
                                <th className="text-left py-4 px-4 font-semibold">Email</th>
                                <th className="text-left py-4 px-4 font-semibold">Cargo</th>
                                <th className="text-left py-4 px-4 font-semibold">CNH</th>
                                <th className="text-right py-4 px-4 font-semibold">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr
                                    key={user.id}
                                    className="border-b border-border/30 hover:bg-muted/30 transition-colors"
                                >
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                                <Users className="w-5 h-5 text-primary" />
                                            </div>
                                            <span className="font-medium">{user.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-muted-foreground">{user.email}</td>
                                    <td className="py-4 px-4">
                                        <span
                                            className={`
                        px-3 py-1 rounded-full text-xs font-medium
                        ${user.role === 'ADMIN'
                                                    ? 'bg-accent/20 text-accent'
                                                    : 'bg-primary/20 text-primary'
                                                }
                      `}
                                        >
                                            {user.role === 'ADMIN' ? 'Administrador' : 'Motorista'}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-muted-foreground">
                                        {user.licenseNumber || '—'}
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openEditModal(user)}
                                                className="p-2 hover:bg-muted rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                className="p-2 hover:bg-destructive/20 text-destructive rounded-lg transition-colors"
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

                    {users.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            Nenhum funcionário cadastrado ainda.
                        </div>
                    )}
                </div>
            </GlassCard>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-card max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-6">
                            {editingUser ? 'Editar Funcionário' : 'Novo Funcionário'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Nome</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                                    required
                                />
                            </div>

                            {!editingUser && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Email</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Senha</label>
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                </>
                            )}

                            <div>
                                <label className="block text-sm font-medium mb-2">Cargo</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'DRIVER' })}
                                    className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    <option value="DRIVER">Motorista</option>
                                    <option value="ADMIN">Administrador</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">CNH (opcional)</label>
                                <input
                                    type="text"
                                    value={formData.licenseNumber}
                                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                                    className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:scale-105 active:scale-95 transition-all font-medium"
                                >
                                    {editingUser ? 'Salvar' : 'Criar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
