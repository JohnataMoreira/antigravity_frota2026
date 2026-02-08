import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from './_layout';

// Config
const API_URL = 'https://api.johnatamoreira.com.br'; // Production API URL
// NOTE: For real device, use machine IP.

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [orgId, setOrgId] = useState('');
    const { login } = useAuth();
    const router = useRouter();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Erro', 'Por favor, preencha todos os campos');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                Alert.alert('Erro no Login', data.message || 'Credenciais inválidas');
                return;
            }

            // data.access_token contains the JWT
            // We store the token and mock user for now (decoding JWT later if needed)
            login({ email }, data.access_token);
            router.replace('/(tabs)');
        } catch (e) {
            Alert.alert('Erro de Conexão', 'Não foi possível conectar ao servidor. Verifique sua internet.');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Frota2026 Driver</Text>

            <TextInput
                style={styles.input}
                placeholder="Organization ID"
                value={orgId}
                onChangeText={setOrgId}
            />

            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
            />

            <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Sign In</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 48,
        textAlign: 'center',
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
        fontSize: 16,
    },
    button: {
        backgroundColor: '#2563EB',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
