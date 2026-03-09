import { View, Text, TouchableOpacity, TextInput, ScrollView, Image, Alert, ActivityIndicator, SafeAreaView } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Camera as VisionCamera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { photoService, getCaptureLocation } from '../src/services/photoService';
import { api } from '../src/services/api';
import { useAuth } from './_layout';
import { Camera, Check, AlertCircle, ChevronRight, ChevronLeft, Info, X } from 'lucide-react-native';
import { database } from '../src/model/database';
import { syncService } from '../src/services/SyncService';
import Journey from '../src/model/Journey';
import Checklist from '../src/model/Checklist';

const CHECKLIST_ITEMS = [
    { id: 'front', name: 'Frente do Veículo', required: true },
    { id: 'back', name: 'Traseira do Veículo', required: true },
    { id: 'left', name: 'Lateral Esquerda', required: true },
    { id: 'right', name: 'Lateral Direita', required: true },
    { id: 'interior', name: 'Interior', required: true },
    { id: 'dashboard', name: 'Painel/Km', required: true },
];

type ChecklistItemStatus = {
    id: string;
    status: 'pending' | 'ok' | 'problem';
    photoUri?: string;
    notes?: string;
};

export default function ChecklistScreen() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const { hasPermission, requestPermission } = useCameraPermission();
    const device = useCameraDevice('back');
    const camera = useRef<VisionCamera>(null);

    const [items, setItems] = useState<ChecklistItemStatus[]>(
        CHECKLIST_ITEMS.map(item => ({ id: item.id, status: 'pending' as const }))
    );
    const [currentItemIndex, setCurrentItemIndex] = useState(0);
    const [showCamera, setShowCamera] = useState(false);
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { token, user } = useAuth();

    useEffect(() => {
        if (!hasPermission) { requestPermission(); }
    }, [hasPermission]);

    const currentItem = CHECKLIST_ITEMS[currentItemIndex];
    const currentItemStatus = items[currentItemIndex];

    const takePhoto = async () => {
        if (camera.current) {
            const file = await camera.current.takePhoto();
            setCapturedPhoto(`file://${file.path}`);
            setShowCamera(false);
        }
    };

    const handleStatusSelect = (status: 'ok' | 'problem') => {
        const newItems = [...items];
        newItems[currentItemIndex] = {
            ...newItems[currentItemIndex],
            status,
            photoUri: capturedPhoto || undefined,
            notes: status === 'problem' ? notes : undefined,
        };
        setItems(newItems);
        setCapturedPhoto(null);
        setNotes('');

        if (currentItemIndex < CHECKLIST_ITEMS.length - 1) {
            setCurrentItemIndex(currentItemIndex + 1);
        } else {
            handleFinish(newItems);
        }
    };

    const handleFinish = async (finalItems: ChecklistItemStatus[]) => {
        const incomplete = finalItems.filter(item => item.status === 'pending');
        if (incomplete.length > 0) {
            Alert.alert('Atenção', 'Complete todos os itens.');
            return;
        }

        setIsSubmitting(true);
        try {
            const itemsWithPhotos = finalItems
                .filter(item => item.photoUri && item.photoUri.startsWith('file://'))
                .map(item => ({
                    uri: item.photoUri!,
                    itemId: item.id,
                    itemName: CHECKLIST_ITEMS.find(i => i.id === item.id)?.name || item.id,
                    status: item.status === 'ok' ? 'OK' as const : 'PROBLEM' as const,
                    notes: item.notes
                }));

            let uploadedUrls = new Map<string, string>();
            if (itemsWithPhotos.length > 0 && token) {
                uploadedUrls = await photoService.uploadPhotos(itemsWithPhotos, token);
            }

            const checklistItems = finalItems.map(item => ({
                itemId: item.id,
                status: item.status === 'ok' ? 'OK' as const : 'PROBLEM' as const,
                photoUrl: uploadedUrls.get(item.id) || item.photoUri,
                notes: item.notes,
            }));

            const location = await getCaptureLocation();

            await database.write(async () => {
                let journeyRecord: any;

                if (params.type === 'checkout') {
                    // Create new local Journey
                    journeyRecord = await database.get<Journey>('journeys').create(j => {
                        j.vehicleId = params.vehicleId as string;
                        j.driverId = user?.id || '';
                        j.status = 'IN_PROGRESS';
                        j.startKm = Number(params.currentKm);
                        j.startTime = Date.now();
                        j.startLat = location?.lat;
                        j.startLng = location?.lng;
                        j.startPhotoUrl = checklistItems[0]?.photoUrl; // Simplified
                    });

                    // Create Checklist
                    await database.get<Checklist>('checklists').create(c => {
                        c.journeyId = journeyRecord.id;
                        c.type = 'CHECKOUT';
                        c.items = JSON.stringify(checklistItems);
                    });

                    Alert.alert('Sucesso', 'Jornada iniciada localmente! Sincronizando...', [{ text: 'OK', onPress: () => router.replace('/(tabs)/journey') }]);
                } else {
                    // Update existing Journey (if we can find it local, or we just create a "finish" update if mobile handles it)
                    // Usually we search for active journey
                    const activeJourneys = await database.get<Journey>('journeys').query().fetch();
                    const filtered = activeJourneys.filter(j => j.status === 'IN_PROGRESS' && j.vehicleId === params.vehicleId);

                    if (filtered.length > 0) {
                        journeyRecord = filtered[0];
                        await journeyRecord.update(() => {
                            journeyRecord.status = 'COMPLETED';
                            journeyRecord.endKm = Number(params.endKm);
                            journeyRecord.endTime = Date.now();
                            journeyRecord.endLat = location?.lat;
                            journeyRecord.endLng = location?.lng;
                        });
                    }

                    // Create Checklist
                    await database.get<Checklist>('checklists').create(c => {
                        c.journeyId = journeyRecord?.id || (params.journeyId as string);
                        c.type = 'CHECKIN';
                        c.items = JSON.stringify(checklistItems);
                    });

                    Alert.alert('Sucesso', 'Jornada encerrada localmente! Sincronizando...', [{ text: 'OK', onPress: () => router.replace('/(tabs)/') }]);
                }
            });

            // Trigger sync in background
            syncService.sync().catch(console.error);
        } catch (error: any) {
            console.error('Checklist Save Error:', error);
            Alert.alert('Erro', error.message || 'Falha ao processar');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (showCamera) {
        return (
            <View className="flex-1 bg-black">
                <VisionCamera ref={camera} style={{ flex: 1 }} device={device!} isActive={true} photo={true} />
                <View className="absolute top-12 left-0 right-0 items-center">
                    <View className="bg-black/50 px-6 py-3 rounded-full border border-white/20">
                        <Text className="text-white font-black uppercase text-xs tracking-widest">{currentItem.name}</Text>
                    </View>
                </View>
                <TouchableOpacity className="absolute bottom-12 self-center w-20 h-20 rounded-full bg-white items-center justify-center shadow-2xl shadow-white/50" onPress={takePhoto}>
                    <View className="w-16 h-16 rounded-full border-4 border-primary" />
                </TouchableOpacity>
                <TouchableOpacity className="absolute bottom-12 left-8 p-4 bg-black/60 rounded-2xl flex-row items-center border border-white/10" onPress={() => setShowCamera(false)}>
                    <X size={20} color="white" /><Text className="text-white font-bold ml-2">Sair</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
            <View className="px-6 py-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex-row items-center justify-between">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2"><ChevronLeft size={28} color="#475569" /></TouchableOpacity>
                <Text className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Inspeção</Text>
                <View className="w-10" />
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                <View className="p-4">
                    {/* Progress Card */}
                    <View className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 mb-6">
                        <View className="flex-row justify-between items-end mb-4">
                            <Text className="text-primary text-2xl font-black uppercase tracking-tighter">{currentItem.name}</Text>
                            <Text className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest">Etapa {currentItemIndex + 1} de {CHECKLIST_ITEMS.length}</Text>
                        </View>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                            <View
                                className="bg-primary h-full rounded-full"
                                style={{ width: `${((currentItemIndex + 1) / CHECKLIST_ITEMS.length) * 100}%` }}
                            />
                        </div>
                    </View>

                    {!capturedPhoto ? (
                        <TouchableOpacity
                            className="w-full aspect-square bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 items-center justify-center p-8 shadow-inner relative overflow-hidden"
                            onPress={() => setShowCamera(true)}
                        >
                            <View className="items-center z-10">
                                <View className="w-20 h-20 bg-primary/10 rounded-full items-center justify-center mb-6">
                                    <Camera size={40} color="#2463eb" />
                                </View>
                                <Text className="text-xl font-black text-slate-900 dark:text-white text-center uppercase tracking-tight">Capturar Foto</Text>
                                <Text className="text-slate-400 text-center mt-3 font-medium px-4">Enquadre o item certificando-se de que a imagem esteja nítida.</Text>
                            </View>

                            {/* Corner Guides */}
                            <View className="absolute top-6 left-6 w-10 h-10 border-t-4 border-l-4 border-primary/30 rounded-tl-xl" />
                            <View className="absolute top-6 right-6 w-10 h-10 border-t-4 border-r-4 border-primary/30 rounded-tr-xl" />
                            <View className="absolute bottom-6 left-6 w-10 h-10 border-b-4 border-l-4 border-primary/30 rounded-bl-xl" />
                            <View className="absolute bottom-6 right-6 w-10 h-10 border-b-4 border-r-4 border-primary/30 rounded-br-xl" />
                        </TouchableOpacity>
                    ) : (
                        <View className="space-y-6">
                            <View className="w-full aspect-square rounded-3xl overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl">
                                <Image source={{ uri: capturedPhoto }} className="w-full h-full" />
                                <TouchableOpacity className="absolute bottom-4 right-4 bg-black/60 px-4 py-2 rounded-xl flex-row items-center" onPress={() => setCapturedPhoto(null)}>
                                    <X size={16} color="white" /><Text className="text-white font-bold ml-2">Refazer</Text>
                                </TouchableOpacity>
                            </View>

                            <View className="mt-8 space-y-6">
                                <View className="flex-row space-x-4">
                                    <TouchableOpacity
                                        className="flex-1 bg-emerald-500 rounded-2xl items-center justify-center py-6 shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                                        onPress={() => handleStatusSelect('ok')}
                                    >
                                        <View className="flex-row items-center space-x-2 mb-1">
                                            <Check size={24} color="white" />
                                            <Text className="text-white font-black text-xl ml-1">OK</Text>
                                        </View>
                                        <Text className="text-white/80 text-[10px] font-bold uppercase tracking-widest">Tudo em ordem</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        className="flex-1 bg-red-500 rounded-2xl items-center justify-center py-6 shadow-lg shadow-red-500/20 active:scale-[0.98]"
                                        onPress={() => { if (!notes.trim()) { Alert.alert('Atenção', 'Descreva o problema primeiro.'); return; } handleStatusSelect('problem'); }}
                                    >
                                        <View className="flex-row items-center space-x-2 mb-1">
                                            <AlertCircle size={24} color="white" />
                                            <Text className="text-white font-black text-xl ml-1">PROBLEMA</Text>
                                        </View>
                                        <Text className="text-white/80 text-[10px] font-bold uppercase tracking-widest">Relatar avaria</Text>
                                    </TouchableOpacity>
                                </View>

                                <View>
                                    <Text className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-3 px-2">Observações / Avarias</Text>
                                    <TextInput
                                        className="w-full bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white min-h-[120px] shadow-sm"
                                        multiline
                                        textAlignVertical="top"
                                        placeholder="Se houver problemas, descreva aqui..."
                                        value={notes}
                                        onChangeText={setNotes}
                                    />
                                </View>
                            </View>
                        </View>
                    )}
                </View>

                {/* Progress Summary */}
                <View className="px-6 mt-10">
                    <Text className="text-slate-400 font-bold uppercase text-[10px] tracking-[2px] mb-4">Progresso da Inspeção</Text>
                    <View className="flex-row space-x-2">
                        {CHECKLIST_ITEMS.map((item, idx) => (
                            <View key={item.id} className={`h-1.5 flex-1 rounded-full ${idx === currentItemIndex ? 'bg-primary' : items[idx].status !== 'pending' ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-800'}`} />
                        ))}
                    </View>
                </View>
            </ScrollView>

            {isSubmitting && (
                <View className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 items-center justify-center z-50">
                    <ActivityIndicator size="large" color="#2463eb" />
                    <Text className="mt-4 text-primary font-black text-lg uppercase tracking-widest">Processando...</Text>
                </View>
            )}
        </SafeAreaView>
    );
}
