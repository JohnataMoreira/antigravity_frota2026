import { View, Text, TouchableOpacity, Alert, TextInput, Modal, ScrollView, Image, SafeAreaView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useEffect, useState, useRef } from 'react';
import { locationService, LocationCoords } from '../../src/services/location';
import { api } from '../../src/services/api';
import { fuelService } from '../../src/services/fuelService';
import { photoService } from '../../src/services/photoService';
import { useRouter } from 'expo-router';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { useAuth } from '../_layout';
import { Clock, Gauge, Fuel, AlertTriangle, Hand, MapPin, X, ChevronLeft, Menu, Camera as CameraIcon, Check, Navigation, Truck, Wifi, WifiOff, CloudSync } from 'lucide-react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import NetInfo from '@react-native-community/netinfo';

const PAYMENT_METHODS = [
    { id: 'CASH', label: 'Dinheiro', icon: '💵' },
    { id: 'PIX', label: 'Pix', icon: '📱' },
    { id: 'DEBIT_CARD', label: 'Débito', icon: '💳' },
    { id: 'CREDIT_CARD', label: 'Crédito', icon: '💳' },
    { id: 'FUEL_CARD', label: 'Cartão Comb.', icon: '⛽' },
    { id: 'INVOICED', label: 'Faturado/À Pagar', icon: '📄' },
    { id: 'REIMBURSEMENT', label: 'Reembolso', icon: '🔄' },
];

export default function JourneyScreen() {
    const [activeJourney, setActiveJourney] = useState<any>(null);
    const [vehicle, setVehicle] = useState<any>(null);
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
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
    const [showCamera, setShowCamera] = useState(false);
    const [elapsedTime, setElapsedTime] = useState('00:00:00');
    const [currentLocation, setCurrentLocation] = useState<LocationCoords | null>(null);
    const [isOffline, setIsOffline] = useState(false);
    const [syncQueueSize, setSyncQueueSize] = useState(0);

    const { hasPermission, requestPermission } = useCameraPermission();
    const device = useCameraDevice('back');
    const camera = useRef<Camera>(null);
    const mapRef = useRef<MapView>(null);
    const { token } = useAuth();
    const router = useRouter();

    const fetchActive = async () => {
        try {
            const journey = await api.getActiveJourney();
            if (journey) {
                setActiveJourney(journey);
                setVehicle(journey.vehicle);
                await locationService.startTracking(
                    journey.vehicleId,
                    journey.id,
                    token || undefined,
                    undefined,
                    (coords) => setCurrentLocation(coords)
                );
            } else {
                setActiveJourney(null);
                setVehicle(null);
                locationService.stopTracking();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const checkQueue = async () => {
        const size = await photoService.getQueueSize();
        setSyncQueueSize(size);
    };

    useEffect(() => {
        fetchActive();
        const interval = setInterval(fetchActive, 15000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            const nowOffline = !state.isConnected;
            setIsOffline(nowOffline);

            if (state.isConnected && token) {
                photoService.processOfflineQueue(token).then(checkQueue);
            }
        });

        checkQueue();
        const queueInterval = setInterval(checkQueue, 10000);

        return () => {
            unsubscribe();
            clearInterval(queueInterval);
        };
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
            await fuelService.create({
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
            });
            Alert.alert('Sucesso', 'Abastecimento registrado com sucesso!');
            setShowFuelModal(false);
            fetchActive();
        } catch (e: any) {
            Alert.alert('Erro', e.message || 'Erro ao registrar abastecimento');
        } finally {
            setIsSavingFuel(false);
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
            let photoUrl = undefined;
            if (capturedPhoto && token) {
                photoUrl = await photoService.uploadPhoto(capturedPhoto, token);
            }
            const currentPos = await locationService.getCurrentPosition();
            await api.reportIncident({
                vehicleId: vehicle.id,
                journeyId: activeJourney.id,
                description: incidentDescription,
                severity: incidentSeverity,
                photoUrl: photoUrl || undefined,
                lat: currentPos?.lat?.toString(),
                lng: currentPos?.lng?.toString()
            });
            Alert.alert('Sucesso', 'Incidente relatado!');
            setIncidentDescription('');
            setCapturedPhoto(null);
            setShowIncidentModal(false);
            fetchActive();
        } catch (e: any) {
            Alert.alert('Erro', e.message || 'Erro ao relatar incidente');
        } finally {
            setIsReportingIncident(false);
        }
    };

    const handleConfirmEnd = async () => {
        const km = parseInt(endKm);
        if (isNaN(km) || km < activeJourney.startKm) {
            Alert.alert('Erro', 'KM final inválido.');
            return;
        }
        setShowEndModal(false);
        router.push({
            pathname: '/checklist',
            params: { type: 'checkin', journeyId: activeJourney.id, endKm: km }
        });
    };

    if (showCamera) {
        return (
            <View className="flex-1 bg-black">
                <Camera ref={camera} style={{ flex: 1 }} device={device!} isActive={true} photo={true} />
                <TouchableOpacity className="absolute bottom-12 self-center w-20 h-20 rounded-full bg-white items-center justify-center" onPress={takePhoto}>
                    <View className="w-16 h-16 rounded-full border-4 border-primary" />
                </TouchableOpacity>
                <TouchableOpacity className="absolute bottom-12 left-8 p-4 bg-black/60 rounded-xl" onPress={() => setShowCamera(false)}>
                    <Text className="text-white font-bold">Cancelar</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!activeJourney) {
        return (
            <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark items-center justify-center p-10">
                <View className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full items-center justify-center mb-6">
                    <Truck size={48} color="#94a3b8" />
                </View>
                <Text className="text-2xl font-black text-slate-900 dark:text-white text-center">Nenhuma jornada ativa</Text>
                <Text className="text-slate-500 dark:text-slate-400 text-center mt-3 text-lg">Selecione um veículo na aba Veículos para começar.</Text>
                <TouchableOpacity className="mt-10 px-8 h-14 bg-primary rounded-2xl items-center justify-center shadow-lg shadow-primary/20" onPress={() => router.push('/(tabs)')}>
                    <Text className="text-white font-bold text-lg">Ver Veículos</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
            <View className="flex-row items-center bg-white dark:bg-slate-900 px-4 py-4 border-b border-slate-200 dark:border-slate-800">
                <TouchableOpacity className="p-2 mr-2"><Menu size={24} color="#475569" /></TouchableOpacity>
                <Text className="text-slate-900 dark:text-white text-lg font-bold flex-1 text-center">Frota2026 Driver</Text>
                <View className="flex-row items-center space-x-2">
                    {syncQueueSize > 0 && (
                        <View className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-full">
                            <CloudSync size={16} color="#d97706" />
                        </View>
                    )}
                    <View className={`p-2 rounded-full ${isOffline ? 'bg-red-100 dark:bg-red-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'}`}>
                        {isOffline ? <WifiOff size={16} color="#ef4444" /> : <Wifi size={16} color="#10b981" />}
                    </View>
                </View>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
                <View className="px-6 py-10 items-center">
                    <Text className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">{vehicle?.plate}</Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-xl font-medium mt-2 uppercase tracking-widest">{vehicle?.brand} {vehicle?.model}</Text>
                </View>

                <View className="px-6 mb-8">
                    <View className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-xl border border-slate-100 dark:border-slate-800">
                        <View className="p-8">
                            <View className="flex-row items-center justify-between mb-8">
                                <Text className="text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-widest">Início</Text>
                                <Text className="text-slate-900 dark:text-white font-black text-xl">{new Date(activeJourney.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text>
                            </View>
                            <View className="items-center py-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <Text className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Tempo de Viagem</Text>
                                <Text className="text-slate-900 dark:text-white text-5xl font-mono font-black tracking-tighter">{elapsedTime}</Text>
                            </View>
                            <View className="flex-row items-center justify-between mt-8">
                                <View className="flex-row items-center"><Clock size={20} color="#2463eb" /><Text className="text-slate-600 dark:text-slate-300 font-semibold ml-2">KM Atual</Text></View>
                                <Text className="text-primary font-black text-2xl">{vehicle?.currentKm.toLocaleString()} km</Text>
                            </View>
                        </View>
                        <View className="h-2 w-full bg-slate-100 dark:bg-slate-800"><View className="h-full bg-primary w-2/3" /></View>
                    </View>
                </View>

                {/* REAL MAP COMPONENT */}
                <View className="px-6 mb-10">
                    <View className="relative h-48 w-full rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 bg-slate-200">
                        <MapView
                            ref={mapRef}
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
                            {currentLocation && (
                                <Marker
                                    coordinate={currentLocation}
                                    title="Você está aqui"
                                />
                            )}
                        </MapView>
                        <View className="absolute top-4 right-4 space-y-2">
                            <TouchableOpacity
                                className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl items-center justify-center shadow-lg"
                                onPress={centerMap}
                            >
                                <Navigation size={20} color="#2463eb" />
                            </TouchableOpacity>
                        </View>
                        <View className="absolute bottom-4 left-4">
                            <View className="bg-white/95 dark:bg-slate-900/95 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 flex-row items-center space-x-2">
                                <MapPin size={16} color="#2463eb" /><Text className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-tighter">Posição em tempo real</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View className="px-6 space-y-4">
                    <TouchableOpacity className="w-full h-16 bg-emerald-500 rounded-2xl flex-row items-center justify-center space-x-3 shadow-lg shadow-emerald-500/20" onPress={() => { setFuelData({ ...fuelData, km: vehicle.currentKm.toString() }); setShowFuelModal(true); }}>
                        <Fuel size={24} color="white" /><Text className="text-white font-black text-base uppercase tracking-widest ml-3">Registrar Abastecimento</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="w-full h-16 bg-amber-500 rounded-2xl flex-row items-center justify-center space-x-3 shadow-lg shadow-amber-500/20" onPress={() => setShowIncidentModal(true)}>
                        <AlertTriangle size={24} color="white" /><Text className="text-white font-black text-base uppercase tracking-widest ml-3">Relatar Incidente</Text>
                    </TouchableOpacity>
                    <View className="pt-10">
                        <TouchableOpacity className="w-full h-16 bg-red-500 rounded-2xl flex-row items-center justify-center space-x-3 shadow-lg shadow-red-500/20" onPress={() => { setEndKm(vehicle.currentKm.toString()); setShowEndModal(true); }}>
                            <Hand size={24} color="white" /><Text className="text-white font-black text-base uppercase tracking-widest ml-3">Encerrar Jornada</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* FUEL MODAL */}
            <Modal visible={showFuelModal} transparent animationType="fade">
                <View className="flex-1 bg-black/60 justify-end">
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                        <View className="bg-white dark:bg-slate-900 rounded-t-[32px] p-8 pt-6 max-h-[90%]">
                            <View className="w-12 h-1 bg-slate-200 dark:bg-slate-800 self-center rounded-full mb-8" />
                            <View className="flex-row justify-between items-center mb-6">
                                <Text className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Abastecimento</Text>
                                <TouchableOpacity onPress={() => setShowFuelModal(false)} className="p-2"><X size={24} color="#94a3b8" /></TouchableOpacity>
                            </View>
                            <ScrollView showsVerticalScrollIndicator={false} className="mb-6">
                                <View className="space-y-4">
                                    <View>
                                        <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-2 tracking-widest">KM Atual</Text>
                                        <TextInput className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl px-4 text-slate-900 dark:text-white font-bold" keyboardType="numeric" value={fuelData.km} onChangeText={val => setFuelData({ ...fuelData, km: val })} />
                                    </View>
                                    <View className="flex-row space-x-4">
                                        <View className="flex-1">
                                            <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-2 tracking-widest">Litros</Text>
                                            <TextInput className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl px-4 text-slate-900 dark:text-white font-bold" keyboardType="numeric" placeholder="0.00" value={fuelData.liters} onChangeText={val => setFuelData({ ...fuelData, liters: val })} />
                                        </View>
                                        <View className="flex-row space-x-4">
                                            <View className="flex-1">
                                                <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-2 tracking-widest">Valor Total (R$)</Text>
                                                <TextInput className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl px-4 text-slate-900 dark:text-white font-bold" keyboardType="numeric" placeholder="0.00" value={fuelData.totalValue} onChangeText={val => setFuelData({ ...fuelData, totalValue: val })} />
                                            </View>
                                        </View>
                                    </View>
                                    <View>
                                        <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-3 tracking-widest">Pagamento</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="space-x-2">
                                            {PAYMENT_METHODS.map(m => (
                                                <TouchableOpacity key={m.id} onPress={() => setFuelData({ ...fuelData, paymentMethod: m.id })} className={`px-4 h-12 rounded-xl flex-row items-center border ${fuelData.paymentMethod === m.id ? 'bg-primary/10 border-primary' : 'bg-slate-100 dark:bg-slate-800 border-transparent'}`}>
                                                    <Text className="mr-2">{m.icon}</Text><Text className={`font-bold ${fuelData.paymentMethod === m.id ? 'text-primary' : 'text-slate-600 dark:text-slate-400'}`}>{m.label}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                </View>
                            </ScrollView>
                            <TouchableOpacity className={`h-16 bg-primary rounded-2xl items-center justify-center shadow-lg ${isSavingFuel ? 'opacity-70' : ''}`} onPress={handleConfirmFuel} disabled={isSavingFuel}>
                                {isSavingFuel ? <ActivityIndicator color="white" /> : <Text className="text-white font-black text-lg uppercase">Salvar Registro</Text>}
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>

            {/* INCIDENT MODAL */}
            <Modal visible={showIncidentModal} transparent animationType="fade">
                <View className="flex-1 bg-black/60 justify-end">
                    <View className="bg-white dark:bg-slate-900 rounded-t-[32px] p-8 pt-6">
                        <View className="w-12 h-1 bg-slate-200 dark:bg-slate-800 self-center rounded-full mb-8" />
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Relatar Incidente</Text>
                            <TouchableOpacity onPress={() => setShowIncidentModal(false)} className="p-2"><X size={24} color="#94a3b8" /></TouchableOpacity>
                        </View>
                        <View className="mb-6">
                            <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-3 tracking-widest">Descrição</Text>
                            <TextInput className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-4 text-slate-900 dark:text-white h-32" multiline textAlignVertical="top" placeholder="Descreva o que aconteceu..." value={incidentDescription} onChangeText={setIncidentDescription} />
                        </View>
                        <View className="mb-8 flex-row items-center justify-between">
                            <TouchableOpacity className="flex-row items-center bg-slate-100 dark:bg-slate-800 px-4 h-14 rounded-xl space-x-2" onPress={() => setShowCamera(true)}>
                                <CameraIcon size={20} color="#2463eb" />
                                <Text className="text-primary font-bold ml-2">{capturedPhoto ? 'Foto Capturada' : 'Tirar Foto'}</Text>
                                {capturedPhoto && <Check size={16} color="#10b981" className="ml-2" />}
                            </TouchableOpacity>
                            <View className="flex-row space-x-2">
                                {['LOW', 'MEDIUM', 'HIGH'].map(s => (
                                    <TouchableOpacity key={s} onPress={() => setIncidentSeverity(s)} className={`w-10 h-10 rounded-full border-4 ${incidentSeverity === s ? 'border-primary' : 'border-transparent'} ${s === 'HIGH' ? 'bg-red-500' : s === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                ))}
                            </View>
                        </View>
                        <TouchableOpacity className={`h-16 bg-amber-500 rounded-2xl items-center justify-center shadow-lg ${isReportingIncident ? 'opacity-70' : ''}`} onPress={handleReportIncident} disabled={isReportingIncident}>
                            {isReportingIncident ? <ActivityIndicator color="white" /> : <Text className="text-white font-black text-lg uppercase">Enviar Relato</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* END JOURNEY MODAL */}
            <Modal visible={showEndModal} transparent animationType="fade">
                <View className="flex-1 bg-black/60 justify-center p-6">
                    <View className="bg-white dark:bg-slate-900 rounded-[32px] p-8">
                        <Text className="text-2xl font-black text-slate-900 dark:text-white uppercase text-center mb-4">Encerrar Jornada</Text>
                        <Text className="text-slate-500 text-center mb-8">Informe a quilometragem final para prosseguir com o checklist de entrada.</Text>
                        <View className="mb-8">
                            <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-2 tracking-widest">KM Final</Text>
                            <TextInput className="h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl px-6 text-2xl font-black text-primary text-center" keyboardType="numeric" value={endKm} onChangeText={setEndKm} autoFocus />
                        </View>
                        <View className="flex-row space-x-4">
                            <TouchableOpacity className="flex-1 h-14 bg-slate-100 rounded-2xl items-center justify-center" onPress={() => setShowEndModal(false)}>
                                <Text className="text-slate-500 font-bold">Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity className="flex-2 h-14 bg-red-500 rounded-2xl items-center justify-center shadow-lg shadow-red-500/20" onPress={handleConfirmEnd}>
                                <Text className="text-white font-black text-lg px-8">Confirmar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
