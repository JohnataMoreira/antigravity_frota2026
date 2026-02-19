import React from 'react';
import { Settings as SettingsIcon, Bell, Shield, Database, User, Globe } from 'lucide-react';
import { GlassCard } from '../../components/ui/Cards';

export default function SettingsPage() {
    const sections = [
        { title: 'Perfil da Organização', icon: User, desc: 'Dados da empresa e preferências gerais' },
        { title: 'Notificações', icon: Bell, desc: 'Configurar alertas de manutenção e avisos' },
        { title: 'Segurança', icon: Shield, desc: 'Controle de acesso e logs de atividade' },
        { title: 'Integrações & Dados', icon: Database, desc: 'Backup, API e conexões externas' },
        { title: 'Regionalização', icon: Globe, desc: 'Moeda, fuso horário e unidades de medida' },
    ];

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            <header>
                <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-2xl text-gray-900 ">
                        <SettingsIcon size={32} />
                    </div>
                    Configurações
                </h1>
                <p className="text-muted-foreground font-medium mt-1">Gerencie as preferências e parâmetros do sistema</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sections.map((section) => (
                    <GlassCard key={section.title} className="p-6 cursor-pointer hover:border-primary/50 transition-all group">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-muted/50 rounded-xl text-muted-foreground group-hover:text-primary transition-colors">
                                <section.icon size={24} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-lg">{section.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{section.desc}</p>
                            </div>
                        </div>
                    </GlassCard>
                ))}
            </div>

            <div className="bg-primary/5 border border-primary/10 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8">
                <div className="space-y-4 flex-1">
                    <h2 className="text-2xl font-black">Central de Ajuda</h2>
                    <p className="text-muted-foreground">Precisa de auxílio para configurar sua frota ou deseja treinamento para sua equipe? Nossa documentação e suporte estão prontos para ajudar.</p>
                    <div className="flex gap-4">
                        <button className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-opacity">Ver Documentação</button>
                        <button className="px-6 py-3 bg-white border rounded-xl font-bold hover:bg-gray-50 transition-colors">Contatar Suporte</button>
                    </div>
                </div>
                <div className="hidden md:block w-64 h-64 bg-primary/20 rounded-full blur-[80px] -mr-32 animate-pulse" />
            </div>
        </div>
    );
}
