import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, Image, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { 
    Truck, 
    Route, 
    History, 
    Wallet, 
    LifeBuoy, 
    ChevronRight, 
    Bell,
    Clock,
    Gauge,
    AlertTriangle
} from 'lucide-react-native';
import { useAuth } from '../_layout';
import withObservables from '@nozbe/with-observables';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../src/model/database';
import Journey from '../../src/model/Journey';
import Vehicle from '../../src/model/Vehicle';
import SyncQueue from '../../src/model/SyncQueue';
import { switchMap, of, combineLatest, map } from 'rxjs';

function QuickAction({ icon: Icon, label, onPress, color = "#2563EB" }: { icon: any; label: string; onPress: () => void; color?: string }) {
    return (
        <TouchableOpacity 
            onPress={onPress}
            className="items-center bg-white p-4 rounded-3xl shadow-sm border border-slate-100 w-[22%]"
            activeOpacity={0.7}
        >
            <View className="mb-2 w-10 h-10 rounded-xl bg-[#F8F9FA] items-center justify-center">
                <Icon size={20} color={color} />
            </View>
            <Text className="text-[10px] font-bold text-slate-600 text-center uppercase tracking-tighter" numberOfLines={1}>
                {label}
            </Text>
        </TouchableOpacity>
    );
}

function StatCard({ label, value, icon: Icon, color = "#2563EB" }: { label: string; value: string; icon: any; color?: string }) {
    return (
        <View className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex-1 mx-1">
            <View className="w-8 h-8 rounded-lg bg-[#F8F9FA] items-center justify-center mb-3">
                <Icon size={16} color={color} />
            </View>
            <Text className="text-2xl font-black text-[#1A1C1E]">{value}</Text>
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{label}</Text>
        </View>
    );
}

function DashboardScreen({ activeJourney, activeVehicle, stats, lastJourney, lastVehicle, driverId }: { 
    activeJourney: Journey | null; 
    activeVehicle: Vehicle | null; 
    stats: any;
    lastJourney: Journey | null;
    lastVehicle: Vehicle | null;
    driverId: string;
}) {

    const { user } = useAuth();
    const router = useRouter();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const greeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return 'Bom dia';
        if (hour < 18) return 'Boa tarde';
        return 'Boa noite';
    };

    return (
        <SafeAreaView className="flex-1 bg-[#F1F3F5]">
            <StatusBar barStyle="dark-content" />
            
            <ScrollView 
                className="flex-1" 
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View className="px-6 pt-8 pb-6 flex-row items-center justify-between">
                    <View>
                        <Text className="text-slate-500 font-bold text-xs uppercase tracking-widest">{greeting()},</Text>
                        <Text className="text-2xl font-black text-[#1A1C1E]">{user?.name?.split(' ')[0] || 'Motorista'}</Text>
                    </View>
                    <TouchableOpacity 
                        className="w-12 h-12 rounded-2xl bg-white items-center justify-center shadow-sm border border-slate-100"
                        accessibilityLabel="Notificações"
                        aria-label="Notificações"
                        accessibilityRole="button"
                        accessibilityHint="Abre a lista de notificações do sistema"
                    >
                        <Bell size={22} color="#64748B" aria-hidden={true} />
                        <View className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" aria-hidden={true} />
                    </TouchableOpacity>
                </View>

                {/* Main Stats */}
                <View className="px-5 flex-row mb-8">
                    <StatCard label="Total KM" value={stats.totalKm.toLocaleString()} icon={Gauge} color="#2563EB" />
                    <StatCard label="Viagens" value={stats.journeyCount.toString()} icon={Route} color="#34D399" />
                    <StatCard label="Avarias" value={stats.incidentCount.toString()} icon={AlertTriangle} color="#EF4444" />
                </View>

                {/* Active Journey or Start Button */}
                <View className="px-6 mb-8">
                    {activeJourney ? (
                        <TouchableOpacity 
                            onPress={() => router.push('/(tabs)/journey')}
                            className="bg-[#1A1C1E] rounded-[32px] p-6 shadow-xl shadow-black/10"
                            activeOpacity={0.9}
                        >
                            <View className="flex-row items-center justify-between mb-4">
                                <View className="flex-row items-center">
                                    <View className="w-10 h-10 rounded-xl bg-blue-500 items-center justify-center">
                                        <Truck size={20} color="white" />
                                    </View>
                                    <View className="ml-3">
                                        <Text className="text-white font-black text-lg">{activeVehicle?.plate || '...'}</Text>
                                        <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider">Jornada em curso</Text>
                                    </View>
                                </View>
                                <ChevronRight size={20} color="#64748B" />
                            </View>
                            <View className="flex-row items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                                <Clock size={16} color="#3B82F6" />
                                <Text className="text-white ml-2 font-bold text-sm">Iniciada às {new Date(activeJourney.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text>
                            </View>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity 
                            onPress={() => router.push('/(tabs)/vehicles')}
                            className="bg-[#2563EB] rounded-[32px] p-8 items-center shadow-xl shadow-blue-500/20"
                            activeOpacity={0.9}
                            accessibilityLabel="Iniciar Jornada"
                            aria-label="Iniciar Jornada"
                            accessibilityRole="button"
                            accessibilityHint="Selecione um veículo para começar uma nova jornada"
                        >
                            <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center mb-4" aria-hidden={true}>
                                <Truck size={32} color="white" />
                            </View>
                            <Text className="text-white text-xl font-black uppercase tracking-widest">Iniciar Jornada</Text>
                            <Text className="text-blue-100 text-sm mt-2 font-medium">Selecione seu veículo para começar</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Quick Actions Title */}
                <View className="px-6 mb-4 flex-row justify-between items-center">
                    <Text className="text-[#1A1C1E] font-black text-sm uppercase tracking-widest">Acesso Rápido</Text>
                </View>

                {/* Quick Actions Grid */}
                <View className="px-6 flex-row justify-between mb-8">
                    <QuickAction icon={History} label="Histórico" onPress={() => router.push('/history')} color="#34D399" />
                    <QuickAction icon={Wallet} label="Documentos" onPress={() => router.push('/wallet')} color="#059669" />
                    <QuickAction icon={LifeBuoy} label="Suporte" onPress={() => router.push('/support')} color="#F59E0B" />
                    <QuickAction icon={Route} label="Planejar" onPress={() => {}} color="#3B82F6" />
                </View>

                {/* Last Activity */}
                {lastJourney && (
                    <View className="px-6">
                        <Text className="text-[#1A1C1E] font-black text-sm uppercase tracking-widest mb-4">Última Viagem</Text>
                        <TouchableOpacity 
                            onPress={() => router.push('/history')}
                            className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex-row items-center"
                        >
                            <View className="w-12 h-12 rounded-2xl bg-[#F8F9FA] items-center justify-center">
                                <History size={24} color="#64748B" />
                            </View>
                            <View className="ml-4 flex-1">
                                <Text className="text-[#1A1C1E] font-bold text-base">{lastVehicle?.plate || 'Externo'}</Text>
                                <Text className="text-slate-400 text-xs font-medium">
                                    {new Date(lastJourney.endTime || lastJourney.updatedAt).toLocaleDateString('pt-BR')} • {((lastJourney.endKm || 0) - lastJourney.startKm)}km percorridos
                                </Text>
                            </View>
                            <View className="bg-emerald-50 px-2.5 py-1 rounded-full">
                                <Text className="text-emerald-600 font-bold text-[10px] uppercase">Finalizado</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                )}

            </ScrollView>
        </SafeAreaView>
    );
}

const EnhancedDashboard = withObservables(['driverId'], ({ driverId }) => {
    try {
        const journeys$ = database.get<Journey>('journeys').query(Q.where('driver_id', driverId)).observe();
        const activeJourneys$ = database.get<Journey>('journeys').query(
            Q.where('status', 'IN_PROGRESS'),
            Q.where('driver_id', driverId)
        ).observe();
        const lastCompletedJourneys$ = database.get<Journey>('journeys').query(
            Q.where('status', 'COMPLETED'),
            Q.where('driver_id', driverId),
            Q.sortBy('end_time', Q.desc),
            Q.take(1)
        ).observe();
        const syncQueue$ = database.get<SyncQueue>('sync_queue').query(Q.where('action_type', 'REPORT_INCIDENT')).observe();

        return {
            activeJourney: activeJourneys$.pipe(
                switchMap(journeys => journeys.length > 0 ? journeys[0].observe() : of(null))
            ),
            activeVehicle: activeJourneys$.pipe(
                switchMap(journeys => journeys.length > 0 ? journeys[0].vehicle.observe() : of(null))
            ),
            lastJourney: lastCompletedJourneys$.pipe(
                switchMap(journeys => journeys.length > 0 ? journeys[0].observe() : of(null))
            ),
            lastVehicle: lastCompletedJourneys$.pipe(
                switchMap(journeys => journeys.length > 0 ? journeys[0].vehicle.observe() : of(null))
            ),
            stats: combineLatest([journeys$, syncQueue$]).pipe(
                map(([journeys, incidents]) => {
                    const completed = journeys.filter(j => j.status === 'COMPLETED');
                    const journeyCount = completed.length;
                    const totalKm = completed.reduce((acc, j) => acc + ((j.endKm || 0) - j.startKm), 0);
                    return {
                        journeyCount,
                        totalKm,
                        incidentCount: incidents.length
                    };
                })
            )
        };
    } catch (e) {
        console.error('[Dashboard] Observable error:', e);
        return {
            activeJourney: of(null),
            activeVehicle: of(null),
            lastJourney: of(null),
            lastVehicle: of(null),
            stats: of({ journeyCount: 0, totalKm: 0, incidentCount: 0 })
        };
    }
})(DashboardScreen);

export default function DashboardWrapper() {
    const { user } = useAuth();
    if (!user?.id) return <ActivityIndicator size="large" color="#2563EB" />;
    return <EnhancedDashboard driverId={user.id} />;
}

