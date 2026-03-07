import React from 'react';
import { Building2, FileText, Globe, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/axios';

export function OrganizationTab() {
    const { data: org } = useQuery({
        queryKey: ['my-organization'],
        queryFn: async () => {
            const res = await api.get('/organizations/me');
            return res.data;
        }
    });

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 p-6 bg-primary/5 rounded-[2rem] border border-primary/10">
                <div className="p-4 bg-primary/10 text-primary rounded-2xl shadow-inner">
                    <Building2 size={32} />
                </div>
                <div>
                    <h3 className="text-xl font-black uppercase tracking-tight">{org?.name || 'Carregando...'}</h3>
                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Unidade de Negócio Principal</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">CNPJ / Documento</label>
                    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-2xl border border-border">
                        <FileText size={18} className="text-primary" />
                        <span className="font-medium">{org?.document || 'N/A'}</span>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">Localização Sede</label>
                    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-2xl border border-border">
                        <MapPin size={18} className="text-primary" />
                        <span className="font-medium">{org?.address || 'Endereço não configurado'}</span>
                    </div>
                </div>
            </div>

            <div className="glass-card !bg-yellow-500/5 border-yellow-500/20 p-6 rounded-3xl">
                <h4 className="text-yellow-600 dark:text-yellow-400 font-black uppercase tracking-widest text-[10px] mb-2 flex items-center gap-2">
                    <Globe size={14} /> Dados Sensíveis
                </h4>
                <p className="text-muted-foreground text-sm font-medium">A alteração de dados corporativos requer privilégios de Administrador Global e validação do suporte técnico.</p>
            </div>
        </div>
    );
}
