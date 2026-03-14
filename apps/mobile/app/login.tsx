import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from './_layout';
import { api } from '../src/services/api';
import { Eye, EyeOff } from 'lucide-react-native';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [document, setDocument] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const router = useRouter();

    const handleLogin = async () => {
        console.log('[Login] 👆 Login button pressed');
        if (!email || !password || !document) {
            console.warn('[Login] ⚠️ Missing fields:', { email: !!email, password: !!password, document: !!document });
            Alert.alert('Atenção', 'Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        console.log('[Login] 🔑 Attempting login for:', email, 'Org CNPJ:', document);
        setIsLoading(true);
        try {
            const data = await api.login(email, password, document);
            console.log('[Login] ✅ API success, setting session...');
            await login(data.user, data.access_token);
            console.log('[Login] ➡️ Redirecting to (tabs)...');
            router.replace('/(tabs)');
        } catch (e: any) {
            console.error('[Login] ❌ Login error details:', {
                message: e.message,
                status: e.status,
                data: e.data,
                stack: e.stack
            });
            
            let errorMsg = 'Ocorreu um erro ao tentar realizar o login.';
            if (e.message === 'Network Error' || e.message === 'Network request failed') {
                errorMsg = 'Não foi possível conectar ao servidor. Verifique sua conexão ou se o serviço está disponível.';
            } else if (e.status === 401 || e.status === 403) {
                errorMsg = 'E-mail ou senha incorretos.';
            } else if (e.status === 404) {
                errorMsg = 'Serviço de autenticação não encontrado. Contate o suporte.';
            } else if (e.message) {
                errorMsg = e.message;
            }

            Alert.alert('Falha na Autenticação', errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-[#F1F3F5]">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, padding: 32 }}
                    keyboardShouldPersistTaps="handled"
                >
                    <View className="flex-1 justify-center max-w-[400px] self-center w-full">
                        {/* App Branding */}
                        <View className="items-center mb-12">
                            <View className="w-48 h-24 bg-white/80 rounded-2xl items-center justify-center border border-slate-200 mb-6 px-4">
                                <Image 
                                    source={require('../assets/logo.png')} 
                                    style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
                                />
                            </View>
                            <Text className="text-[#1A1C1E] text-3xl font-bold tracking-tight text-center">
                                Frota2026 Driver
                            </Text>
                        </View>

                        {/* Form */}
                        <View className="space-y-6">
                            {/* Organization Document */}
                            <View>
                                <Text className="text-[#1A1C1E] text-sm font-semibold mb-2 ml-1">
                                    CNPJ da Organização
                                </Text>
                                <TextInput
                                    className="w-full rounded-xl text-[#1A1C1E] bg-[#F8F9FA] h-14 px-4 text-base border border-transparent shadow-sm"
                                    placeholder="00.000.000/0000-00"
                                    aria-label="CNPJ da Organização"
                                    placeholderTextColor="#ADB5BD"
                                    value={document}
                                    onChangeText={setDocument}
                                    keyboardType="numeric"
                                />
                            </View>

                            {/* Email */}
                            <View>
                                <Text className="text-[#1A1C1E] text-sm font-semibold mb-2 ml-1">
                                    E-mail
                                </Text>
                                <TextInput
                                    className="w-full rounded-xl text-[#1A1C1E] bg-[#F8F9FA] h-14 px-4 text-base border border-transparent shadow-sm"
                                    placeholder="seu@email.com"
                                    aria-label="E-mail"
                                    placeholderTextColor="#ADB5BD"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>

                            {/* Password */}
                            <View>
                                <Text className="text-[#1A1C1E] text-sm font-semibold mb-2 ml-1">
                                    Senha
                                </Text>
                                <View className="relative w-full flex-row items-center">
                                    <TextInput
                                        className="flex-1 rounded-xl text-[#1A1C1E] bg-[#F8F9FA] h-14 px-4 pr-12 text-base border border-transparent shadow-sm"
                                        placeholder="••••••••"
                                        aria-label="Senha"
                                        placeholderTextColor="#ADB5BD"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                    />
                                    <TouchableOpacity
                                        className="absolute right-4"
                                        onPress={() => setShowPassword(!showPassword)}
                                        accessibilityLabel={showPassword ? "Esconder senha" : "Mostrar senha"}
                                        accessibilityRole="button"
                                    >
                                        {showPassword ? (
                                            <EyeOff size={22} color="#ADB5BD" aria-hidden={true} />
                                        ) : (
                                            <Eye size={22} color="#ADB5BD" aria-hidden={true} />
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Submit Button */}
                            <View className="pt-4">
                                <TouchableOpacity
                                    className={`w-full h-14 items-center justify-center rounded-xl bg-[#2563EB] shadow-md shadow-blue-500/30 ${isLoading ? 'opacity-70' : ''}`}
                                    onPress={handleLogin}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text className="text-base font-bold text-white">
                                            Entrar
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Footer */}
                        <View className="mt-12 items-center">
                            <Text className="text-slate-500 text-sm">
                                Problemas para acessar?{' '}
                                <Text className="text-[#2563EB] font-bold">Contate seu gestor.</Text>
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
