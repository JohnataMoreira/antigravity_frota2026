import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function CameraScreen() {
    const { hasPermission, requestPermission } = useCameraPermission();
    const device = useCameraDevice('back');
    const camera = useRef<Camera>(null);
    const [photo, setPhoto] = useState<string | null>(null);
    const router = useRouter();
    const params = useLocalSearchParams(); // vehicleId

    useEffect(() => {
        if (!hasPermission) {
            requestPermission();
        }
    }, [hasPermission]);

    if (!hasPermission) return <View style={styles.container}><Text>No Camera Permission</Text></View>;
    if (device == null) return <View style={styles.container}><Text>No Camera Device</Text></View>;

    const takePhoto = async () => {
        if (camera.current) {
            const file = await camera.current.takePhoto();
            setPhoto(`file://${file.path}`);
        }
    };

    const confirmPhoto = () => {
        // In a real app, upload here.
        // specific flow: Vehicle -> Camera -> Confirmation -> Journey Start
        // detailed flow:
        // 1. Camera returns photo path
        // 2. We navigate back to Vehicles/Inspection with photo path
        // 3. User confirms and calls API/DB

        // For MVP: Pass photo back via router params or global state? 
        // Expo Router doesn't pass complex objects back easily.
        // We will navigate to a "ConfirmStart" screen or back to index with param.

        Alert.alert('Photo Saved', 'Ready to start journey.', [
            {
                text: 'OK', onPress: () => {
                    router.push({ pathname: '/(tabs)/', params: { ...params, photoPath: photo } });
                }
            }
        ]);
    };

    return (
        <View style={styles.container}>
            {photo ? (
                <View style={styles.preview}>
                    <Image source={{ uri: photo }} style={styles.fullscreen} />
                    <View style={styles.controls}>
                        <TouchableOpacity style={styles.button} onPress={() => setPhoto(null)}>
                            <Text style={styles.text}>Retake</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.button, styles.confirm]} onPress={confirmPhoto}>
                            <Text style={styles.text}>Confirm</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <>
                    <Camera
                        ref={camera}
                        style={StyleSheet.absoluteFill}
                        device={device}
                        isActive={true}
                        photo={true}
                    />
                    <TouchableOpacity style={styles.captureBtn} onPress={takePhoto}>
                        <View style={styles.captureInner} />
                    </TouchableOpacity>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'black' },
    fullscreen: { flex: 1 },
    captureBtn: { position: 'absolute', bottom: 50, alignSelf: 'center', width: 80, height: 80, borderRadius: 40, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
    captureInner: { width: 70, height: 70, borderRadius: 35, borderWidth: 4, borderColor: 'black' },
    preview: { flex: 1 },
    controls: { position: 'absolute', bottom: 50, width: '100%', flexDirection: 'row', justifyContent: 'space-around' },
    button: { padding: 20, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10 },
    confirm: { backgroundColor: '#2563EB' },
    text: { color: 'white', fontWeight: 'bold' }
});
