import React from 'react';
import { ClipboardList, Plus, Settings2, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';
import { toast } from 'react-hot-toast';

export function ChecklistTab() {
    const queryClient = useQueryClient();

    const { data: templates, isLoading } = useQuery({
        queryKey: ['checklist-templates'],
        queryFn: async () => {
            const res = await api.get('/compliance/templates');
            return res.data;
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/compliance/templates/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['checklist-templates'] });
            toast.success('Modelo removido');
        }
    });

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
                <button className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-primary/20 transition-all">
                    <Plus size={14} /> Novo Modelo
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates?.length > 0 ? (
                    templates.map((template: any) => (
                        <div key={template.id} className="p-6 bg-muted/30 border border-border rounded-3xl group relative">
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => deleteMutation.mutate(template.id)}
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
                                        <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-green-500/10 text-green-600 rounded-full">Ativo</span>
                                    </div>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {template.items?.slice(0, 3).map((item: string, i: number) => (
                                            <span key={i} className="text-[8px] font-bold uppercase px-2 py-0.5 bg-white/5 rounded-md border border-white/5">
                                                {item}
                                            </span>
                                        ))}
                                        {template.items?.length > 3 && (
                                            <span className="text-[8px] font-bold uppercase px-2 py-0.5 text-muted-foreground">+{template.items.length - 3}</span>
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
        </div>
    );
}
