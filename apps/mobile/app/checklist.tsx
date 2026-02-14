import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { photoService, getCaptureLocation } from '../src/services/photoService';
import { api } from '../src/services/api';
import { useAuth } from './_layout';

// Checklist items configuration
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
    const camera = useRef<Camera>(null);

    const [items, setItems] = useState<ChecklistItemStatus[]>(
        CHECKLIST_ITEMS.map(item => ({ id: item.id, status: 'pending' as const }))
    );
    const [currentItemIndex, setCurrentItemIndex] = useState(0);
    const [showCamera, setShowCamera] = useState(false);
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (!hasPermission) {
            requestPermission();
        }
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

        // Reset for next item
        setCapturedPhoto(null);
        setNotes('');

        // Move to next item or finish
        if (currentItemIndex < CHECKLIST_ITEMS.length - 1) {
            setCurrentItemIndex(currentItemIndex + 1);
        } else {
            handleFinish();
        }
    };

    const [isSubmitting, setIsSubmitting] = useState(false);
    const { token } = useAuth(); // Assuming useAuth is available or we export it

    const handleFinish = async () => {
        // Validate all items are filled
        const incomplete = items.filter(item => item.status === 'pending');
        if (incomplete.length > 0) {
            Alert.alert('Checklist Incompleto', 'Por favor, complete todos os itens antes de finalizar.');
            return;
        }

        // Validate problem items have notes
        const problemsWithoutNotes = items.filter(
            item => item.status === 'problem' && !item.notes
        );
        if (problemsWithoutNotes.length > 0) {
            Alert.alert('Descrição Necessária', 'Itens com problema precisam de descrição.');
            return;
        }

        setIsSubmitting(true);

        try {
            // 1. Prepare items for upload
            const itemsWithPhotos = items
                .filter(item => item.photoUri && item.photoUri.startsWith('file://'))
                .map(item => ({
                    uri: item.photoUri!,
                    itemId: item.id,
                    itemName: CHECKLIST_ITEMS.find(i => i.id === item.id)?.name || item.id,
                    status: item.status === 'ok' ? 'OK' as const : 'PROBLEM' as const,
                    notes: item.notes
                }));

            // 2. Upload photos
            // We need a token here. If useAuth is not available directly, we might need to export it or pass it.
            // Let's assume we can get it from storage or context. 
            // For now, I'll add useAuth hook import at the top.

            // If offline, we should queue headers. For now, try upload.
            let uploadedUrls = new Map<string, string>();
            if (itemsWithPhotos.length > 0 && token) {
                uploadedUrls = await photoService.uploadPhotos(itemsWithPhotos, token);
            }

            // 3. Construct final checklist data
            const checklistItems = items.map(item => ({
                itemId: item.id,
                status: item.status === 'ok' ? 'OK' as const : 'PROBLEM' as const,
                photoUrl: uploadedUrls.get(item.id) || item.photoUri, // Use uploaded URL or local if failed/no photo
                notes: item.notes,
            }));

            // 4. Call API based on type
            const location = await getCaptureLocation();

            if (params.type === 'checkout') {
                // START JOURNEY
                if (!params.vehicleId || !params.currentKm) {
                    throw new Error('Missing vehicle data for checkout');
                }

                await api.startJourney(
                    params.vehicleId as string,
                    Number(params.currentKm),
                    checklistItems,
                    location || undefined
                );

                Alert.alert('Sucesso', 'Jornada iniciada com sucesso!', [
                    { text: 'OK', onPress: () => router.replace('/(tabs)/journey') }
                ]);

            } else if (params.type === 'checkin') {
                // END JOURNEY
                if (!params.journeyId || !params.endKm) {
                    throw new Error('Missing journey data for checkin');
                }

                await api.endJourney(
                    params.journeyId as string,
                    Number(params.endKm),
                    checklistItems,
                    location || undefined
                );

                Alert.alert('Sucesso', 'Jornada encerrada com sucesso!', [
                    { text: 'OK', onPress: () => router.replace('/(tabs)/') }
                ]);
            }

        } catch (error: any) {
            console.error('Checklist Finish Error:', error);
            Alert.alert('Erro', error.message || 'Falha ao processar checklist');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (showCamera) {
        if (!hasPermission) {
            return (
                <View style={styles.container}>
                    <Text>Permissão de câmera necessária</Text>
                </View>
            );
        }
        if (!device) {
            return (
                <View style={styles.container}>
                    <Text>Câmera não encontrada</Text>
                </View>
            );
        }

        return (
            <View style={styles.container}>
                <Camera
                    ref={camera}
                    style={StyleSheet.absoluteFill}
                    device={device}
                    isActive={true}
                    photo={true}
                />
                <View style={styles.cameraHeader}>
                    <Text style={styles.cameraTitle}>{currentItem.name}</Text>
                </View>
                <TouchableOpacity style={styles.captureBtn} onPress={takePhoto}>
                    <View style={styles.captureInner} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setShowCamera(false)}
                >
                    <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Checklist de {params.type === 'checkout' ? 'Saída' : 'Entrada'}</Text>
                <Text style={styles.progress}>
                    {currentItemIndex + 1} de {CHECKLIST_ITEMS.length}
                </Text>
            </View>

            <View style={styles.currentItem}>
                <Text style={styles.itemTitle}>{currentItem.name}</Text>

                {!capturedPhoto ? (
                    <TouchableOpacity
                        style={styles.photoButton}
                        onPress={() => setShowCamera(true)}
                    >
                        <Text style={styles.photoButtonText}>📸 Tirar Foto</Text>
                    </TouchableOpacity>
                ) : (
                    <View>
                        <Image source={{ uri: capturedPhoto }} style={styles.preview} />
                        <TouchableOpacity
                            style={styles.retakeButton}
                            onPress={() => setCapturedPhoto(null)}
                        >
                            <Text style={styles.retakeText}>🔄 Tirar Novamente</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {capturedPhoto && (
                    <View style={styles.statusContainer}>
                        <Text style={styles.statusLabel}>Status do item:</Text>
                        <View style={styles.statusButtons}>
                            <TouchableOpacity
                                style={[styles.statusBtn, styles.okBtn]}
                                onPress={() => handleStatusSelect('ok')}
                            >
                                <Text style={styles.statusBtnText}>✅ OK</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.statusBtn, styles.problemBtn]}
                                onPress={() => {
                                    if (!notes.trim()) {
                                        Alert.alert('Atenção', 'Por favor, descreva o problema antes de continuar.');
                                        return;
                                    }
                                    handleStatusSelect('problem');
                                }}
                            >
                                <Text style={styles.statusBtnText}>⚠️ PROBLEMA</Text>
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.notesInput}
                            placeholder="Descrição do problema (obrigatório se houver problema)"
                            multiline
                            numberOfLines={3}
                            value={notes}
                            onChangeText={setNotes}
                        />
                    </View>
                )}
            </View>

            {/* Summary of completed items */}
            <View style={styles.summary}>
                <Text style={styles.summaryTitle}>Itens Verificados:</Text>
                {items.map((item, index) => {
                    if (item.status === 'pending') return null;
                    return (
                        <View key={index} style={styles.summaryItem}>
                            <Text style={styles.summaryItemName}>
                                {CHECKLIST_ITEMS[index].name}
                            </Text>
                            <Text
                                style={[
                                    styles.summaryStatus,
                                    item.status === 'ok' ? styles.okStatus : styles.problemStatus,
                                ]}
                            >
                                {item.status === 'ok' ? '✅ OK' : '⚠️ Problema'}
                            </Text>
                        </View>
                    );
                })}
            </View>
            {isSubmitting && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#2563EB" />
                    <Text style={styles.loadingText}>Enviando fotos...</Text>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { padding: 20, backgroundColor: '#fff', marginBottom: 16 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 8 },
    progress: { fontSize: 16, color: '#666' },
    currentItem: { backgroundColor: '#fff', padding: 20, marginBottom: 16 },
    itemTitle: { fontSize: 20, fontWeight: '600', marginBottom: 16, color: '#2563EB' },
    photoButton: {
        backgroundColor: '#2563EB',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 16,
    },
    photoButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    preview: { width: '100%', height: 300, borderRadius: 12, marginBottom: 12 },
    retakeButton: { alignItems: 'center', padding: 12 },
    retakeText: { color: '#2563EB', fontSize: 16, fontWeight: '600' },
    statusContainer: { marginTop: 16 },
    statusLabel: { fontSize: 16, fontWeight: '600', marginBottom: 12, color: '#333' },
    statusButtons: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    statusBtn: { flex: 1, padding: 16, borderRadius: 8, alignItems: 'center' },
    okBtn: { backgroundColor: '#10B981' },
    problemBtn: { backgroundColor: '#EF4444' },
    statusBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    notesInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    summary: { backgroundColor: '#fff', padding: 20 },
    summaryTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#333' },
    summaryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    summaryItemName: { fontSize: 16, color: '#666' },
    summaryStatus: { fontSize: 14, fontWeight: '600' },
    okStatus: { color: '#10B981' },
    problemStatus: { color: '#EF4444' },
    cameraHeader: {
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    cameraTitle: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 12,
        borderRadius: 8,
    },
    captureBtn: {
        position: 'absolute',
        bottom: 100,
        alignSelf: 'center',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureInner: {
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 4,
        borderColor: '#2563EB',
    },
    cancelBtn: {
        position: 'absolute',
        bottom: 30,
        alignSelf: 'center',
        padding: 16,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 8,
    },
    cancelText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2563EB',
    },
});
