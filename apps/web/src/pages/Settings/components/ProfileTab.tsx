import React from 'react';
import { User, Mail, Phone, Calendar, MapPin } from 'lucide-react';

export function ProfileTab({ user }: { user: any }) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center text-primary border-4 border-primary/5">
                    <User size={48} />
                </div>
                <div>
                    <h3 className="text-2xl font-black uppercase tracking-tight">{user?.name || 'Carregando...'}</h3>
                    <p className="text-muted-foreground font-bold uppercase tracking-wider text-xs">{user?.role || 'DRIVER'}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">E-mail</label>
                    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-2xl border border-border">
                        <Mail size={18} className="text-primary" />
                        <span className="font-medium">{user?.email || 'N/A'}</span>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">Telefone / WhatsApp</label>
                    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-2xl border border-border">
                        <Phone size={18} className="text-primary" />
                        <span className="font-medium">{user?.phone || 'Não informado'}</span>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">Data de Nascimento</label>
                    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-2xl border border-border">
                        <Calendar size={18} className="text-primary" />
                        <span className="font-medium">--/--/----</span>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">Endereço Principal</label>
                    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-2xl border border-border">
                        <MapPin size={18} className="text-primary" />
                        <span className="font-medium">Solicite atualização via RH</span>
                    </div>
                </div>
            </div>

            <div className="pt-4">
                <button className="px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                    Solicitar Alteração de Dados
                </button>
            </div>
        </div>
    );
}
