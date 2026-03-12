import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, Image, Alert, TextInput, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Camera, Check, AlertTriangle, Info, ArrowRight, Truck, Gauge, Shield, Droplet, Zap, Square, CheckCircle2 } from 'lucide-react-native';
import { database } from '../src/model/database';
import { Q } from '@nozbe/watermelondb';
import Vehicle from '../src/model/Vehicle';
import { useAuth } from './_layout';
import Journey from '../src/model/Journey';
import { outboxService } from '../src/services/outboxService';

const CHECKLIST_ITEMS = [
    { id: 'pneus', label: 'Pneus e Rodas (Pressão/Estado)', icon: Truck },
    { id: 'luzes', label: 'Luzes e Sinalização (Faróis/Setas)', icon: Zap },
    { id: 'fluidos', label: 'Fluidos (Óleo/Arrefecimento)', icon: Droplet },
    { id: 'vidros', label: 'Vidros e Espelhos', icon: Square },
    { id: 'seguranca', label: 'Equipamentos de Segurança', icon: Shield },
];

function InspectionPoint({ top, left, status, onPress }: { top: number; left: number; status: 'ok' | 'issue' | 'pending'; onPress: () => void }) {
    const color = status === 'ok' ? '#10B981' : status === 'issue' ? '#EF4444' : '#ADB5BD';
    return (
        <TouchableOpacity 
            onPress={onPress}
            className="absolute w-8 h-8 rounded-full bg-white items-center justify-center shadow-md border-2"
            style={{ top: `${top}%`, left: `${left}%`, borderColor: color }}
        >
            <View className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
        </TouchableOpacity>
    );
}

export default function ChecklistScreen() {
    const { type, vehicleId, journeyId, endKm: endKmParam } = useLocalSearchParams();
    const { user } = useAuth();
    const router = useRouter();
    const [step, setStep] = useState(1); // 1: Visual, 2: Items
    const [isSaving, setIsSaving] = useState(false);
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [km, setKm] = useState('');
    const [responses, setResponses] = useState<Record<string, 'ok' | 'issue' | 'pending'>>({
        front: 'pending',
        back: 'pending',
        left: 'pending',
        right: 'pending',
        pneus: 'pending',
        luzes: 'pending',
        fluidos: 'pending',
        vidros: 'pending',
        seguranca: 'pending',
    });

    useEffect(() => {
        const loadData = async () => {
            if (vehicleId) {
                const v = await database.get<Vehicle>('vehicles').find(vehicleId as string);
                setVehicle(v);
                if (type === 'checkout') setKm(v.currentKm.toString());
            }
            if (endKmParam) setKm(endKmParam as string);
        };
        loadData();
    }, [vehicleId, endKmParam]);

    const handleConfirmPoint = (id: string, status: 'ok' | 'issue') => {
        setResponses(prev => ({ ...prev, [id]: status }));
    };

    const handleFinish = async () => {
        const kmValue = parseInt(km);
        if (isNaN(kmValue)) {
            Alert.alert('Erro', 'Por favor, informe a quilometragem.');
            return;
        }

        if (type === 'checkout' && vehicle && kmValue < vehicle.currentKm) {
            Alert.alert('Erro', `KM inicial (${kmValue}) não pode ser menor que o atual (${vehicle.currentKm}).`);
            return;
        }

        const pendingItems = Object.keys(responses).filter(k => responses[k] === 'pending');
        if (pendingItems.length > 0) {
            Alert.alert('Atenção', `Faltam ${pendingItems.length} itens no checklist.`);
            return;
        }

        setIsSaving(true);
        try {
            await database.write(async () => {
                if (type === 'checkout') {
                    // 1. Create Journey
                    const newJourney = await database.get<Journey>('journeys').create(j => {
                        j.vehicleId = vehicleId as string;
                        j.driverId = user?.id || 'offline_driver';
                        j.status = 'IN_PROGRESS';
                        j.startKm = kmValue;
                        j.startTime = Date.now();
                    });

                    // 2. Create Checklist
                    await database.get('checklists').create((c: any) => {
                        c.journey_id = newJourney.id;
                        c.type = 'checkout';
                        c.items = JSON.stringify(responses);
                    });

                    // 3. Update Vehicle
                    if (vehicle) {
                        await vehicle.update(v => {
                            v.status = 'IN_USE';
                            v.currentKm = kmValue;
                        });
                    }
                    
                    // 4. Queue API Sync
                    await outboxService.enqueue('START_JOURNEY', {
                        vehicleId: vehicleId as string,
                        startKm: kmValue,
                        checklistItems: Object.entries(responses).map(([id, status]) => ({
                            itemId: id,
                            status: status === 'ok' ? 'OK' : 'PROBLEM'
                        }))
                    });

                    Alert.alert('Sucesso', 'Jornada iniciada com sucesso!', [
                        { text: 'OK', onPress: () => router.replace('/(tabs)/journey') }
                    ]);
                } else if (type === 'checkin' && journeyId) {
                    // 1. Find Journey
                    const journey = await database.get<Journey>('journeys').find(journeyId as string);
                    
                    // 2. Create Checklist
                    await database.get('checklists').create((c: any) => {
                        c.journey_id = journey.id;
                        c.type = 'checkin';
                        c.items = JSON.stringify(responses);
                    });

                    // 3. Update Journey
                    await journey.update(j => {
                        j.status = 'COMPLETED';
                        j.endKm = kmValue;
                        j.endTime = Date.now();
                    });

                    // 4. Update Vehicle
                    const v = await journey.vehicle.fetch();
                    if (v) {
                        await v.update(rec => {
                            rec.status = 'AVAILABLE';
                            rec.currentKm = kmValue;
                        });
                    }

                    // 5. Queue API Sync
                    await outboxService.enqueue('END_JOURNEY', {
                        journeyId: journeyId as string,
                        endKm: kmValue,
                        checklistItems: Object.entries(responses).map(([id, status]) => ({
                            itemId: id,
                            status: status === 'ok' ? 'OK' : 'PROBLEM'
                        }))
                    });

                    Alert.alert('Sucesso', 'Jornada encerrada com sucesso!', [
                        { text: 'OK', onPress: () => router.replace('/(tabs)') }
                    ]);
                }
            });
        } catch (e: any) {
            Alert.alert('Erro', e.message || 'Erro ao salvar checklist');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" />
            
            {/* Header / Progress */}
            <View className="px-6 py-4 flex-row items-center justify-between border-b border-slate-50">
                <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-xl bg-[#F8F9FA] items-center justify-center border border-slate-200">
                    <ChevronLeft size={20} color="#1A1C1E" />
                </TouchableOpacity>
                <View className="flex-row items-center">
                    <View className={`w-12 h-1.5 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-slate-100'} mr-2`} />
                    <View className={`w-12 h-1.5 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-slate-100'}`} />
                </View>
                <View className="w-10 h-10" />
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {step === 1 ? (
                    <View className="p-8">
                        <Text className="text-blue-600 font-bold text-xs uppercase tracking-[3px] mb-2">Etapa 01 de 02</Text>
                        <Text className="text-[#1A1C1E] text-3xl font-black mb-10 leading-tight">Estado do Veículo</Text>
                        
                        {/* KM Input */}
                        <View className="mb-10 bg-slate-50 p-6 rounded-[32px] border border-slate-100 shadow-sm">
                            <View className="flex-row items-center mb-4">
                                <Gauge size={20} color="#64748B" />
                                <Text className="ml-2 text-slate-500 font-bold text-xs uppercase tracking-widest">
                                    Quilometragem {type === 'checkout' ? 'Inicial' : 'Final'}
                                </Text>
                            </View>
                            <TextInput
                                className="text-3xl font-bold text-blue-600"
                                keyboardType="numeric"
                                placeholder="000.000"
                                value={km}
                                onChangeText={setKm}
                            />
                        </View>

                        {/* Car Diagram */}
                        <Text className="text-slate-900 font-bold text-lg mb-6">Inspeção Visual</Text>
                        <View className="relative bg-[#1A1C1E] rounded-[48px] p-10 h-[380px] items-center justify-center shadow-xl shadow-black/10">
                             <View className="absolute inset-0 items-center justify-center">
                                <Truck size={240} color="#334155" strokeWidth={0.5} />
                             </View>

                             <InspectionPoint top={15} left={50} status={responses.front} onPress={() => handleConfirmPoint('front', 'ok')} />
                             <InspectionPoint top={80} left={50} status={responses.back} onPress={() => handleConfirmPoint('back', 'ok')} />
                             <InspectionPoint top={50} left={10} status={responses.left} onPress={() => handleConfirmPoint('left', 'ok')} />
                             <InspectionPoint top={50} left={90} status={responses.right} onPress={() => handleConfirmPoint('right', 'ok')} />
                        </View>

                        <View className="mt-8 flex-row bg-blue-50 p-6 rounded-[32px] items-center">
                            <Info size={20} color="#2563EB" />
                            <Text className="text-blue-700 text-sm font-medium ml-4 leading-5 flex-1">
                                Toque nos pontos para sinalizar o estado das quatro faces do veículo.
                            </Text>
                        </View>
                        
                        <TouchableOpacity 
                            onPress={() => setStep(2)}
                            className="mt-10 h-18 bg-[#1A1C1E] rounded-3xl flex-row items-center justify-center shadow-lg py-5"
                        >
                            <Text className="text-white font-bold text-base uppercase tracking-widest mr-2">Próxima Etapa</Text>
                            <ArrowRight size={18} color="white" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View className="p-8">
                        <Text className="text-blue-600 font-bold text-xs uppercase tracking-[3px] mb-2">Etapa 02 de 02</Text>
                        <Text className="text-[#1A1C1E] text-3xl font-black mb-10 leading-tight">Itens Críticos</Text>
                        
                        {CHECKLIST_ITEMS.map((item) => {
                            const Icon = item.icon;
                            return (
                                <View key={item.id} className="mb-6 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                                    <View className="flex-row items-center mb-4">
                                        <View className="w-10 h-10 bg-slate-50 rounded-xl items-center justify-center">
                                            <Icon size={20} color="#64748B" />
                                        </View>
                                        <Text className="text-[#1A1C1E] font-bold text-base ml-3">{item.label}</Text>
                                    </View>
                                    <View className="flex-row">
                                        <TouchableOpacity 
                                            onPress={() => handleConfirmPoint(item.id, 'ok')}
                                            className={`flex-1 h-14 rounded-2xl items-center justify-center flex-row ${responses[item.id] === 'ok' ? 'bg-emerald-500' : 'bg-slate-50'}`}
                                        >
                                            <CheckCircle2 size={18} color={responses[item.id] === 'ok' ? 'white' : '#10B981'} />
                                            <Text className={`ml-2 font-bold ${responses[item.id] === 'ok' ? 'text-white' : 'text-emerald-500'}`}>ESTÁ OK</Text>
                                        </TouchableOpacity>
                                        <View className="w-4" />
                                        <TouchableOpacity 
                                            onPress={() => handleConfirmPoint(item.id, 'issue')}
                                            className={`flex-1 h-14 rounded-2xl items-center justify-center flex-row ${responses[item.id] === 'issue' ? 'bg-red-500' : 'bg-slate-50'}`}
                                        >
                                            <AlertTriangle size={18} color={responses[item.id] === 'issue' ? 'white' : '#EF4444'} />
                                            <Text className={`ml-2 font-bold ${responses[item.id] === 'issue' ? 'text-white' : 'text-red-500'}`}>PROBLEMA</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        })}

                        <TouchableOpacity 
                            onPress={handleFinish}
                            disabled={isSaving}
                            className={`mt-10 h-20 bg-blue-600 rounded-[30px] flex-row items-center justify-center shadow-xl shadow-blue-500/20 ${isSaving ? 'opacity-50' : ''}`}
                        >
                            {isSaving ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Check size={24} color="white" />
                                    <Text className="text-white font-bold text-lg uppercase tracking-widest ml-3">
                                        {type === 'checkout' ? 'Iniciar Jornada' : 'Finalizar Tudo'}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity 
                            onPress={() => setStep(1)}
                            className="mt-6 h-14 items-center justify-center"
                        >
                            <Text className="text-slate-400 font-bold uppercase text-[10px] tracking-[2px]">Voltar para etapa 01</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

