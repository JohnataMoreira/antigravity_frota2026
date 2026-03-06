import React from 'react';
import { Bell, Mail, Smartphone, AlertCircle } from 'lucide-react';

export function NotificationsTab() {
    const preferences = [
        { id: 'journeys', label: 'Início/Fim de Jornadas', email: true, push: true },
        { id: 'maintenance', label: 'Alertas de Manutenção', email: true, push: true },
        { id: 'incidents', label: 'Ocorrências Críticas', email: true, push: true },
        { id: 'billing', label: 'Relatórios Financeiros', email: false, push: false },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header>
                <h3 className="text-xl font-black uppercase tracking-tight mb-1">Preferências de Notificação</h3>
                <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Configure como você deseja ser alertado</p>
            </header>

            <div className="space-y-4">
                {preferences.map((pref) => (
                    <div key={pref.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-primary/10 text-primary rounded-xl">
                                <AlertCircle size={20} />
                            </div>
                            <span className="font-bold text-foreground text-sm">{pref.label}</span>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">E-mail</span>
                                <div className={`w-10 h-6 rounded-full p-1 transition-all ${pref.email ? 'bg-primary' : 'bg-muted'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full transition-all ${pref.email ? 'translate-x-4' : 'translate-x-0'}`} />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">Push</span>
                                <div className={`w-10 h-6 rounded-full p-1 transition-all ${pref.push ? 'bg-primary' : 'bg-muted'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full transition-all ${pref.push ? 'translate-x-4' : 'translate-x-0'}`} />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-600 dark:text-blue-400">
                <Smartphone size={20} />
                <p className="text-xs font-bold uppercase tracking-wider">Ajustes avançados de PUSH disponíveis no aplicativo mobile.</p>
            </div>
        </div>
    );
}
