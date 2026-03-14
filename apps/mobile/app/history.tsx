import { View, Text, TouchableOpacity, FlatList, SafeAreaView, StatusBar, TextInput } from 'react-native';
import { useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { ChevronLeft, Search, MapPin, History, Truck, Calendar, ArrowRight, Gauge } from 'lucide-react-native';
import withObservables from '@nozbe/with-observables';
import { Q } from '@nozbe/watermelondb';
import { database } from '../src/model/database';
import Journey from '../src/model/Journey';
import Vehicle from '../src/model/Vehicle';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';

interface HistoryItemProps {
    journey: Journey;
    vehicle: Vehicle;
}

const HistoryItemBase = ({ journey, vehicle }: HistoryItemProps) => {
    const router = useRouter();
    const formattedDate = new Date(journey.startTime).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });

    const duration = journey.endTime 
        ? Math.floor((journey.endTime - journey.startTime) / (1000 * 60)) // minutes
        : 0;

    return (
        <Animated.View 
            entering={FadeInDown.springify()}
            layout={Layout.springify()}
        >
            <TouchableOpacity 
                className="mb-4 bg-white p-5 rounded-[32px] shadow-sm border border-slate-100"
                activeOpacity={0.7}
                onPress={() => {/* TODO: Detailed Journey View */}}
            >
            <View className="flex-row items-center mb-4">
                <View className="w-12 h-12 rounded-2xl bg-blue-50 items-center justify-center">
                    <Truck size={22} color="#2563EB" />
                </View>
                <View className="ml-4 flex-1">
                    <View className="flex-row justify-between items-center">
                        <Text className="text-[#1A1C1E] font-black text-lg tracking-tight uppercase">
                            {vehicle?.plate || '---'}
                        </Text>
                        <View className="bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                            <Text className="text-emerald-600 text-[10px] font-black uppercase">Finalizado</Text>
                        </View>
                    </View>
                    <View className="flex-row items-center mt-0.5">
                        <Calendar size={12} color="#94A3B8" />
                        <Text className="text-slate-400 text-xs font-bold ml-1 uppercase tracking-tight">{formattedDate}</Text>
                    </View>
                </View>
            </View>

            <View className="flex-row items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <View className="flex-1 items-center">
                    <Text className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">Km Inicial</Text>
                    <Text className="text-[#1A1C1E] font-bold text-sm tracking-tight">{journey.startKm} km</Text>
                </View>
                
                <View className="mx-4 items-center">
                    <ArrowRight size={14} color="#CBD5E1" />
                </View>

                <View className="flex-1 items-center">
                    <Text className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">Km Final</Text>
                    <Text className="text-[#1A1C1E] font-bold text-sm tracking-tight">{journey.endKm || '---'} km</Text>
                </View>

                <View className="h-4 w-[1px] bg-slate-200 mx-4" />

                <View className="flex-1 items-center">
                    <Text className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">Duração</Text>
                    <Text className="text-[#1A1C1E] font-bold text-sm tracking-tight">{duration} min</Text>
                </View>
            </View>
        </TouchableOpacity>
        </Animated.View>
    );
}

const enhanceHistoryItem = withObservables(['journey'], ({ journey }: { journey: Journey }) => ({
    journey: journey.observe(),
    vehicle: journey.vehicle.observe(),
}));

const ObservedHistoryItem = enhanceHistoryItem(HistoryItemBase);

function HistoryScreen({ journeys }: { journeys: Journey[] }) {
    const router = useRouter();
    const [search, setSearch] = useState('');

    const filteredJourneys = useMemo(() => {
        if (!search) return journeys;
        const query = search.toLowerCase();
        return journeys.filter(j => 
            j.id.toLowerCase().includes(query) ||
            j.vehicleId.toLowerCase().includes(query)
        );
    }, [journeys, search]);

    return (
        <SafeAreaView className="flex-1 bg-[#F1F3F5]">
            <StatusBar barStyle="dark-content" />
            
            {/* Header */}
            <View className="px-6 py-4 flex-row items-center border-b border-slate-100 bg-white">
                <TouchableOpacity 
                    onPress={() => router.back()} 
                    className="w-10 h-10 rounded-xl bg-[#F8F9FA] items-center justify-center border border-slate-200 mr-4"
                >
                    <ChevronLeft size={20} color="#1A1C1E" />
                </TouchableOpacity>
                <Text className="text-[#1A1C1E] font-black text-xl uppercase tracking-tighter">Histórico</Text>
            </View>

            <View className="px-6 pt-6 pb-2">
                <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-[#1A1C1E] font-black text-xs uppercase tracking-[3px]">Total: {journeys.length}</Text>
                    <TouchableOpacity className="flex-row items-center">
                        <Calendar size={14} color="#2563EB" />
                        <Text className="text-blue-600 font-bold text-xs ml-1">Este Mês</Text>
                    </TouchableOpacity>
                </View>
                
                <View className="relative">
                    <View className="absolute left-5 z-10 top-5">
                        <Search size={18} color="#94A3B8" />
                    </View>
                    <TextInput
                        className="w-full h-14 pl-14 pr-6 bg-white rounded-[24px] border border-slate-100 text-[#1A1C1E] text-base shadow-sm font-medium"
                        placeholder="Buscar por placa ou ID..."
                        placeholderTextColor="#94A3B8"
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </View>

            <FlatList
                data={filteredJourneys}
                renderItem={({ item }) => <ObservedHistoryItem journey={item} />}
                keyExtractor={item => item.id}
                contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View className="items-center justify-center pt-20">
                        <View className="w-24 h-24 rounded-full bg-slate-100 items-center justify-center mb-6">
                            <History size={40} color="#CBD5E1" />
                        </View>
                        <Text className="text-slate-400 font-black text-center uppercase tracking-[2px]">Nenhuma Jornada</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const enhance = withObservables([], () => ({
    journeys: database.get<Journey>('journeys').query(
        Q.where('status', 'COMPLETED'),
        Q.sortBy('end_time', Q.desc)
    ).observe(),
}));

export default enhance(HistoryScreen);
