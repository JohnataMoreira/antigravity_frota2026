import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, Modal, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { locationService } from '../../src/services/location';
import { api } from '../../src/services/api';
import { fuelService } from '../../src/services/fuelService';
import { useRouter } from 'expo-router';

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
    const router = useRouter();

    const fetchActive = async () => {
        try {
            const journey = await api.getActiveJourney();

            if (journey) {
                setActiveJourney(journey);
                setVehicle(journey.vehicle);
                await locationService.startTracking(journey.vehicleId, journey.id);
            } else {
                setActiveJourney(null);
                setVehicle(null);
                locationService.stopTracking();
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchActive();
        const interval = setInterval(fetchActive, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleFuelPress = () => {
        if (!activeJourney || !vehicle) return;
        setFuelData({
            ...fuelData,
            km: vehicle.currentKm.toString(),
        });
        setShowFuelModal(true);
    };

    const handleConfirmFuel = async () => {
        // ... (keep existing logic)
    };

    const handleReportIncident = async () => {
        if (!incidentDescription.trim()) {
            Alert.alert('Erro', 'Por favor, descreva o incidente.');
            return;
        }

        setIsReportingIncident(true);
        try {
            await api.reportIncident({
                vehicleId: vehicle.id,
                journeyId: activeJourney.id,
                description: incidentDescription,
                severity: incidentSeverity,
            });
            Alert.alert('Sucesso', 'Incidente relatado com sucesso. O administrador foi notificado.');
            setIncidentDescription('');
            setShowIncidentModal(false);
            fetchActive();
        } catch (e: any) {
            Alert.alert('Erro', e.message || 'Erro ao relatar incidente');
        } finally {
            setIsReportingIncident(false);
        }
    };

    const handleEndJourneyPress = () => {
        if (!activeJourney || !vehicle) return;
        setEndKm(activeJourney.startKm.toString());
        setShowEndModal(true);
    };

    const handleConfirmEnd = async () => {
        if (!activeJourney || !vehicle) return;
        const endKmNum = parseInt(endKm);
        if (isNaN(endKmNum) || endKmNum < 0) {
            Alert.alert('Erro', 'Por favor, insira um km válido');
            return;
        }
        if (endKmNum < activeJourney.startKm) {
            Alert.alert('Km Inválido', `Km final (${endKmNum}) não pode ser menor que km inicial (${activeJourney.startKm})`);
            return;
        }
        setShowEndModal(false);
        router.push({
            pathname: '/checklist',
            params: { type: 'checkin', journeyId: activeJourney.id, endKm: endKmNum },
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
                <Text style={styles.time}>Iniciada às {new Date(activeJourney.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text>
                <Text style={styles.duration}>{duration} minutos</Text>
                <View style={styles.vehicleInfo}>
                    <Text style={styles.plate}>{vehicle?.plate}</Text>
                    <Text style={styles.model}>{vehicle?.brand} {vehicle?.model}</Text>
                </View>
                <View style={styles.kmInfo}>
                    <Text style={styles.kmLabel}>KM Atual:</Text>
                    <Text style={styles.kmValue}>{vehicle?.currentKm} km</Text>
                </View>
                <TouchableOpacity style={styles.fuelButton} onPress={handleFuelPress}>
                    <Text style={styles.fuelButtonText}>Registrar Abastecimento</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.incidentButton} onPress={() => setShowIncidentModal(true)}>
                    <Text style={styles.fuelButtonText}>Relatar Incidente</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.stopButton} onPress={handleEndJourneyPress}>
                    <Text style={styles.buttonText}>Encerrar Jornada</Text>
                </TouchableOpacity>
            </View>

            <Modal visible={showFuelModal} transparent animationType="slide" onRequestClose={() => setShowFuelModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.modalTitle}>Novo Abastecimento</Text>

                            <Text style={styles.inputLabel}>KM no ato:</Text>
                            <TextInput style={styles.input} keyboardType="numeric" value={fuelData.km} onChangeText={(val) => setFuelData({ ...fuelData, km: val })} />

                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>Litros:</Text>
                                    <TextInput style={styles.input} keyboardType="numeric" placeholder="0.00" value={fuelData.liters} onChangeText={(val) => setFuelData({ ...fuelData, liters: val })} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>Valor Total (R$):</Text>
                                    <TextInput style={styles.input} keyboardType="numeric" placeholder="0.00" value={fuelData.totalValue} onChangeText={(val) => setFuelData({ ...fuelData, totalValue: val })} />
                                </View>
                            </View>

                            <Text style={styles.inputLabel}>Tipo de Combustível:</Text>
                            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                                {[
                                    { id: 'GASOLINE', label: 'Gasolina' },
                                    { id: 'ETHANOL', label: 'Etanol' },
                                    { id: 'DIESEL', label: 'Diesel' },
                                    { id: 'GNV', label: 'GNV' },
                                    { id: 'OTHER', label: 'Outro' }
                                ].map((type) => (
                                    <TouchableOpacity
                                        key={type.id}
                                        style={[styles.chip, fuelData.fuelType === type.id && styles.activeChip]}
                                        onPress={() => setFuelData({ ...fuelData, fuelType: type.id })}
                                    >
                                        <Text style={[styles.chipText, fuelData.fuelType === type.id && styles.activeChipText]}>{type.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.inputLabel}>Forma de Pagamento:</Text>
                            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                                {PAYMENT_METHODS.map((method) => (
                                    <TouchableOpacity key={method.id} style={[styles.paymentChip, fuelData.paymentMethod === method.id && styles.activePaymentChip]} onPress={() => setFuelData({ ...fuelData, paymentMethod: method.id })}>
                                        <Text style={styles.paymentIcon}>{method.icon}</Text>
                                        <Text style={[styles.paymentChipText, fuelData.paymentMethod === method.id && styles.activeChipText]}>{method.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {(fuelData.paymentMethod === 'FUEL_CARD' || fuelData.paymentMethod === 'INVOICED') && (
                                <View style={styles.corporateFields}>
                                    <Text style={styles.inputLabel}>Operadora (Ex: Ticket Log, GoodCard):</Text>
                                    <TextInput style={styles.input} value={fuelData.paymentProvider} onChangeText={(val) => setFuelData({ ...fuelData, paymentProvider: val })} placeholder="Nome da empresa/cartão" />
                                    <Text style={styles.inputLabel}>Referência (Número Cartão/Fatura):</Text>
                                    <TextInput style={styles.input} value={fuelData.paymentReference} onChangeText={(val) => setFuelData({ ...fuelData, paymentReference: val })} placeholder="Opcional" />
                                </View>
                            )}

                            <View style={styles.modalButtons}>
                                <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setShowFuelModal(false)} disabled={isSavingFuel}>
                                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={handleConfirmFuel} disabled={isSavingFuel}>
                                    <Text style={styles.confirmButtonText}>{isSavingFuel ? 'Salvando...' : 'Salvar'}</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <Modal visible={showEndModal} transparent animationType="slide" onRequestClose={() => setShowEndModal(false)}>
                {/* ... existing end modal content */}
            </Modal>

            <Modal visible={showIncidentModal} transparent animationType="slide" onRequestClose={() => setShowIncidentModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Relatar Incidente</Text>
                        <Text style={styles.modalInfo}>Descreva o problema ou ocorrência com o veículo {vehicle?.plate}.</Text>

                        <Text style={styles.inputLabel}>Grau de Severidade:</Text>
                        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                            {[
                                { id: 'LOW', label: 'Baixa', color: '#10B981' },
                                { id: 'MEDIUM', label: 'Média', color: '#F59E0B' },
                                { id: 'HIGH', label: 'Alta', color: '#EF4444' }
                            ].map((s) => (
                                <TouchableOpacity
                                    key={s.id}
                                    style={[styles.chip, incidentSeverity === s.id && { backgroundColor: s.color, borderColor: s.color }]}
                                    onPress={() => setIncidentSeverity(s.id)}
                                >
                                    <Text style={[styles.chipText, incidentSeverity === s.id && styles.activeChipText]}>{s.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.inputLabel}>Descrição do Incidente:</Text>
                        <TextInput
                            style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                            placeholder="Ex: Pneu furado, barulho no motor, batida leve..."
                            multiline
                            numberOfLines={4}
                            value={incidentDescription}
                            onChangeText={setIncidentDescription}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setShowIncidentModal(false)} disabled={isReportingIncident}>
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#F59E0B' }]} onPress={handleReportIncident} disabled={isReportingIncident}>
                                <Text style={styles.confirmButtonText}>{isReportingIncident ? 'Enviando...' : 'Relatar'}</Text>
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
    fuelButton: { backgroundColor: '#10B981', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 8, width: '100%', alignItems: 'center', marginBottom: 12 },
    fuelButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
    incidentButton: { backgroundColor: '#F59E0B', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 8, width: '100%', alignItems: 'center', marginBottom: 12 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 450, maxHeight: '90%' },
    modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#333' },
    modalLabelText: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8 },
    modalInfo: { fontSize: 14, color: '#666', marginBottom: 20 },
    inputLabel: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 4 },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 16 },
    modalButtons: { flexDirection: 'row', gap: 12, marginTop: 12 },
    modalButton: { flex: 1, padding: 16, borderRadius: 8, alignItems: 'center' },
    cancelButton: { backgroundColor: '#f5f5f5' },
    cancelButtonText: { color: '#666', fontWeight: 'bold', fontSize: 16 },
    confirmButton: { backgroundColor: '#2563EB' },
    confirmButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#ddd' },
    activeChip: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
    chipText: { color: '#666', fontSize: 12 },
    activeChipText: { color: '#fff', fontWeight: 'bold' },
    paymentChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 4 },
    activePaymentChip: { backgroundColor: '#EFF6FF', borderColor: '#2563EB' },
    paymentIcon: { fontSize: 16, marginRight: 6 },
    paymentChipText: { fontSize: 13, color: '#4B5563' },
    corporateFields: { backgroundColor: '#F3F4F6', padding: 12, borderRadius: 12, marginBottom: 16 },
});
