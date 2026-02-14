import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { useEffect, useState } from 'react';
import { locationService } from '../../src/services/location';
import { api } from '../../src/services/api';
import { useRouter } from 'expo-router';

export default function JourneyScreen() {
    const [activeJourney, setActiveJourney] = useState<any>(null);
    const [vehicle, setVehicle] = useState<any>(null);
    const [showEndModal, setShowEndModal] = useState(false);
    const [endKm, setEndKm] = useState('');
    const router = useRouter();

    const fetchActive = async () => {
        try {
            const journey = await api.getActiveJourney();

            if (journey) {
                setActiveJourney(journey);
                setVehicle(journey.vehicle);

                // START TRACKING
                locationService.startEmitting(journey.vehicleId, journey.id);
            } else {
                setActiveJourney(null);
                setVehicle(null);
                locationService.stopEmitting();
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Poll for updates
    useEffect(() => {
        fetchActive();
        const interval = setInterval(fetchActive, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    const handleEndJourneyPress = () => {
        if (!activeJourney || !vehicle) return;
        setEndKm(activeJourney.startKm.toString()); // Default to start km
        setShowEndModal(true);
    };

    const handleConfirmEnd = async () => {
        if (!activeJourney || !vehicle) return;

        const endKmNum = parseInt(endKm);

        // Validation
        if (isNaN(endKmNum) || endKmNum < 0) {
            Alert.alert('Erro', 'Por favor, insira um km válido');
            return;
        }

        if (endKmNum < activeJourney.startKm) {
            Alert.alert(
                'Km Inválido',
                `Km final (${endKmNum}) não pode ser menor que km inicial (${activeJourney.startKm})`
            );
            return;
        }

        // Close modal and navigate to checklist
        setShowEndModal(false);

        // In a real app, we'd pass the journey context and km to checklist
        // For now, navigate to checklist for check-in
        router.push({
            pathname: '/checklist',
            params: {
                type: 'checkin',
                journeyId: activeJourney.id,
                endKm: endKmNum,
            },
        });
    };

    if (!activeJourney) {
        return (
            <View style={styles.container}>
                <Text style={styles.text}>Nenhuma jornada ativa</Text>
                <Text style={styles.subtext}>Selecione um veículo na aba Veículos para iniciar.</Text>
            </View>
        );
    }

    const duration = Math.floor((Date.now() - new Date(activeJourney.startTime).getTime()) / 1000 / 60);

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.label}>JORNADA ATIVA</Text>
                <Text style={styles.time}>
                    Iniciada às {new Date(activeJourney.startTime).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                </Text>
                <Text style={styles.duration}>{duration} minutos</Text>

                <View style={styles.vehicleInfo}>
                    <Text style={styles.plate}>{vehicle?.plate}</Text>
                    <Text style={styles.model}>{vehicle?.brand} {vehicle?.model}</Text>
                </View>

                <View style={styles.kmInfo}>
                    <Text style={styles.kmLabel}>KM Inicial:</Text>
                    <Text style={styles.kmValue}>{activeJourney.startKm} km</Text>
                </View>

                <TouchableOpacity style={styles.stopButton} onPress={handleEndJourneyPress}>
                    <Text style={styles.buttonText}>Encerrar Jornada</Text>
                </TouchableOpacity>
            </View>

            {/* End Journey Modal */}
            <Modal
                visible={showEndModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowEndModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Encerrar Jornada</Text>

                        <Text style={styles.modalLabel}>Veículo: {vehicle?.plate}</Text>
                        <Text style={styles.modalInfo}>KM Inicial: {activeJourney.startKm} km</Text>

                        <Text style={styles.inputLabel}>KM Final:</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Digite o km final"
                            keyboardType="numeric"
                            value={endKm}
                            onChangeText={setEndKm}
                            autoFocus
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setShowEndModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={handleConfirmEnd}
                            >
                                <Text style={styles.confirmButtonText}>Continuar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5', padding: 20 },
    text: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
    subtext: { color: '#666', textAlign: 'center' },
    card: { backgroundColor: '#fff', padding: 24, borderRadius: 16, width: '100%', alignItems: 'center', elevation: 4 },
    label: { color: '#2563EB', fontWeight: 'bold', marginBottom: 8, letterSpacing: 1 },
    time: { fontSize: 14, color: '#666', marginBottom: 4 },
    duration: { fontSize: 12, color: '#888', marginBottom: 24 },
    vehicleInfo: { alignItems: 'center', marginBottom: 24 },
    plate: { fontSize: 32, fontWeight: 'bold' },
    model: { fontSize: 18, color: '#444' },
    kmInfo: { alignItems: 'center', marginBottom: 32 },
    kmLabel: { fontSize: 14, color: '#666', marginBottom: 4 },
    kmValue: { fontSize: 24, fontWeight: 'bold', color: '#2563EB' },
    stopButton: { backgroundColor: '#DC2626', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 8, width: '100%', alignItems: 'center' },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400 },
    modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#333' },
    modalLabel: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8 },
    modalInfo: { fontSize: 14, color: '#666', marginBottom: 20 },
    inputLabel: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8 },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 16,
        fontSize: 18,
        marginBottom: 24,
    },
    modalButtons: { flexDirection: 'row', gap: 12 },
    modalButton: { flex: 1, padding: 16, borderRadius: 8, alignItems: 'center' },
    cancelButton: { backgroundColor: '#f5f5f5' },
    cancelButtonText: { color: '#666', fontWeight: 'bold', fontSize: 16 },
    confirmButton: { backgroundColor: '#2563EB' },
    confirmButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

