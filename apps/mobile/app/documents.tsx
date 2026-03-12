import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Image, ActivityIndicator, Alert, Linking } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { ChevronLeft, FileText, Calendar, ExternalLink, AlertCircle, ShieldCheck, Download } from 'lucide-react-native';
import { database } from '../src/model/database';
import AppDocument from '../src/model/AppDocument';
import withObservables from '@nozbe/with-observables';
import { Q } from '@nozbe/watermelondb';

function DocumentsScreen({ documents }: { documents: AppDocument[] }) {
    const router = useRouter();

    const getDocLabel = (type: string) => {
        switch (type) {
            case 'CNH': return 'Carteira de Habilitação';
            case 'CRLV': return 'Documento do Veículo';
            case 'ANTT': return 'Registro ANTT';
            case 'INSURANCE': return 'Seguro';
            default: return 'Documento';
        }
    };

    const isExpiringSoon = (dateStr?: number) => {
        if (!dateStr) return false;
        const now = Date.now();
        const expiry = new Date(dateStr).getTime();
        const diffDays = (expiry - now) / (1000 * 60 * 60 * 24);
        return diffDays > 0 && diffDays <= 30;
    };

    const isExpired = (dateStr?: number) => {
        if (!dateStr) return false;
        return Date.now() > new Date(dateStr).getTime();
    };

    const openDocument = (url: string) => {
        if (!url) return;
        Linking.openURL(url).catch(() => {
            Alert.alert('Erro', 'Não foi possível abrir o documento.');
        });
    };

    return (
        <SafeAreaView className="flex-1 bg-[#F1F3F5]">
            <View className="flex-row items-center px-6 py-4 bg-white border-b border-slate-100">
                <TouchableOpacity 
                    className="w-10 h-10 rounded-xl bg-[#F8F9FA] items-center justify-center border border-slate-200"
                    onPress={() => router.back()}
                >
                    <ChevronLeft size={20} color="#64748B" />
                </TouchableOpacity>
                <Text className="ml-4 text-xl font-bold text-[#1A1C1E]">Cofre de Documentos</Text>
            </View>

            <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
                <View className="bg-blue-600 rounded-[32px] p-6 mb-8 shadow-lg shadow-blue-500/20">
                    <View className="flex-row items-center justify-between mb-4">
                        <View className="bg-white/20 p-3 rounded-2xl">
                            <ShieldCheck size={24} color="white" />
                        </View>
                        <View className="bg-emerald-400 px-3 py-1 rounded-full">
                            <Text className="text-[10px] font-black text-emerald-900 uppercase">Seguro</Text>
                        </View>
                    </View>
                    <Text className="text-white text-lg font-bold">Seus Documentos Digitais</Text>
                    <Text className="text-blue-100 text-sm mt-1">Acesso rápido à CNH e CRLVs dos veículos em uso.</Text>
                </View>

                {documents.length === 0 ? (
                    <View className="bg-white rounded-[32px] p-10 items-center justify-center border border-slate-100 shadow-sm mt-4">
                        <FileText size={48} color="#CBD5E1" />
                        <Text className="text-slate-500 font-bold mt-4 text-center">Nenhum documento encontrado.</Text>
                        <Text className="text-slate-400 text-xs text-center mt-2">Os documentos são sincronizados automaticamente quando vinculados ao seu perfil ou veículo.</Text>
                    </View>
                ) : (
                    <View className="space-y-4">
                        {documents.map(doc => {
                            const expiring = isExpiringSoon(doc.expiryDate);
                            const expired = isExpired(doc.expiryDate);

                            return (
                                <TouchableOpacity 
                                    key={doc.id}
                                    onPress={() => openDocument(doc.fileUrl)}
                                    className="bg-white rounded-[28px] p-5 flex-row items-center border border-slate-100 shadow-sm"
                                >
                                    <View className={`w-14 h-14 rounded-[20px] items-center justify-center ${expired ? 'bg-red-50' : expiring ? 'bg-amber-50' : 'bg-blue-50'}`}>
                                        <FileText size={24} color={expired ? '#EF4444' : expiring ? '#D97706' : '#2563EB'} />
                                    </View>
                                    
                                    <View className="flex-1 ml-4 pr-2">
                                        <Text className="text-[#1A1C1E] font-bold text-base" numberOfLines={1}>
                                            {doc.name || getDocLabel(doc.type)}
                                        </Text>
                                        <View className="flex-row items-center mt-1">
                                            <Calendar size={12} color="#94A3B8" />
                                            <Text className={`text-[11px] font-medium ml-1 ${expired ? 'text-red-500' : expiring ? 'text-amber-600' : 'text-slate-500'}`}>
                                                {doc.expiryDate 
                                                    ? `Expira em ${new Date(doc.expiryDate).toLocaleDateString()}` 
                                                    : 'Sem data de expiração'}
                                            </Text>
                                        </View>
                                    </View>

                                    {(expired || expiring) && (
                                        <View className="mr-3">
                                            <AlertCircle size={20} color={expired ? '#EF4444' : '#D97706'} />
                                        </View>
                                    )}

                                    <View className="w-10 h-10 bg-[#F8F9FA] rounded-full items-center justify-center border border-slate-100">
                                        <ExternalLink size={16} color="#64748B" />
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                <View className="mt-10 mb-20 bg-amber-50 rounded-[32px] p-6 border border-amber-100">
                    <View className="flex-row items-center mb-2">
                        <AlertCircle size={18} color="#D97706" />
                        <Text className="ml-2 font-bold text-amber-900">Atenção</Text>
                    </View>
                    <Text className="text-amber-800/80 text-xs leading-5">
                        Estes documentos são para consulta rápida. Mantenha sempre os documentos físicos originais ou a versão oficial nos aplicativos do Governo (Carteira Digital de Trânsito).
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const EnhancedDocuments = withObservables([], () => ({
    documents: database.get<AppDocument>('documents').query().observe()
}))(DocumentsScreen);

export default EnhancedDocuments;
