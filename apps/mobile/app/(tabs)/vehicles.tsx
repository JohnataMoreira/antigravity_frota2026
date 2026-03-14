import { View, Text, TextInput, TouchableOpacity, FlatList, SafeAreaView, ActivityIndicator, StatusBar, RefreshControl } from 'react-native';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { Search, Truck, ChevronRight, Gauge, RefreshCw } from 'lucide-react-native';
import withObservables from '@nozbe/with-observables';
import { database } from '../../src/model/database';
import Vehicle from '../../src/model/Vehicle';
import Journey from '../../src/model/Journey';
import { Q } from '@nozbe/watermelondb';
import { useAuth } from '../_layout';
import { switchMap, of } from 'rxjs';
import { VehicleSkeleton } from '../../src/components/Skeleton';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';

function VehiclesScreen({ vehicles = [], activeJourney, driverId }: { vehicles?: Vehicle[]; activeJourney: Journey | null; driverId: string }) {
    const [search, setSearch] = useState('');
    const [syncStatus, setSyncStatus] = useState('IDLE');
    const router = useRouter();

    useEffect(() => {
        let cleanupSync: any;
        const startSync = async () => {
            try {
                const { syncService } = await import('../../src/services/SyncService');
                cleanupSync = syncService.subscribe((s: any) => setSyncStatus(s));
                syncService.sync();
            } catch (err) {
                console.error('[Vehicles] Sync init error:', err);
            }
        };
        startSync();
        return () => { cleanupSync?.(); };
    }, []);

    const filteredVehicles = useMemo(() => {
        const query = search.toLowerCase();
        return vehicles.filter(v => 
            (v?.plate?.toLowerCase() || '').includes(query) ||
            (v?.brand?.toLowerCase() || '').includes(query) ||
            (v?.model?.toLowerCase() || '').includes(query)
        );
    }, [vehicles, search]);

    const handleManualRefresh = async () => {
        const { syncService } = await import('../../src/services/SyncService');
        syncService.sync();
    };

    const renderVehicleItem = ({ item, index }: { item: Vehicle; index: number }) => {
        const isMyJourney = activeJourney?.vehicleId === item.id;
        const isOtherInUse = item.status === 'IN_USE' && !isMyJourney;
        const canStart = item.status === 'AVAILABLE';

        return (
            <Animated.View 
                entering={FadeInDown.delay(index * 100).springify()}
                layout={Layout.springify()}
            >
                <TouchableOpacity
                    onPress={() => {
                        if (isMyJourney) {
                            router.push('/(tabs)/journey');
                            return;
                        }
                        if (isOtherInUse) {
                            return; // Block or show info
                        }
                        router.push({
                            pathname: '/checklist',
                            params: { vehicleId: item.id, type: 'checkout' }
                        });
                    }}
                    disabled={isOtherInUse}
                    className={`mb-6 bg-white p-5 rounded-[32px] border shadow-sm active:scale-[0.98] ${isOtherInUse ? 'opacity-60 border-slate-100' : 'border-slate-100'}`}
                >
                    <View className="flex-row items-center mb-4">
                        <View className={`w-14 h-14 rounded-2xl items-center justify-center ${isMyJourney ? 'bg-blue-600' : 'bg-blue-50'}`}>
                            <Truck size={28} color={isMyJourney ? 'white' : '#2563EB'} />
                        </View>
                        <View className="ml-4 flex-1">
                            <Text className="text-xl font-bold text-slate-900">{item.plate}</Text>
                            <Text className="text-slate-500 font-medium">{item.brand} {item.model}</Text>
                        </View>
                        <View className={`px-3 py-1.5 rounded-full ${isMyJourney ? 'bg-blue-600' : isOtherInUse ? 'bg-slate-100' : 'bg-emerald-50'}`}>
                            <Text className={`text-[10px] font-bold ${isMyJourney ? 'text-white' : isOtherInUse ? 'text-slate-400' : 'text-emerald-600'}`}>
                                {isMyJourney ? 'EM CURSO' : isOtherInUse ? 'OCUPADO' : 'DISPONÍVEL'}
                            </Text>
                        </View>
                    </View>

                    <View className="h-[1px] bg-slate-50 mb-4" />

                    <View className="flex-row justify-between items-center">
                        <View className="flex-row items-center">
                            <View className="w-2 h-2 rounded-full bg-slate-300 mr-2" />
                            <Gauge size={16} color="#94A3B8" />
                            <Text className="ml-2 text-slate-600 font-bold text-sm">
                                {(item.currentKm || 0).toLocaleString()} KM
                            </Text>
                        </View>
                        <View className={`flex-row items-center ${isMyJourney ? 'bg-blue-100' : isOtherInUse ? 'bg-slate-50' : 'bg-slate-50'} px-3 py-2 rounded-xl`}>
                            <Text className={`${isMyJourney ? 'text-blue-600' : isOtherInUse ? 'text-slate-400' : 'text-blue-600'} font-bold text-xs mr-1`}>
                                {isMyJourney ? 'Ver Jornada' : isOtherInUse ? 'Indisponível' : 'Check-out'}
                            </Text>
                            {!isOtherInUse && <ChevronRight size={14} color={isMyJourney ? '#2563EB' : '#2563EB'} />}
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-[#F8FAFC]">
            <StatusBar barStyle="dark-content" />
            
            <View className="px-6 pt-6 pb-4 bg-white border-b border-slate-100 shadow-sm">
                <View className="flex-row justify-between items-center mb-6">
                    <View>
                        <Text className="text-slate-400 font-bold text-[10px] uppercase tracking-[2px] mb-1">Ecosistema Frota2026</Text>
                        <Text className="text-2xl font-bold text-slate-900">Seus Veículos</Text>
                    </View>
                    <TouchableOpacity 
                        onPress={handleManualRefresh}
                        className={`w-12 h-12 rounded-2xl items-center justify-center ${syncStatus === 'SYNCING' ? 'bg-blue-50' : 'bg-slate-50'}`}
                    >
                        <RefreshCw size={20} color={syncStatus === 'SYNCING' ? '#2563EB' : '#64748B'} />
                    </TouchableOpacity>
                </View>

                <View className="flex-row items-center bg-slate-100 px-4 h-14 rounded-2xl">
                    <Search size={20} color="#94A3B8" />
                    <TextInput
                        className="flex-1 ml-3 font-medium text-slate-900"
                        placeholder="Placa, Marca ou Modelo..."
                        placeholderTextColor="#94A3B8"
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </View>

            <FlatList
                data={filteredVehicles}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl 
                        refreshing={syncStatus === 'SYNCING'} 
                        onRefresh={handleManualRefresh}
                        colors={['#2563EB']}
                    />
                }
                renderItem={renderVehicleItem}
                ListEmptyComponent={
                    <View>
                        {syncStatus === 'SYNCING' ? (
                            <View className="py-2">
                                <VehicleSkeleton />
                                <VehicleSkeleton />
                                <VehicleSkeleton />
                            </View>
                        ) : (
                            <View className="items-center justify-center py-20">
                                <View className="items-center">
                                    <View className="w-20 h-20 bg-slate-50 rounded-full items-center justify-center mb-4">
                                        <Search size={32} color="#CBD5E1" />
                                    </View>
                                    <Text className="text-slate-900 font-bold text-lg">Nenhum veículo</Text>
                                    <Text className="text-slate-400 text-center mt-2 px-10">
                                        Clique em sincronizar para buscar veículos da sua organização.
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const EnhancedVehicles = withObservables(['driverId'], ({ driverId }) => {
    try {
        return {
            vehicles: database.get<Vehicle>('vehicles').query().observe(),
            activeJourney: database.get<Journey>('journeys').query(
                Q.where('status', 'IN_PROGRESS'),
                Q.where('driver_id', driverId)
            ).observe().pipe(
                switchMap(journeys => journeys.length > 0 ? journeys[0].observe() : of(null))
            )
        };
    } catch (e) {
        console.error('[Vehicles] Observable error:', e);
        return {
            vehicles: of([]),
            activeJourney: of(null)
        };
    }
})(VehiclesScreen);

export default function VehiclesWrapper() {
    const { user } = useAuth();
    if (!user?.id) return <ActivityIndicator size="large" color="#2563EB" />;
    return <EnhancedVehicles driverId={user.id} />;
}
