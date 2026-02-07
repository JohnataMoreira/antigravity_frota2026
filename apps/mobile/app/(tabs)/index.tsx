import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { database } from '../../src/model/database';
import { useRouter, useLocalSearchParams } from 'expo-router';
// import { Q } from '@nozbe/watermelondb'; // Not used yet

export default function VehiclesScreen() {
    const [vehicles, setVehicles] = useState<any[]>([]);
    const router = useRouter();

    const params = useLocalSearchParams();

    useEffect(() => {
        if (params.photoPath && params.vehicleId) {
            // Logic to start journey after photo
            const vehicle = vehicles.find(v => v.id === params.vehicleId);
            if (vehicle) {
                handleStartJourney(vehicle, params.photoPath as string);
            }
        }
    }, [params.photoPath, params.vehicleId]);

    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                const collection = database.get('vehicles');
                const data = await collection.query().fetch();
                setVehicles(data);

                if (data.length === 0) {
                    await database.write(async () => {
                        await collection.create((v: any) => {
                            v.plate = 'ABC-1234';
                            v.model = 'Gol';
                            v.brand = 'VW';
                            v.status = 'AVAILABLE';
                            v.currentKm = 50000;
                        });
                        await collection.create((v: any) => {
                            v.plate = 'XYZ-9876';
                            v.model = 'Actros';
                            v.brand = 'Mercedez';
                            v.status = 'AVAILABLE';
                            v.currentKm = 120000;
                        });
                    });
                    const newData = await collection.query().fetch();
                    setVehicles(newData);
                }
            } catch (e) {
                console.error('DB Error', e);
            }
        };
        fetchVehicles();
    }, []);

    const handleStartJourney = async (vehicle: any, photoPath?: string) => {
        // 1. Confirm
        Alert.alert(
            'Start Journey',
            `Start journey with ${vehicle.plate}? ${photoPath ? '(Photo Checked)' : ''}`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Start', onPress: async () => {
                        try {
                            await database.write(async () => {
                                // Create Journey
                                const journeys = database.get('journeys');
                                await journeys.create((j: any) => {
                                    j.vehicleId = vehicle.id;
                                    j.driverId = 'LOCAL_USER';
                                    j.status = 'IN_PROGRESS';
                                    j.startKm = vehicle.currentKm;
                                    j.startTime = Date.now();
                                    j.startPhotoUrl = photoPath;
                                });

                                // Update Vehicle Status
                                await vehicle.update((v: any) => {
                                    v.status = 'IN_USE';
                                });
                            });

                            // Navigate to Active Journey
                            router.replace('/(tabs)/journey');
                        } catch (e) {
                            Alert.alert('Error', 'Failed to start journey');
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={vehicles}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={styles.row}>
                            <Text style={styles.plate}>{item.plate}</Text>
                            <Text style={[styles.status, { color: item.status === 'AVAILABLE' ? 'green' : 'blue' }]}>
                                {item.status}
                            </Text>
                        </View>
                        <Text style={styles.model}>{item.brand} {item.model}</Text>
                        <Text style={styles.km}>{item.currentKm} km</Text>

                        {item.status === 'AVAILABLE' && (
                            <TouchableOpacity style={styles.button} onPress={() => {
                                // Go to Camera first
                                router.push({ pathname: '/camera', params: { vehicleId: item.id } });
                            }}>
                                <Text style={styles.buttonText}>Inspect & Start</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
    card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    plate: { fontSize: 18, fontWeight: 'bold' },
    status: { fontWeight: '600' },
    model: { color: '#666', marginBottom: 4 },
    km: { color: '#888', marginBottom: 12 },
    button: { backgroundColor: '#2563EB', padding: 8, borderRadius: 6, alignItems: 'center' },
    buttonText: { color: '#fff', fontWeight: 'bold' }
});
