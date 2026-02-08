import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { locationService } from '../../src/services/location';
import { api } from '../../src/services/api';

export default function JourneyScreen() {
    const [activeJourney, setActiveJourney] = useState<any>(null);
    const [vehicle, setVehicle] = useState<any>(null);

    const fetchActive = async () => {
        try {
            const journey = await api.getActiveJourney();

            if (journey) {
                setActiveJourney(journey);
                setVehicle(journey.vehicle);

                // START TRACKING
                // We'd use the real vehicle ID here
                locationService.startEmitting(journey.vehicleId, '123');
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
        const interval = setInterval(fetchActive, 5000); // Poll slower for API
        return () => clearInterval(interval);
    }, []);

    const handleEndJourney = async () => {
        if (!activeJourney || !vehicle) return;

        Alert.alert(
            'Finalizar Viagem',
            'Deseja realmente finalizar esta viagem?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Finalizar', onPress: async () => {
                        try {
                            // For simplicity, add random KM if not provided by user input
                            // In real app we'd ask user for odometer reading
                            const endKm = activeJourney.startKm + 10;

                            await api.endJourney(activeJourney.id, endKm);

                            // Refresh immediately
                            fetchActive();
                            Alert.alert('Sucesso', 'Viagem finalizada com sucesso');
                        } catch (e: any) {
                            Alert.alert('Erro', e.message || 'Falha ao finalizar viagem');
                        }
                    }
                }
            ]
        );
    };

    if (!activeJourney) {
        return (
            <View style={styles.container}>
                <Text style={styles.text}>No active journey</Text>
                <Text style={styles.subtext}>Select a vehicle in the Vehicles tab to start.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.label}>ACTIVE JOURNEY</Text>
                <Text style={styles.time}>Started at: {new Date(activeJourney.startTime).toLocaleTimeString()}</Text>

                <View style={styles.vehicleInfo}>
                    <Text style={styles.plate}>{vehicle?.plate}</Text>
                    <Text style={styles.model}>{vehicle?.brand} {vehicle?.model}</Text>
                </View>

                <View style={styles.kmInfo}>
                    <Text>Start KM: {activeJourney.startKm}</Text>
                </View>

                <TouchableOpacity style={styles.stopButton} onPress={handleEndJourney}>
                    <Text style={styles.buttonText}>End Journey</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5', padding: 20 },
    text: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
    subtext: { color: '#666', textAlign: 'center' },
    card: { backgroundColor: '#fff', padding: 24, borderRadius: 16, width: '100%', alignItems: 'center', elevation: 4 },
    label: { color: '#2563EB', fontWeight: 'bold', marginBottom: 8, letterSpacing: 1 },
    time: { fontSize: 14, color: '#666', marginBottom: 24 },
    vehicleInfo: { alignItems: 'center', marginBottom: 24 },
    plate: { fontSize: 32, fontWeight: 'bold' },
    model: { fontSize: 18, color: '#444' },
    kmInfo: { marginBottom: 32 },
    stopButton: { backgroundColor: '#DC2626', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 8, width: '100%', alignItems: 'center' },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 }
});
