import React, { useState } from 'react';
import { ClipboardList, Plus, Settings2, Trash2, Loader2, AlertCircle, X, Check, GripVertical } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';
import { toast } from 'react-hot-toast';

interface ChecklistTemplate {
    id: string;
    name: string;
    description?: string;
    items: string[];
    isActive: boolean;
}

export function ChecklistTab() {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<ChecklistTemplate | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        items: [''] as string[]
    });

    const { data: templates, isLoading } = useQuery<ChecklistTemplate[]>({
        queryKey: ['checklist-templates'],
        queryFn: async () => {
            const res = await api.get('/checklist-templates');
            return res.data;
        }
    });

    const saveMutation = useMutation({
        mutationFn: async (data: any) => {
            if (editingTemplate) {
                return api.patch(`/checklist-templates/${editingTemplate.id}`, data);
            }
            return api.post('/checklist-templates', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['checklist-templates'] });
            toast.success(editingTemplate ? 'Modelo atualizado' : 'Modelo criado');
            closeModal();
        },
        onError: () => {
            toast.error('Erro ao salvar modelo');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/checklist-templates/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['checklist-templates'] });
            toast.success('Modelo removido');
        }
    });

    const openModal = (template?: ChecklistTemplate) => {
        if (template) {
            setEditingTemplate(template);
            setFormData({
                name: template.name,
                description: template.description || '',
                items: template.items.length > 0 ? [...template.items] : ['']
            });
        } else {
            setEditingTemplate(null);
            setFormData({ name: '', description: '', items: [''] });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingTemplate(null);
    };

    const handleAddItem = () => {
        setFormData(prev => ({ ...prev, items: [...prev.items, ''] }));
    };

    const handleRemoveItem = (index: number) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const handleItemChange = (index: number, value: string) => {
        const newItems = [...formData.items];
        newItems[index] = value;
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const cleanedItems = formData.items.filter(item => item.trim() !== '');
        if (cleanedItems.length === 0) {
            toast.error('Adicione pelo menos um item ao checklist');
            return;
        }
        saveMutation.mutate({ ...formData, items: cleanedItems });
    };

    if (isLoading) return (
        <div className="flex justify-center p-12">
            <Loader2 className="animate-spin text-primary" size={32} />
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h3 className="text-xl font-black uppercase tracking-tight mb-1">Modelos de Checklist</h3>
                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Personalize as inspeções de entrada e saída</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground shadow-lg shadow-primary/20 rounded-xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all"
                >
                    <Plus size={14} /> Novo Modelo
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates?.length ? (
                    templates.map((template) => (
                        <div key={template.id} className="p-6 bg-muted/30 border border-border rounded-3xl group relative hover:border-primary/30 transition-colors">
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => openModal(template)}
                                    className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-all"
                                >
                                    <Settings2 size={16} />
                                </button>
                                <button
                                    onClick={() => {
                                        if (confirm('Tem certeza que deseja excluir este modelo?')) {
                                            deleteMutation.mutate(template.id);
                                        }
                                    }}
                                    className="p-2 text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-primary/5 text-primary rounded-2xl">
                                    <ClipboardList size={24} />
                                </div>
                                <div className="flex-1">
                                    <span className="font-black uppercase tracking-tighter text-sm">{template.name}</span>
                                    <div className="flex gap-2 mt-1">
                                        <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
                                            {template.items?.length || 0} Itens
                                        </span>
                                        {template.isActive ? (
                                            <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-green-500/10 text-green-600 rounded-full">Ativo</span>
                                        ) : (
                                            <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-red-500/10 text-red-600 rounded-full">Inativo</span>
                                        )}
                                    </div>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {template.items?.slice(0, 4).map((item, i) => (
                                            <span key={i} className="text-[8px] font-bold uppercase px-2 py-0.5 bg-white/5 rounded-md border border-white/5">
                                                {item}
                                            </span>
                                        ))}
                                        {template.items?.length > 4 && (
                                            <span className="text-[8px] font-bold uppercase px-2 py-0.5 text-muted-foreground">+{template.items.length - 4}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="md:col-span-2 p-12 bg-muted/20 border-2 border-dashed border-border rounded-[2rem] flex flex-col items-center justify-center text-center opacity-50 grayscale">
                        <AlertCircle className="mb-4 text-muted-foreground" size={32} />
                        <h4 className="font-black uppercase tracking-tight text-sm">Nenhum modelo customizado</h4>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-2">Clique em "Novo Modelo" para começar</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-background border border-border w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <header className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight">
                                    {editingTemplate ? 'Editar Modelo' : 'Novo Modelo'}
                                </h3>
                                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em]">Configuração de Itens</p>
                            </div>
                            <button onClick={closeModal} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </header>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Nome do Checklist</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        placeholder="Ex: Checklist Semanal"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Descrição (Opcional)</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all min-h-[80px]"
                                        placeholder="Breve descrição dos parâmetros"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Itens do Checklist</label>
                                    <button
                                        type="button"
                                        onClick={handleAddItem}
                                        className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                                    >
                                        + Adicionar Item
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {formData.items.map((item, index) => (
                                        <div key={index} className="flex gap-2 group">
                                            <div className="flex-1 relative">
                                                <input
                                                    type="text"
                                                    required
                                                    value={item}
                                                    onChange={e => handleItemChange(index, e.target.value)}
                                                    className="w-full bg-muted/30 border border-border rounded-xl pl-10 pr-4 py-2 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                    placeholder={`Item ${index + 1}`}
                                                />
                                                <GripVertical size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/30" />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveItem(index)}
                                                className="p-2 text-muted-foreground/50 hover:text-destructive transition-colors"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </form>

                        <footer className="p-6 border-t border-border bg-muted/20 flex gap-3">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="flex-1 px-4 py-3 bg-muted border border-border rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-muted/80 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={saveMutation.isPending}
                                className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                            >
                                {saveMutation.isPending ? 'Salvando...' : 'Salvar Modelo'}
                            </button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
}
