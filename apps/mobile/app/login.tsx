import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
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
        if (!email || !password || !document) {
            Alert.alert('Atenção', 'Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        setIsLoading(true);
        try {
            const data = await api.login(email, password, document);
            await login(data.user, data.access_token);
            router.replace('/(tabs)');
        } catch (e: any) {
            Alert.alert('Falha na Autenticação', e.message || 'Verifique suas credenciais e tente novamente.');
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
                            <View className="w-24 h-24 bg-[#E9ECEF] rounded-2xl items-center justify-center border-2 border-dashed border-slate-300 mb-6">
                                <Text className="text-slate-400 font-medium text-xs text-center px-2">
                                    Logo da Empresa
                                </Text>
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
                                        placeholderTextColor="#ADB5BD"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                    />
                                    <TouchableOpacity
                                        className="absolute right-4"
                                        onPress={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff size={22} color="#ADB5BD" />
                                        ) : (
                                            <Eye size={22} color="#ADB5BD" />
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
