import React from 'react';
import { ClipboardList, Plus, Settings2, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/axios';

export function ChecklistTab() {
    const { data: configs } = useQuery({
        queryKey: ['checklist-config'],
        queryFn: async () => {
            const res = await api.get('/checklist-config');
            return res.data;
        }
    });

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h3 className="text-xl font-black uppercase tracking-tight mb-1">Modelos de Checklist</h3>
                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Personalize as inspeções de entrada e saída</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-primary/20 transition-all">
                    <Plus size={14} /> Novo Campo
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <div className="p-6 bg-muted/30 border border-border rounded-3xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/5 text-primary rounded-2xl">
                            <ClipboardList size={24} />
                        </div>
                        <div>
                            <span className="font-black uppercase tracking-tighter text-sm">Inspeção Padrão de Frota</span>
                            <div className="flex gap-2 mt-1">
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-muted rounded-full text-muted-foreground">12 Itens</span>
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-green-500/10 text-green-600 rounded-full">Ativo</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-3 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground rounded-xl transition-all">
                            <Settings2 size={18} />
                        </button>
                    </div>
                </div>

                <div className="p-6 border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center py-12 text-center grayscale opacity-50">
                    <Plus size={32} className="text-muted-foreground mb-4" />
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Adicionar Novo Modelo Customizado</p>
                </div>
            </div>
        </div>
    );
}
