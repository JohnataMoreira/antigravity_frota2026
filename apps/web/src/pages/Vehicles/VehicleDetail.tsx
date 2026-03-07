import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Car,
    Calendar,
    MapPin,
    ShieldCheck,
    Wrench,
    TrendingUp,
    ArrowLeft,
    Clock,
    AlertTriangle,
    CheckCircle2
} from 'lucide-react';
import { api } from '@/lib/axios';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';

export function VehicleDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: vehicle, isLoading } = useQuery({
        queryKey: ['vehicle', id],
        queryFn: async () => {
            const res = await api.get(`/vehicles/${id}`);
            return res.data;
        }
    });

    if (isLoading) {
        return <div className="p-8 animate-pulse">Carregando detalhes do veículo...</div>;
    }

    if (!vehicle) {
        return (
            <div className="p-8 text-center space-y-4">
                <AlertTriangle className="mx-auto text-yellow-500" size={48} />
                <h2 className="text-2xl font-black uppercase">Veículo não encontrado</h2>
                <button
                    onClick={() => navigate('/vehicles')}
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-xl font-bold"
                >
                    Voltar para Lista
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/vehicles')}
                        className="p-2 hover:bg-white/5 rounded-xl transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-4xl font-black tracking-tighter gradient-text uppercase">
                                {vehicle.plate}
                            </h1>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest
                                ${vehicle.status === 'AVAILABLE' ? 'bg-green-500/10 text-green-500' :
                                    vehicle.status === 'IN_USE' ? 'bg-blue-500/10 text-blue-500' :
                                        'bg-red-500/10 text-red-500'}`}
                            >
                                {vehicle.status}
                            </span>
                        </div>
                        <p className="text-muted-foreground/60 font-black uppercase tracking-[0.2em] mt-1 text-[10px]">
                            {vehicle.brand} {vehicle.model} • {vehicle.year || 'N/A'}
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button className="flex-1 md:flex-none px-6 py-3 bg-white/5 border border-border text-foreground rounded-xl font-bold hover:bg-white/10 transition-colors">
                        Editar
                    </button>
                    <button className="flex-1 md:flex-none px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-opacity">
                        Nova Manutenção
                    </button>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Quilometragem"
                    value={`${vehicle.currentKm.toLocaleString()} KM`}
                    description="Total acumulado"
                    icon={TrendingUp}
                />
                <StatCard
                    title="Nível de Combustível"
                    value={`${vehicle.fuelLevel}%`}
                    description="Última leitura"
                    icon={Car}
                    variant={vehicle.fuelLevel < 20 ? 'danger' : 'info'}
                />
                <StatCard
                    title="Última Revisão"
                    value={vehicle.lastMaintenanceKm ? `${vehicle.lastMaintenanceKm.toLocaleString()} KM` : 'N/A'}
                    description={vehicle.lastMaintenanceDate ? new Date(vehicle.lastMaintenanceDate).toLocaleDateString() : 'Sem histórico'}
                    icon={Wrench}
                />
                <StatCard
                    title="Status Seguro"
                    value="Ativo"
                    description="Vence em 45 dias"
                    icon={ShieldCheck}
                    variant="success"
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Main Info */}
                <div className="xl:col-span-2 space-y-8">
                    <Card variant="glass" className="p-0 overflow-hidden">
                        <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
                            <h3 className="font-black uppercase tracking-tighter text-sm flex items-center gap-2">
                                <Clock size={16} className="text-primary" />
                                Histórico de Jornadas Recentes
                            </h3>
                        </div>
                        <div className="divide-y divide-border">
                            {vehicle.journeys?.length > 0 ? (
                                vehicle.journeys.map((j: any) => (
                                    <div key={j.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                                <MapPin size={24} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-foreground">{j.driver?.name || 'Motorista'}</p>
                                                <p className="text-xs text-muted-foreground uppercase font-black tracking-widest mt-1">
                                                    {new Date(j.startTime).toLocaleDateString()} • {j.startKm} KM â†’ {j.endKm || '---'} KM
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {j.status === 'COMPLETED' ? (
                                                <CheckCircle2 size={20} className="text-green-500" />
                                            ) : (
                                                <Clock size={20} className="text-blue-500 animate-pulse" />
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-12 text-center text-muted-foreground opacity-50">
                                    <p className="text-xs font-black uppercase tracking-[0.2em]">Sem viagens registradas para este veículo</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-8">
                    <Card variant="glass" className="p-6">
                        <h3 className="font-black uppercase tracking-tighter text-sm mb-6 flex items-center gap-2">
                            <Calendar size={16} className="text-primary" />
                            Próximos Compromissos
                        </h3>
                        <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-yellow-500/5 border border-yellow-500/20">
                                <p className="text-[10px] font-black uppercase text-yellow-600 tracking-widest mb-1">Manutenção Preventiva</p>
                                <p className="text-sm font-bold">Troca de óleo e filtros</p>
                                <p className="text-xs text-muted-foreground mt-2">Vence em aprox. 1.200 KM</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                                <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest mb-1">Vencimento CRLV</p>
                                <p className="text-sm font-bold">Licenciamento Anual</p>
                                <p className="text-xs text-muted-foreground mt-2">Data limite: 15/05/2026</p>
                            </div>
                        </div>
                    </Card>

                    <Card variant="glass" className="p-6">
                        <h3 className="font-black uppercase tracking-tighter text-sm mb-6 flex items-center gap-2">
                            <Car size={16} className="text-primary" />
                            Características
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-border/50">
                                <span className="text-xs text-muted-foreground font-bold uppercase">Cor</span>
                                <span className="text-sm font-black uppercase tracking-widest">Prata</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-border/50">
                                <span className="text-xs text-muted-foreground font-bold uppercase">Combustível</span>
                                <span className="text-sm font-black uppercase tracking-widest">Flex</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-border/50">
                                <span className="text-xs text-muted-foreground font-bold uppercase">Renavam</span>
                                <span className="text-sm font-black uppercase tracking-widest">---</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
