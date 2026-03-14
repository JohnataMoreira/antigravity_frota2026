import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../_layout';
import { User, LogOut, ChevronRight, Bell, Shield, LifeBuoy, History, Wallet, Database, RefreshCw, FileText, AlertCircle, Settings } from 'lucide-react-native';
import { database } from '../../src/model/database';
import { useRouter } from 'expo-router';
import AppDocument from '../../src/model/AppDocument';
import withObservables from '@nozbe/with-observables';
import { Q } from '@nozbe/watermelondb';
import { of } from 'rxjs';
import { outboxService } from '../../src/services/OutboxService';

function ProfileScreen({ documents = [] }: { documents: AppDocument[] }) {
    const { user, logout } = useAuth();
    const router = useRouter();

    const handleLogout = () => {
        Alert.alert(
            'Sair',
            'Deseja realmente sair da sua conta?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { 
                    text: 'Sair', 
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                    }
                }
            ]
        );
    };

    const clearLocalData = () => {
        Alert.alert(
            'Limpar Dados Locais',
            'Iso apagará todas as informações salvas no dispositivo. Use apenas se estiver com problemas de sincronização.',
            [
                { text: 'Cancelar', style: 'cancel' },
                { 
                    text: 'Limpar', 
                    style: 'destructive',
                    onPress: async () => {
                        await database.write(async () => {
                            await database.unsafeResetDatabase();
                        });
                        Alert.alert('Sucesso', 'Banco de dados reiniciado. Faça login novamente.');
                        await logout();
                    }
                }
            ]
        );
    };

    const MenuButton = ({ icon: Icon, label, onPress, destructive = false }: any) => (
        <TouchableOpacity 
            onPress={onPress}
            className="flex-row items-center bg-white px-6 h-20 border-b border-slate-50 last:border-b-0"
            accessibilityLabel={label}
            accessibilityRole="button"
            accessibilityHint={destructive ? "Sair da conta ou realizar ação destrutiva" : `Abrir ${label}`}
        >
            <View className={`w-12 h-12 rounded-2xl items-center justify-center ${destructive ? 'bg-[#EF4444]/10' : 'bg-[#F1F3F5]'}`} aria-hidden={true}>
                <Icon size={22} color={destructive ? '#EF4444' : '#2563EB'} />
            </View>
            <Text className={`flex-1 ml-4 font-bold text-base ${destructive ? 'text-[#EF4444]' : 'text-[#1A1C1E]'}`}>
                {label}
            </Text>
            {!destructive && <ChevronRight size={18} color="#ADB5BD" aria-hidden={true} />}
        </TouchableOpacity>
    );

    const expiringDocs = documents.filter(d => {
        if (!d.expiryDate) return false;
        const now = Date.now();
        const diffDays = (d.expiryDate - now) / (1000 * 60 * 60 * 24);
        return diffDays > 0 && diffDays <= 30;
    });

    const expiredDocs = documents.filter(d => d.expiryDate && Date.now() > d.expiryDate);

    return (
        <SafeAreaView className="flex-1 bg-[#F1F3F5]">
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header / User Info Card */}
                <View className="px-6 pt-10 mb-8">
                    <View className="bg-white rounded-[40px] p-8 items-center shadow-sm border border-slate-100">
                        <View className="w-24 h-24 bg-[#2563EB]/10 rounded-full items-center justify-center mb-6">
                            <User size={48} color="#2563EB" />
                        </View>
                        <Text className="text-2xl font-bold text-[#1A1C1E] tracking-tight">
                            {user?.name || 'Motorista'}
                        </Text>
                        <Text className="text-slate-400 font-medium text-sm mt-1">
                            {user?.email || 'admin@paraopeba.com.br'}
                        </Text>
                        
                        <View className="mt-8 w-full h-[1px] bg-slate-100" />
                        
                        <View className="mt-8 flex-row items-center bg-[#F1F3F5] px-6 py-3 rounded-full">
                            <Shield size={16} color="#2563EB" />
                            <Text className="text-[#1A1C1E] text-xs font-bold uppercase tracking-widest ml-3">
                                {user?.organization?.name || 'Paraopeba LTDA'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Alerts Section */}
                {(expiringDocs.length > 0 || expiredDocs.length > 0) && (
                    <View className="px-6 mb-8">
                        <View className={`rounded-[32px] p-6 border ${expiredDocs.length > 0 ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
                            <View className="flex-row items-center mb-3">
                                <AlertCircle size={20} color={expiredDocs.length > 0 ? '#EF4444' : '#D97706'} />
                                <Text className={`ml-2 font-bold text-sm ${expiredDocs.length > 0 ? 'text-red-900' : 'text-amber-900'}`}>
                                    {expiredDocs.length > 0 ? 'Documentos Expirados' : 'Aviso de Vencimento'}
                                </Text>
                            </View>
                            <Text className={`text-xs ${expiredDocs.length > 0 ? 'text-red-800/80' : 'text-amber-800/80'}`}>
                                {expiredDocs.length > 0 
                                    ? `Você possui ${expiredDocs.length} documento(s) vencido(s). Regularize imediatamente.` 
                                    : `Você possui ${expiringDocs.length} documento(s) que vencem nos próximos 30 dias.`}
                            </Text>
                            <TouchableOpacity 
                                className="mt-4" 
                                onPress={() => router.push('/documents')}
                                accessibilityLabel="Ver todos os documentos"
                                accessibilityRole="button"
                            >
                                <Text className={`font-bold text-xs underline ${expiredDocs.length > 0 ? 'text-red-600' : 'text-amber-600'}`}>Ver Documentos</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Settings Group */}
                <View className="px-6 mb-8">
                    <View className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-slate-100">
                        <MenuButton icon={History} label="Histórico de Jornadas" onPress={() => router.push('/history')} />
                        <MenuButton icon={Wallet} label="Sua Carteira Digital" onPress={() => router.push('/wallet')} />
                        <MenuButton icon={FileText} label="Cofre de Documentos" onPress={() => router.push('/documents')} />
                        <MenuButton icon={LifeBuoy} label="Ajuda e Suporte" onPress={() => router.push('/support')} />
                        <MenuButton icon={Bell} label="Notificações" />
                    </View>
                </View>

                {/* Data Group */}
                <View className="px-6 mb-12">
                    <View className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-slate-100">
                        <MenuButton 
                            icon={RefreshCw} 
                            label="Sincronizar Dados" 
                            onPress={() => {
                                outboxService.processQueue();
                                Alert.alert('Sincronização', 'Sincronização total agendada. Volte para a lista de veículos.');
                            }} 
                        />
                        <MenuButton icon={Database} label="Limpar Cache Local" onPress={clearLocalData} />
                    </View>
                </View>

                {/* Logout Button */}
                <View className="px-6 mb-20">
                    <TouchableOpacity 
                        onPress={handleLogout}
                        className="w-full h-16 bg-white rounded-2xl flex-row items-center justify-center border border-red-50"
                        accessibilityLabel="Sair da Conta"
                        accessibilityRole="button"
                    >
                        <LogOut size={20} color="#EF4444" />
                        <Text className="text-[#EF4444] font-bold text-base ml-3">Sair da Conta</Text>
                    </TouchableOpacity>
                    <Text className="text-center mt-8 text-slate-400 text-[10px] font-medium uppercase tracking-[3px]">
                        Versão 1.5.0 • Frota2026 Driver
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const EnhancedProfile = withObservables([], () => {
    try {
        return {
            documents: database.get<AppDocument>('documents').query().observe()
        };
    } catch (e) {
        console.warn('[Profile] WatermelonDB not ready or unsupported:', e);
        return { documents: of([]) };
    }
})(ProfileScreen);

export default function ProfileWrapper() {
    const { user } = useAuth();
    if (!user?.id) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F3F5' }}>
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }
    return <EnhancedProfile />;
}
