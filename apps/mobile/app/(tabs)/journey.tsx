import { View, Text, TouchableOpacity, Alert, TextInput, Modal, ScrollView, Image, SafeAreaView, ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { useEffect, useState, useRef } from 'react';
import { locationService, LocationCoords } from '../../src/services/location';
import { useRouter } from 'expo-router';
import { Camera as VisionCamera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { useAuth } from '../_layout';
import { Clock, Gauge, Fuel, AlertTriangle, MapPin, X, ChevronLeft, Menu, Camera as CameraIcon, Check, Navigation, Truck } from 'lucide-react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import NetInfo from '@react-native-community/netinfo';
import withObservables from '@nozbe/with-observables';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../src/model/database';
import Journey from '../../src/model/Journey';
import Vehicle from '../../src/model/Vehicle';
import Task from '../../src/model/Task';
import SyncQueue from '../../src/model/SyncQueue';
import { outboxService } from '../../src/services/OutboxService';
import { switchMap, of, map, combineLatest } from 'rxjs';
import Animated, { FadeInDown, FadeInUp, Layout, FadeIn } from 'react-native-reanimated';

const PAYMENT_METHODS = [
    { id: 'CASH', label: 'Dinheiro', icon: '💵' },
    { id: 'PIX', label: 'Pix', icon: '📱' },
    { id: 'DEBIT_CARD', label: 'Débito', icon: '💳' },
    { id: 'CREDIT_CARD', label: 'Crédito', icon: '💳' },
    { id: 'FUEL_CARD', label: 'Cartão Comb.', icon: '⛽' },
    { id: 'INVOICED', label: 'Faturado/À Pagar', icon: '📄' },
    { id: 'REIMBURSEMENT', label: 'Reembolso', icon: '🔄' },
];

function JourneyScreen({ activeJourney, vehicle, pendingSyncCount, tasks = [] }: { activeJourney: Journey | null; vehicle: Vehicle | null; pendingSyncCount: number; tasks: Task[] }) {

    const [showEndModal, setShowEndModal] = useState(false);
    const [showFuelModal, setShowFuelModal] = useState(false);
    const [endKm, setEndKm] = useState('');
    const [fuelData, setFuelData] = useState({
        km: '',
        liters: '',
        totalValue: '',
        fuelType: 'GASOLINE',
        paymentMethod: 'CASH',
        paymentProvider: '',
        paymentReference: '',
    });
    const [isSavingFuel, setIsSavingFuel] = useState(false);
    const [showIncidentModal, setShowIncidentModal] = useState(false);
    const [incidentDescription, setIncidentDescription] = useState('');
    const [incidentSeverity, setIncidentSeverity] = useState('MEDIUM');
    const [isReportingIncident, setIsReportingIncident] = useState(false);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [expenseData, setExpenseData] = useState({
        type: 'TOLL',
        amount: '',
        paymentMethod: 'CASH',
        description: '',
    });
    const [isSavingExpense, setIsSavingExpense] = useState(false);
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
    const [showCamera, setShowCamera] = useState(false);
    const [elapsedTime, setElapsedTime] = useState('00:00:00');
    const [currentLocation, setCurrentLocation] = useState<LocationCoords | null>(null);
    const [isOffline, setIsOffline] = useState(false);

    const { hasPermission, requestPermission } = useCameraPermission();
    const device = useCameraDevice('back');
    const camera = useRef<any>(null);
    const mapRef = useRef<MapView>(null);
    const { token, user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (activeJourney && vehicle) {
            locationService.startTracking(
                vehicle.id,
                activeJourney.id,
                token || undefined,
                user?.organizationId,
                (coords) => setCurrentLocation(coords)
            );
            locationService.startBackgroundTracking(vehicle.id);
        } else {
            locationService.stopTracking();
            locationService.stopBackgroundTracking();
        }
    }, [activeJourney?.id, vehicle?.id]);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            const nowOffline = !state.isConnected;
            setIsOffline(nowOffline);
            if (state.isConnected && token) {
                outboxService.processQueue(token);
            }
        });
        if (token) {
            outboxService.processQueue(token);
        }
        return () => { unsubscribe(); };
    }, [token]);

    useEffect(() => {
        if (!activeJourney) return;
        const interval = setInterval(() => {
            const start = new Date(activeJourney.startTime).getTime();
            const now = Date.now();
            const diff = now - start;
            const h = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
            const s = Math.floor((diff % (1000 * 60)) / 1000).toString().padStart(2, '0');
            setElapsedTime(`${h}:${m}:${s}`);
        }, 1000);
        return () => clearInterval(interval);
    }, [activeJourney]);

    const centerMap = () => {
        if (currentLocation && mapRef.current) {
            mapRef.current.animateToRegion({
                ...currentLocation,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
            });
        }
    };

    const handleConfirmFuel = async () => {
        const { km, liters, totalValue, fuelType, paymentMethod, paymentProvider, paymentReference } = fuelData;
        const kmNum = parseInt(km);
        const litersNum = parseFloat(liters);
        const valueNum = parseFloat(totalValue);

        if (isNaN(kmNum) || isNaN(litersNum) || isNaN(valueNum)) {
            Alert.alert('Erro', 'Por favor, preencha todos os campos corretamente.');
            return;
        }

        setIsSavingFuel(true);
        try {
            if (!vehicle || !activeJourney) return;
            const payload = {
                vehicleId: vehicle.id,
                journeyId: activeJourney.id,
                km: kmNum,
                liters: litersNum,
                totalValue: valueNum,
                pricePerLiter: valueNum / litersNum,
                fuelType,
                paymentMethod,
                paymentProvider,
                paymentReference,
            };

            await outboxService.enqueue('REGISTER_FUEL', payload);

            Alert.alert('Sucesso', isOffline ? 'Abastecimento guardado para envio offline!' : 'Abastecimento registrado com sucesso!');
            setShowFuelModal(false);
        } catch (e: any) {
            Alert.alert('Erro', e.message || 'Erro ao registrar abastecimento');
        } finally {
            setIsSavingFuel(false);
        }
    };

    const handleConfirmExpense = async () => {
        const { amount, type, paymentMethod, description } = expenseData;
        const amountNum = parseFloat(amount);

        if (isNaN(amountNum) || amountNum <= 0) {
            Alert.alert('Erro', 'Por favor, informe um valor válido.');
            return;
        }

        setIsSavingExpense(true);
        try {
            if (!activeJourney) return;
            const payload = {
                journeyId: activeJourney.id,
                type,
                amount: amountNum,
                paymentMethod,
                description,
                category: type === 'TOLL' ? 'TOLL' : 'PARKING'
            };

            await outboxService.enqueue('REGISTER_EXPENSE', payload, capturedPhoto || undefined);

            Alert.alert('Sucesso', isOffline ? 'Despesa guardada para envio offline!' : 'Despesa registrada com sucesso!');
            setCapturedPhoto(null);
            setShowExpenseModal(false);
        } catch (e: any) {
            Alert.alert('Erro', e.message || 'Erro ao registrar despesa');
        } finally {
            setIsSavingExpense(false);
        }
    };

    const takePhoto = async () => {
        if (camera.current) {
            const file = await camera.current.takePhoto();
            setCapturedPhoto(`file://${file.path}`);
            setShowCamera(false);
        }
    };

    const handleReportIncident = async () => {
        if (!incidentDescription.trim()) {
            Alert.alert('Erro', 'Por favor, descreva o incidente.');
            return;
        }
        setIsReportingIncident(true);
        try {
            if (!vehicle || !activeJourney) return;
            
            const currentPos = await locationService.getCurrentPosition();
            const payload = {
                vehicleId: vehicle.id,
                journeyId: activeJourney.id,
                description: incidentDescription,
                severity: incidentSeverity,
                lat: currentPos?.lat?.toString(),
                lng: currentPos?.lng?.toString()
            };

            await outboxService.enqueue('REPORT_INCIDENT', payload, capturedPhoto || undefined);

            Alert.alert('Sucesso', isOffline ? 'Incidente guardado para envio offline!' : 'Incidente relatado com sucesso!');
            setIncidentDescription('');
            setCapturedPhoto(null);
            setShowIncidentModal(false);
        } catch (e: any) {
            Alert.alert('Erro', e.message || 'Erro ao relatar incidente');
        } finally {
            setIsReportingIncident(false);
        }
    };

    const handleToggleTask = async (task: Task) => {
        const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
        try {
            const payload = {
                taskId: task.id,
                status: newStatus,
                completedAt: newStatus === 'COMPLETED' ? new Date().toISOString() : null
            };
            await outboxService.enqueue('UPDATE_TASK_STATUS', payload);
            
            // Optimistic update if possible, otherwise rely on sync
            // For now, let's just show a small toast or rely on outbox processing
        } catch (e: any) {
            Alert.alert('Erro', 'Não foi possível atualizar a tarefa.');
        }
    };

    const handleConfirmEnd = async () => {
        if (!activeJourney) return;
        const km = parseInt(endKm);
        if (isNaN(km) || km < activeJourney.startKm) {
            Alert.alert('Erro', 'KM final inválido.');
            return;
        }
        setShowEndModal(false);
        router.push({
            pathname: '/checklist',
            params: { type: 'checkin', journeyId: activeJourney.id, endKm: km }
        } as any);
    };

    if (showCamera) {
        if (Platform.OS === 'web') {
            return (
                <View className="flex-1 bg-black items-center justify-center">
                    <Text className="text-white">Câmera não suportada na Web</Text>
                    <TouchableOpacity className="mt-4 p-4 bg-white/10 rounded-xl" onPress={() => setShowCamera(false)}>
                        <Text className="text-white font-bold">Voltar</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        try {
            return (
                <View className="flex-1 bg-black">
                    {VisionCamera ? (
                        <VisionCamera ref={camera as any} style={{ flex: 1 }} device={device!} isActive={true} photo={true} />
                    ) : (
                        <View className="flex-1 items-center justify-center">
                            <Text className="text-white">Native module 'VisionCamera' not found</Text>
                        </View>
                    )}
                    <TouchableOpacity className="absolute bottom-12 self-center w-20 h-20 rounded-full bg-white items-center justify-center" onPress={takePhoto}>
                        <View className="w-16 h-16 rounded-full border-4 border-primary" />
                    </TouchableOpacity>
                    <TouchableOpacity className="absolute bottom-12 left-8 p-4 bg-black/60 rounded-xl" onPress={() => setShowCamera(false)}>
                        <Text className="text-white font-bold">Cancelar</Text>
                    </TouchableOpacity>
                </View>
            );
        } catch (e) {
            return (
                <View className="flex-1 bg-black items-center justify-center">
                    <Text className="text-white">Erro ao carregar câmera</Text>
                    <TouchableOpacity className="mt-4 p-4 bg-white/10 rounded-xl" onPress={() => setShowCamera(false)}>
                        <Text className="text-white font-bold">Voltar</Text>
                    </TouchableOpacity>
                </View>
            );
        }
    }

    if (!activeJourney || !vehicle) {
        return (
            <SafeAreaView className="flex-1 bg-[#F1F3F5] items-center justify-center p-10">
                <View className="w-24 h-24 bg-white rounded-full items-center justify-center mb-6 shadow-sm border border-slate-100">
                    <Truck size={48} color="#ADB5BD" />
                </View>
                <Text className="text-2xl font-bold text-[#1A1C1E] text-center">Nenhuma jornada ativa</Text>
                <Text className="text-slate-500 text-center mt-3 text-lg">Selecione um veículo na aba Veículos para começar.</Text>
                <TouchableOpacity 
                    className="mt-10 px-10 h-14 bg-[#2563EB] rounded-2xl items-center justify-center shadow-lg shadow-blue-500/20" 
                    onPress={() => router.push('/(tabs)')}
                >
                    <Text className="text-white font-bold text-lg">Ver Veículos</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-[#F1F3F5]">
            <StatusBar barStyle="dark-content" />
            
            <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b border-slate-100">
                <TouchableOpacity className="w-10 h-10 rounded-xl bg-[#F8F9FA] items-center justify-center border border-slate-200">
                    <Menu size={20} color="#64748B" />
                </TouchableOpacity>
                <Text className="text-[#1A1C1E] font-bold text-sm tracking-widest uppercase">
                    Jornada Ativa
                </Text>
                <View className="flex-row items-center">
                    {pendingSyncCount > 0 && (
                        <View className="bg-amber-100 p-2 rounded-full mr-2">
                            <Truck size={14} color="#D97706" />
                        </View>
                    )}
                    <View className={`w-3 h-3 rounded-full ${isOffline ? 'bg-red-500' : 'bg-emerald-500'}`} />
                </View>
            </View>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
                <Animated.View 
                    entering={FadeInDown.delay(100).springify()}
                    className="px-6 pt-8 mb-6"
                >
                    <View className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 items-center">
                        <Text className="text-slate-400 font-bold text-xs uppercase tracking-[4px] mb-2">Placa</Text>
                        <Text className="text-5xl font-black text-[#1A1C1E] tracking-tighter uppercase">{vehicle?.plate}</Text>
                        <View className="bg-[#F1F3F5] px-4 py-2 rounded-full mt-4">
                            <Text className="text-slate-600 font-bold text-xs uppercase tracking-wider">{vehicle?.brand} {vehicle?.model}</Text>
                        </View>
                    </View>
                </Animated.View>

                <Animated.View 
                    entering={FadeInDown.delay(200).springify()}
                    className="px-6 mb-8"
                >
                    <View className="bg-[#1A1C1E] rounded-[32px] p-8 items-center shadow-xl shadow-black/10">
                        <Text className="text-slate-400 text-xs font-bold uppercase tracking-[3px] mb-3">Tempo de Viagem</Text>
                        <Text className="text-white text-6xl font-bold tracking-tighter">{elapsedTime}</Text>
                        
                        <View className="flex-row mt-8 space-x-8">
                            <View className="items-center">
                                <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Início</Text>
                                <Text className="text-white font-bold text-lg">{new Date(activeJourney.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text>
                            </View>
                            <View className="w-[1px] h-10 bg-slate-800" />
                            <View className="items-center">
                                <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">KM Inicial</Text>
                                <Text className="text-white font-bold text-lg">{activeJourney.startKm.toLocaleString()}</Text>
                            </View>
                        </View>
                    </View>
                </Animated.View>

                <Animated.View 
                    entering={FadeInDown.delay(300).springify()}
                    className="px-6 mb-8"
                >
                    <View className="relative h-44 w-full rounded-3xl overflow-hidden shadow-sm border border-slate-200 bg-slate-100 items-center justify-center">
                        {Platform.OS !== 'web' && MapView ? (
                            <MapView
                                ref={mapRef as any}
                                style={{ width: '100%', height: '100%' }}
                                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                                initialRegion={currentLocation ? {
                                    ...currentLocation,
                                    latitudeDelta: 0.01,
                                    longitudeDelta: 0.01,
                                } : undefined}
                                showsUserLocation
                                showsMyLocationButton={false}
                            >
                                {currentLocation && <Marker coordinate={currentLocation} />}
                            </MapView>
                        ) : (
                            <View className="items-center">
                                <MapPin size={32} color="#CBD5E1" />
                                <Text className="text-slate-400 font-medium mt-2">Mapa não disponível</Text>
                            </View>
                        )}
                        {Platform.OS !== 'web' && MapView && (
                            <View className="absolute top-4 right-4">
                                <TouchableOpacity
                                    className="w-10 h-10 bg-white rounded-xl items-center justify-center shadow-lg"
                                    onPress={centerMap}
                                >
                                    <Navigation size={20} color="#2563EB" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </Animated.View>

                <Animated.View 
                    entering={FadeInDown.delay(400).springify()}
                    layout={Layout.springify()}
                    className="px-6 space-y-4"
                >
                    <TouchableOpacity 
                        activeOpacity={0.7}
                        className="w-full h-20 bg-white rounded-3xl flex-row items-center px-6 shadow-sm border border-slate-100" 
                        onPress={() => { setFuelData({ ...fuelData, km: vehicle ? vehicle.currentKm.toString() : '' }); setShowFuelModal(true); }}
                    >
                        <View className="w-12 h-12 rounded-2xl bg-emerald-50 items-center justify-center">
                            <Fuel size={24} color="#059669" />
                        </View>
                        <View className="ml-4 flex-1">
                            <Text className="text-[#1A1C1E] font-bold text-base">Abastecer</Text>
                            <Text className="text-slate-400 text-xs font-medium">Registrar novo abastecimento</Text>
                        </View>
                        <ChevronLeft size={20} color="#ADB5BD" style={{ transform: [{ rotate: '180deg' }] }} />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        activeOpacity={0.7}
                        className="w-full h-20 bg-white rounded-3xl flex-row items-center px-6 shadow-sm border border-slate-100" 
                        onPress={() => setShowIncidentModal(true)}
                    >
                        <View className="w-12 h-12 rounded-2xl bg-amber-50 items-center justify-center">
                            <AlertTriangle size={24} color="#D97706" />
                        </View>
                        <View className="ml-4 flex-1">
                            <Text className="text-[#1A1C1E] font-bold text-base">Incidente</Text>
                            <Text className="text-slate-400 text-xs font-medium">Relatar problemas ou ocorrências</Text>
                        </View>
                        <ChevronLeft size={20} color="#ADB5BD" style={{ transform: [{ rotate: '180deg' }] }} />
                    </TouchableOpacity>

                    <View className="flex-row space-x-4">
                        <TouchableOpacity 
                            activeOpacity={0.7}
                            className="flex-1 h-20 bg-white rounded-3xl flex-row items-center px-4 shadow-sm border border-slate-100" 
                            onPress={() => { setExpenseData({ ...expenseData, type: 'TOLL' }); setShowExpenseModal(true); }}
                        >
                            <View className="w-10 h-10 rounded-xl bg-blue-50 items-center justify-center">
                                <MapPin size={20} color="#2563EB" />
                            </View>
                            <View className="ml-3 flex-1">
                                <Text className="text-[#1A1C1E] font-bold text-sm">Pedágio</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            activeOpacity={0.7}
                            className="flex-1 h-20 bg-white rounded-3xl flex-row items-center px-4 shadow-sm border border-slate-100" 
                            onPress={() => { setExpenseData({ ...expenseData, type: 'PARKING' }); setShowExpenseModal(true); }}
                        >
                            <View className="w-10 h-10 rounded-xl bg-emerald-50 items-center justify-center">
                                <Clock size={20} color="#10B981" />
                            </View>
                            <View className="ml-3 flex-1">
                                <Text className="text-[#1A1C1E] font-bold text-sm">Estacionam.</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity 
                        activeOpacity={0.8}
                        className="w-full h-16 bg-[#EF4444] rounded-2xl items-center justify-center shadow-lg shadow-red-500/20 mt-6" 
                        onPress={() => { setEndKm(vehicle ? vehicle.currentKm.toString() : ''); setShowEndModal(true); }}
                    >
                        <Text className="text-white font-bold text-base uppercase tracking-widest">Encerrar Jornada</Text>
                    </TouchableOpacity>

                    {tasks.length > 0 && (
                        <View className="mt-8">
                            <Text className="text-[#1A1C1E] font-bold text-lg mb-4">Minhas Tarefas ({tasks.filter(t => t.status === 'COMPLETED').length}/{tasks.length})</Text>
                            <View className="space-y-3">
                                {tasks.map((task, index) => (
                                    <Animated.View 
                                        key={task.id} 
                                        entering={FadeInDown.delay(500 + index * 100).springify()}
                                        layout={Layout.springify()}
                                    >
                                        <TouchableOpacity 
                                            activeOpacity={0.7}
                                            onPress={() => handleToggleTask(task)}
                                            className={`p-5 rounded-3xl bg-white border ${task.status === 'COMPLETED' ? 'border-emerald-100 bg-emerald-50/10' : 'border-slate-100'}`}
                                        >
                                            <View className="flex-row items-center">
                                                <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${task.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-slate-100'}`}>
                                                    {task.status === 'COMPLETED' ? <Check size={16} color="white" /> : <Clock size={16} color="#94A3B8" />}
                                                </View>
                                                <View className="flex-1">
                                                    <Text className={`font-bold text-base ${task.status === 'COMPLETED' ? 'text-emerald-700 line-through' : 'text-[#1A1C1E]'}`}>{task.title}</Text>
                                                    {task.description && <Text className="text-slate-500 text-xs mt-1">{task.description}</Text>}
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    </Animated.View>
                                ))}
                            </View>
                        </View>
                    )}
                </Animated.View>
            </ScrollView>

            <Modal visible={showFuelModal} transparent animationType="fade">
                <View className="flex-1 bg-black/60 justify-end">
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                        <View className="bg-white rounded-t-[32px] p-8 pt-6">
                            <View className="w-12 h-1 bg-slate-200 self-center rounded-full mb-8" />
                            <View className="flex-row justify-between items-center mb-6">
                                <Text className="text-2xl font-bold text-[#1A1C1E] uppercase tracking-tight">Abastecimento</Text>
                                <TouchableOpacity onPress={() => setShowFuelModal(false)} className="p-2"><X size={24} color="#ADB5BD" /></TouchableOpacity>
                            </View>
                             <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
                                <View className="space-y-6">
                                    <View>
                                        <Text className="text-[#1A1C1E] text-xs font-bold uppercase mb-2 ml-1">KM Atual</Text>
                                        <TextInput className="h-14 bg-[#F8F9FA] rounded-xl px-4 text-[#1A1C1E] font-bold border border-transparent shadow-sm" keyboardType="numeric" value={fuelData.km} onChangeText={val => setFuelData({ ...fuelData, km: val })} />
                                    </View>
                                    <View className="flex-row space-x-4">
                                        <View className="flex-1">
                                            <Text className="text-[#1A1C1E] text-xs font-bold uppercase mb-2 ml-1">Litros</Text>
                                            <TextInput className="h-14 bg-[#F8F9FA] rounded-xl px-4 text-[#1A1C1E] font-bold border border-transparent shadow-sm" keyboardType="numeric" placeholder="0.00" value={fuelData.liters} onChangeText={val => setFuelData({ ...fuelData, liters: val })} />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-[#1A1C1E] text-xs font-bold uppercase mb-2 ml-1">Valor Total (R$)</Text>
                                            <TextInput className="h-14 bg-[#F8F9FA] rounded-xl px-4 text-[#1A1C1E] font-bold border border-transparent shadow-sm" keyboardType="numeric" placeholder="0.00" value={fuelData.totalValue} onChangeText={val => setFuelData({ ...fuelData, totalValue: val })} />
                                        </View>
                                    </View>
                                    <View>
                                        <Text className="text-[#1A1C1E] text-xs font-bold uppercase mb-3 ml-1">Pagamento</Text>
                                         <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                                            {PAYMENT_METHODS.map(m => (
                                                <TouchableOpacity 
                                                    key={m.id} 
                                                    onPress={() => setFuelData({ ...fuelData, paymentMethod: m.id })} 
                                                    className={`px-4 h-12 rounded-xl flex-row items-center border ${fuelData.paymentMethod === m.id ? 'bg-[#2563EB]/10 border-[#2563EB]' : 'bg-[#F8F9FA] border-transparent'}`}
                                                >
                                                    <Text className="mr-2">{m.icon}</Text>
                                                    <Text className={`font-bold text-xs ${fuelData.paymentMethod === m.id ? 'text-[#2563EB]' : 'text-slate-500'}`}>{m.label}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                </View>
                            </ScrollView>
                            <TouchableOpacity 
                                className={`h-16 bg-[#2563EB] rounded-2xl items-center justify-center shadow-lg shadow-blue-500/20 ${isSavingFuel ? 'opacity-70' : ''}`} 
                                onPress={handleConfirmFuel} 
                                disabled={isSavingFuel}
                            >
                                {isSavingFuel ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg uppercase tracking-widest">Salvar Registro</Text>}
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>

            <Modal visible={showIncidentModal} transparent animationType="fade">
                <View className="flex-1 bg-black/60 justify-end">
                    <View className="bg-white rounded-t-[32px] p-8 pt-6">
                        <View className="w-12 h-1 bg-slate-200 self-center rounded-full mb-8" />
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-2xl font-bold text-[#1A1C1E] uppercase tracking-tight">Relatar Incidente</Text>
                            <TouchableOpacity onPress={() => setShowIncidentModal(false)} className="p-2"><X size={24} color="#ADB5BD" /></TouchableOpacity>
                        </View>
                        <View className="mb-6">
                            <Text className="text-[#1A1C1E] text-xs font-bold uppercase mb-2 ml-1">Descrição</Text>
                            <TextInput 
                                className="bg-[#F8F9FA] rounded-2xl p-4 text-[#1A1C1E] h-32 border border-transparent shadow-sm" 
                                multiline 
                                textAlignVertical="top" 
                                placeholder="Descreva o que aconteceu..." 
                                value={incidentDescription} 
                                onChangeText={setIncidentDescription} 
                            />
                        </View>
                        <View className="mb-8 flex-row items-center justify-between">
                            <TouchableOpacity className="flex-row items-center bg-[#F8F9FA] px-4 h-14 rounded-xl border border-transparent shadow-sm" onPress={() => setShowCamera(true)}>
                                <CameraIcon size={20} color="#2563EB" />
                                <Text className="text-[#2563EB] font-bold ml-2">{capturedPhoto ? 'Foto Capturada' : 'Tirar Foto'}</Text>
                                {capturedPhoto && <Check size={16} color="#10B981" className="ml-2" />}
                            </TouchableOpacity>
                            <View className="flex-row space-x-2">
                                {['LOW', 'MEDIUM', 'HIGH'].map(s => (
                                    <TouchableOpacity 
                                        key={s} 
                                        onPress={() => setIncidentSeverity(s)} 
                                        className={`w-10 h-10 rounded-full border-4 ${incidentSeverity === s ? 'border-[#2563EB]' : 'border-transparent'} ${s === 'HIGH' ? 'bg-red-500' : s === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                                    />
                                ))}
                            </View>
                        </View>
                        <TouchableOpacity 
                            className={`h-16 bg-[#2563EB] rounded-2xl items-center justify-center shadow-lg shadow-blue-500/20 ${isReportingIncident ? 'opacity-70' : ''}`} 
                            onPress={handleReportIncident} 
                            disabled={isReportingIncident}
                        >
                            {isReportingIncident ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg uppercase tracking-widest">Enviar Relato</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal visible={showEndModal} transparent animationType="fade">
                <View className="flex-1 bg-black/60 justify-center p-6">
                    <View className="bg-white rounded-[40px] p-8 shadow-xl">
                        <Text className="text-2xl font-bold text-[#1A1C1E] uppercase text-center mb-4">Encerrar Jornada</Text>
                        <Text className="text-slate-500 text-center mb-8 px-4">Informe a quilometragem final para prosseguir com o checklist de entrada.</Text>
                        <View className="mb-8">
                            <Text className="text-[#1A1C1E] text-xs font-bold uppercase mb-2 text-center tracking-widest">KM Final</Text>
                            <TextInput 
                                className="h-20 bg-[#F8F9FA] rounded-[32px] px-6 text-3xl font-bold text-[#2563EB] text-center" 
                                keyboardType="numeric" 
                                value={endKm} 
                                onChangeText={setEndKm} 
                                autoFocus 
                            />
                        </View>
                        <View className="flex-row space-x-4">
                            <TouchableOpacity className="flex-1 h-16 bg-white border border-slate-100 rounded-3xl items-center justify-center" onPress={() => setShowEndModal(false)}>
                                <Text className="text-slate-500 font-bold">Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity className="flex-[2] h-16 bg-[#EF4444] rounded-3xl items-center justify-center shadow-lg shadow-red-500/20" onPress={handleConfirmEnd}>
                                <Text className="text-white font-bold text-lg uppercase">Confirmar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal visible={showExpenseModal} transparent animationType="fade">
                <View className="flex-1 bg-black/60 justify-end">
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                        <View className="bg-white rounded-t-[32px] p-8 pt-6">
                            <View className="w-12 h-1 bg-slate-200 self-center rounded-full mb-8" />
                            <View className="flex-row justify-between items-center mb-6">
                                <Text className="text-2xl font-bold text-[#1A1C1E] uppercase tracking-tight">
                                    {expenseData.type === 'TOLL' ? 'Registrar Pedágio' : 'Registrar Estacionamento'}
                                </Text>
                                <TouchableOpacity onPress={() => setShowExpenseModal(false)} className="p-2"><X size={24} color="#ADB5BD" /></TouchableOpacity>
                            </View>
                            
                            <View className="space-y-6">
                                <View>
                                    <Text className="text-[#1A1C1E] text-xs font-bold uppercase mb-2 ml-1">Valor (R$)</Text>
                                    <TextInput 
                                        className="h-14 bg-[#F8F9FA] rounded-xl px-4 text-[#1A1C1E] font-bold border border-transparent shadow-sm" 
                                        keyboardType="numeric" 
                                        placeholder="0.00" 
                                        value={expenseData.amount} 
                                        onChangeText={val => setExpenseData({ ...expenseData, amount: val })} 
                                    />
                                </View>

                                <View>
                                    <Text className="text-[#1A1C1E] text-xs font-bold uppercase mb-3 ml-1">Forma de Pagamento</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                                        {PAYMENT_METHODS.map(m => (
                                            <TouchableOpacity 
                                                key={m.id} 
                                                onPress={() => setExpenseData({ ...expenseData, paymentMethod: m.id })} 
                                                className={`px-4 h-12 rounded-xl flex-row items-center border ${expenseData.paymentMethod === m.id ? 'bg-[#2563EB]/10 border-[#2563EB]' : 'bg-[#F8F9FA] border-transparent'}`}
                                            >
                                                <Text className="mr-2">{m.icon}</Text>
                                                <Text className={`font-bold text-xs ${expenseData.paymentMethod === m.id ? 'text-[#2563EB]' : 'text-slate-500'}`}>{m.label}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>

                                <View className="flex-row items-center justify-between mt-2">
                                    <TouchableOpacity className="flex-row items-center bg-[#F8F9FA] px-4 h-14 rounded-xl border border-transparent shadow-sm" onPress={() => setShowCamera(true)}>
                                        <CameraIcon size={20} color="#2563EB" />
                                        <Text className="text-[#2563EB] font-bold ml-2">{capturedPhoto ? 'Foto Capturada' : 'Anexar Comprovante'}</Text>
                                        {capturedPhoto && <Check size={16} color="#10B981" className="ml-2" />}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity 
                                className={`h-16 bg-[#2563EB] rounded-2xl items-center justify-center shadow-lg shadow-blue-500/20 mt-8 ${isSavingExpense ? 'opacity-70' : ''}`} 
                                onPress={handleConfirmExpense} 
                                disabled={isSavingExpense}
                            >
                                {isSavingExpense ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg uppercase tracking-widest">Salvar Registro</Text>}
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

let EnhancedJourney: any;

try {
    EnhancedJourney = withObservables(['driverId'], ({ driverId }: { driverId: string }) => {
        const activeJourneys$ = database.get<Journey>('journeys').query(
            Q.where('status', 'IN_PROGRESS'),
            Q.where('driver_id', driverId)
        ).observe();

        return {
            activeJourney: activeJourneys$.pipe(
                switchMap(journeys => journeys.length > 0 ? journeys[0].observe() : of(null))
            ),
            vehicle: activeJourneys$.pipe(
                switchMap(journeys => journeys.length > 0 ? journeys[0].vehicle.observe() : of(null))
            ),
            tasks: activeJourneys$.pipe(
                switchMap(journeys => journeys.length > 0 ? journeys[0].tasks.observe() : of([]))
            ),
            pendingSyncCount: database.get<SyncQueue>('sync_queue')
                .query(Q.where('status', Q.notEq('completed')))
                .observe()
                .pipe(map(items => items.length))
        };
    })(JourneyScreen);
} catch (e) {
    console.warn('[Journey] Failed to wrap with withObservables:', e);
    EnhancedJourney = (props: any) => <JourneyScreen {...props} activeJourney={null} vehicle={null} tasks={[]} pendingSyncCount={0} />;
}

export default function JourneyWrapper() {
    const { user } = useAuth();
    if (!user?.id) return <ActivityIndicator size="large" color="#2563EB" className="flex-1" />;
    return <EnhancedJourney driverId={user.id} />;
}

