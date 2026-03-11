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
        <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    className="p-6 sm:p-12"
                    keyboardShouldPersistTaps="handled"
                >
                    <View className="flex-1 justify-center space-y-8 max-w-[480px] self-center w-full">
                        {/* Header & Logo */}
                        <View className="items-center space-y-6">
                            <View className="w-full aspect-[3/1] bg-slate-200 dark:bg-slate-800 rounded-lg items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700">
                                <Text className="text-slate-500 dark:text-slate-400 font-display font-medium">Logo da Empresa</Text>
                            </View>
                            <Text className="text-slate-900 dark:text-slate-100 text-3xl font-display font-bold tracking-tight text-center">
                                Frota2026 Driver
                            </Text>
                        </View>

                        {/* Form */}
                        <View className="space-y-5">
                            {/* Organization Document */}
                            <View className="space-y-2">
                                <Text className="text-slate-700 dark:text-slate-300 text-base font-display font-medium">
                                    CNPJ da Organização
                                </Text>
                                <TextInput
                                    className="w-full rounded-lg text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 h-14 px-4 text-base font-display"
                                    placeholder="00.000.000/0000-00"
                                    placeholderTextColor="#94a3b8"
                                    value={document}
                                    onChangeText={setDocument}
                                    keyboardType="numeric"
                                />
                            </View>

                            {/* Email */}
                            <View className="space-y-2">
                                <Text className="text-slate-700 dark:text-slate-300 text-base font-display font-medium">
                                    E-mail
                                </Text>
                                <TextInput
                                    className="w-full rounded-lg text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 h-14 px-4 text-base font-display"
                                    placeholder="seu@email.com"
                                    placeholderTextColor="#94a3b8"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>

                            {/* Password */}
                            <View className="space-y-2">
                                <Text className="text-slate-700 dark:text-slate-300 text-base font-display font-medium">
                                    Senha
                                </Text>
                                <View className="relative w-full flex-row items-center">
                                    <TextInput
                                        className="flex-1 rounded-lg text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 h-14 px-4 pr-12 text-base font-display"
                                        placeholder="••••••••"
                                        placeholderTextColor="#94a3b8"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                    />
                                    <TouchableOpacity
                                        className="absolute right-4"
                                        onPress={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff size={24} color="#94a3b8" />
                                        ) : (
                                            <Eye size={24} color="#94a3b8" />
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Submit Button */}
                            <View className="pt-4">
                                <TouchableOpacity
                                    className={`w-full min-h-[56px] items-center justify-center rounded-xl bg-primary px-4 py-3 shadow-lg shadow-primary/20 ${isLoading ? 'opacity-70' : ''}`}
                                    onPress={handleLogin}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text className="text-lg font-display font-semibold text-white">
                                            Entrar
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Footer */}
                        <View className="pt-8 items-center">
                            <Text className="text-slate-500 dark:text-slate-400 text-sm font-display">
                                Problemas para acessar?{' '}
                                <Text className="text-primary font-medium">Contate seu gestor.</Text>
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
