import { View, Text, StyleSheet } from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export function OfflineBanner() {
    const { isFullyOnline } = useNetworkStatus();

    if (isFullyOnline) return null;

    return (
        <View style={styles.banner}>
            <Text style={styles.text}>📡 Modo Offline - Dados serão sincronizados quando conectar</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    banner: {
        backgroundColor: '#FFA500',
        padding: 12,
        alignItems: 'center',
    },
    text: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    }
});
