import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { database } from '../../src/model/database';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../_layout';
import { sync } from '../../src/services/sync';

export default function VehiclesScreen() {
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const [startingVehicleId, setStartingVehicleId] = useState<string | null>(null);
    const router = useRouter();
    const { token, logout } = useAuth();
    const params = useLocalSearchParams();

    const fetchVehicles = async () => {
        try {
            const collection = database.get('vehicles');
            const data = await collection.query().fetch();
            setVehicles(data);
        } catch (e) {
            console.error('DB Error', e);
        }
    };

    useEffect(() => {
        fetchVehicles();
    }, []);

    const handleSync = async () => {
        if (isSyncing) return;
        setIsSyncing(true);
        try {
            await sync(token);
            await fetchVehicles();
            Alert.alert('Sucesso', 'Dados sincronizados com o servidor');
        } catch (e: any) {
            Alert.alert('Erro na Sincronização', e.message || 'Falha ao conectar');
        } finally {
            setIsSyncing(false);
        }
    };

    // Journey start logic is now handled in checklist.tsx
    // Keep fetchVehicles and handleSync


    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Minha Frota</Text>
                    <TouchableOpacity onPress={logout}>
                        <Text style={styles.logoutButton}>Sair</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={handleSync} disabled={isSyncing}>
                    {isSyncing ? (
                        <ActivityIndicator size="small" color="#2563EB" />
                    ) : (
                        <Text style={styles.syncButton}>🔄 Sincronizar</Text>
                    )}
                </TouchableOpacity>
            </View>

            <FlatList
                data={vehicles}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={styles.row}>
                            <Text style={styles.plate}>{item.plate}</Text>
                            <Text style={[styles.status, { color: item.status === 'AVAILABLE' ? 'green' : 'blue' }]}>
                                {item.status === 'AVAILABLE' ? 'Disponível' : 'Em Uso'}
                            </Text>
                        </View>
                        <Text style={styles.model}>{item.brand} {item.model}</Text>
                        <Text style={styles.km}>{item.currentKm} km</Text>

                        {item.status === 'AVAILABLE' && (
                            <TouchableOpacity
                                style={[
                                    styles.button,
                                    (isStarting && startingVehicleId === item.id) && styles.buttonDisabled
                                ]}
                                onPress={() => {
                                    // Navigate to checklist for checkout
                                    router.push({
                                        pathname: '/checklist',
                                        params: {
                                            type: 'checkout',
                                            vehicleId: item.id,
                                            currentKm: item.currentKm
                                        }
                                    });
                                }}
                                disabled={isStarting && startingVehicleId === item.id}
                            >
                                {isStarting && startingVehicleId === item.id ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.buttonText}>📸 Iniciar Jornada</Text>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>Nenhum veículo encontrado.</Text>
                        <Text style={styles.emptySubtext}>Toque em Sincronizar para baixar dados.</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 40 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
    syncButton: { color: '#2563EB', fontWeight: 'bold', fontSize: 16 },
    logoutButton: { color: '#EF4444', fontSize: 14, marginTop: 4 },
    card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    plate: { fontSize: 18, fontWeight: 'bold' },
    status: { fontWeight: '600' },
    model: { color: '#666', marginBottom: 4 },
    km: { color: '#888', marginBottom: 12 },
    button: { backgroundColor: '#2563EB', padding: 12, borderRadius: 6, alignItems: 'center', minHeight: 48 },
    buttonDisabled: { backgroundColor: '#93C5FD' },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    empty: { alignItems: 'center', marginTop: 100 },
    emptyText: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 8 },
    emptySubtext: { fontSize: 14, color: '#666' }
});
