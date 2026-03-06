import React, { useState } from 'react';
import { Settings as SettingsIcon, Bell, Shield, Database, User, Globe, ClipboardList, Building2 } from 'lucide-react';
import { ProfileTab } from './components/ProfileTab';
import { OrganizationTab } from './components/OrganizationTab';
import { NotificationsTab } from './components/NotificationsTab';
import { ChecklistTab } from './components/ChecklistTab';
import { useAuth } from '@/context/AuthContext';

export default function SettingsPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');

    const tabs = [
        { id: 'profile', label: 'Meu Perfil', icon: User },
        { id: 'organization', label: 'Organização', icon: Building2 },
        { id: 'notifications', label: 'Notificações', icon: Bell },
        { id: 'checklist', label: 'Checklists', icon: ClipboardList },
    ];

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
            <header className="flex items-start gap-4">
                <div className="p-3 bg-muted rounded-2xl text-foreground">
                    <SettingsIcon size={32} />
                </div>
                <div>
                    <h1 className="text-4xl font-black tracking-tight gradient-text">
                        CONFIGURAÇÕES
                    </h1>
                    <p className="text-muted-foreground font-medium mt-1">Gerencie as preferências e parâmetros do sistema</p>
                </div>
            </header>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Sidebar/Tabs Menu */}
                <aside className="w-full md:w-64 flex-shrink-0">
                    <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all font-bold text-left whitespace-nowrap
                                        ${isActive
                                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]'
                                            : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                                        }`}
                                >
                                    <Icon size={20} className={isActive ? 'opacity-100' : 'opacity-70'} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 glass-card p-6 md:p-8 min-h-[500px]">
                    {activeTab === 'profile' && <ProfileTab user={user} />}
                    {activeTab === 'organization' && <OrganizationTab />}
                    {activeTab === 'notifications' && <NotificationsTab />}
                    {activeTab === 'checklist' && <ChecklistTab />}
                </main>
            </div>

            {/* Help Block */}
            <div className="bg-primary/5 border border-primary/10 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8 mt-12">
                <div className="space-y-4 flex-1">
                    <h2 className="text-2xl font-black">Central de Ajuda</h2>
                    <p className="text-muted-foreground">Precisa de auxílio para configurar sua frota ou deseja treinamento para sua equipe? Nossa documentação e suporte estão prontos para ajudar.</p>
                    <div className="flex gap-4">
                        <button className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-opacity">Ver Documentação</button>
                        <button className="px-6 py-3 bg-white/10 border border-border text-foreground rounded-xl font-bold hover:bg-white/20 transition-colors">Contatar Suporte</button>
                    </div>
                </div>
                <div className="hidden md:block w-64 h-64 bg-primary/20 rounded-full blur-[80px] -mr-32 animate-pulse" />
            </div>
        </div>
    );
}
