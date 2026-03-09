import { View, Text, TextInput, TouchableOpacity, FlatList, Image, SafeAreaView, ActivityIndicator, StatusBar } from 'react-native';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { Search, Bell, Truck, History, User } from 'lucide-react-native';
import { useAuth } from '../_layout';
import withObservables from '@nozbe/with-observables';
import { database } from '../../src/model/database';
import { LinearGradient } from 'expo-linear-gradient';

function VehicleCard({ vehicle, onSelect }: { vehicle: any; onSelect: (v: any) => void }) {
    const isAvailable = vehicle.status === 'AVAILABLE' || !vehicle.status; // Default to available

    return (
        <TouchableOpacity
            className="mb-8 bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden shadow-xl shadow-slate-200 dark:shadow-none border border-slate-100 dark:border-slate-800"
            onPress={() => onSelect(vehicle)}
            activeOpacity={0.9}
        >
            <View className="relative h-80 w-full">
                <Image
                    source={{ uri: vehicle.photoUrl || 'https://images.unsplash.com/photo-1591768793355-74d75b331665?q=80&w=2070&auto=format&fit=crop' }}
                    className={`h-full w-full object-cover ${!isAvailable ? 'grayscale opacity-70' : ''}`}
                />
                <LinearGradient
                    colors={['transparent', 'rgba(15,23,42,0.95)']}
                    className="absolute inset-x-0 bottom-0 h-48"
                />

                <View className="absolute top-6 left-6">
                    <View className={`px-4 py-2 rounded-full shadow-lg ${isAvailable ? 'bg-emerald-500' : 'bg-slate-500'}`}>
                        <Text className="text-white text-[10px] font-black uppercase tracking-[2px]">
                            {isAvailable ? 'Disponível' : 'Em Uso'}
                        </Text>
                    </View>
                </View>

                <View className="absolute bottom-10 left-8 right-8">
                    <View className="flex-row items-end justify-between">
                        <View className="flex-1">
                            <Text className="text-5xl font-black text-white tracking-tighter uppercase leading-none shadow-black/50 shadow-sm">{vehicle.plate}</Text>
                            <Text className="text-slate-200 text-lg font-bold mt-2 uppercase tracking-[3px] opacity-90">{vehicle.brand} {vehicle.model}</Text>
                        </View>
                        <View className="w-16 h-16 bg-white/20 rounded-3xl items-center justify-center border border-white/25 backdrop-blur-md">
                            <Truck size={32} color="white" />
                        </View>
                    </View>
                </View>
            </View>

            <View className="p-8 flex-row items-center justify-between border-t border-slate-50 dark:border-slate-800/50">
                <View>
                    <Text className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-[2px] mb-1">Status de KM</Text>
                    <Text className="text-xl font-black text-slate-900 dark:text-white">{vehicle.currentKm.toLocaleString()} km</Text>
                </View>

                <View className="h-14 px-8 bg-primary rounded-2xl items-center justify-center shadow-lg shadow-primary/25">
                    <Text className="text-white font-black text-sm uppercase tracking-widest">Selecionar</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

function VehiclesScreen({ vehicles, loading }: { vehicles: any[]; loading: boolean }) {
    const [search, setSearch] = useState('');
    const { user } = useAuth();
    const router = useRouter();

    const filteredVehicles = useMemo(() => {
        return vehicles.filter(v =>
            v.plate.toLowerCase().includes(search.toLowerCase()) ||
            v.brand.toLowerCase().includes(search.toLowerCase()) ||
            v.model.toLowerCase().includes(search.toLowerCase())
        );
    }, [vehicles, search]);

    const handleSelectVehicle = (vehicle: any) => {
        router.push({
            pathname: '/checklist',
            params: { type: 'checkout', vehicleId: vehicle.id, currentKm: vehicle.currentKm }
        });
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-background-light dark:bg-background-dark">
                <ActivityIndicator size="large" color="#2463eb" />
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark pt-4">
            <StatusBar barStyle="dark-content" />
            <View className="px-6 flex-row items-center justify-between mb-8">
                <View className="flex-row items-center space-x-3">
                    <View className="w-12 h-12 rounded-full border-2 border-primary/20 bg-slate-200 dark:bg-slate-800 items-center justify-center">
                        <User size={24} color="#2463eb" />
                    </View>
                    <View className="ml-3">
                        <Text className="text-primary font-bold text-xl tracking-tight">Frota2026</Text>
                        <Text className="text-slate-500 text-xs font-medium uppercase tracking-widest">Driver App</Text>
                    </View>
                </View>
                <TouchableOpacity className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 items-center justify-center shadow-sm border border-slate-100 dark:border-slate-800">
                    <Bell size={24} color="#475569" />
                    <View className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
                </TouchableOpacity>
            </View>

            <View className="px-6 mb-8">
                <Text className="text-3xl font-black text-slate-900 dark:text-white leading-tight">
                    Bom dia, {user?.name?.split(' ')[0] || 'João'}!
                </Text>
                <Text className="text-slate-500 dark:text-slate-400 text-lg font-medium mt-1">
                    Selecione seu veículo para começar
                </Text>
            </View>

            <View className="px-6 mb-6">
                <View className="relative">
                    <View className="absolute left-4 z-10 top-4">
                        <Search size={22} color="#94a3b8" />
                    </View>
                    <TextInput
                        className="w-full h-14 pl-12 pr-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white font-display text-base shadow-sm"
                        placeholder="Buscar por placa ou modelo..."
                        placeholderTextColor="#94a3b8"
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </View>

            <FlatList
                data={filteredVehicles}
                renderItem={({ item }) => <VehicleCard vehicle={item} onSelect={handleSelectVehicle} />}
                keyExtractor={item => item.id}
                contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View className="items-center justify-center pt-20">
                        <Truck size={64} color="#e2e8f0" />
                        <Text className="text-slate-400 mt-4 font-medium text-center">Nenhum veículo disponível no momento.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

// Enhance with WatermelonDB for real-time local data
const enhance = withObservables([], () => ({
    vehicles: database.get('vehicles').query().observe(),
}));

export default enhance(VehiclesScreen);
