import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, TextInput, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, LifeBuoy, MessageCircle, Phone, Mail, Search, ChevronDown, ExternalLink, HelpCircle } from 'lucide-react-native';
import { useState } from 'react';

function ContactCard({ icon: Icon, title, desc, onPress, color = "#2563EB" }: { icon: any; title: string; desc: string; onPress: () => void; color?: string }) {
    return (
        <TouchableOpacity 
            onPress={onPress}
            className="mb-4 bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex-row items-center"
            activeOpacity={0.7}
        >
            <View className="w-12 h-12 rounded-2xl bg-[#F8F9FA] items-center justify-center">
                <Icon size={24} color={color} />
            </View>
            <View className="ml-4 flex-1">
                <Text className="text-[#1A1C1E] font-bold text-base uppercase tracking-tight">{title}</Text>
                <Text className="text-slate-400 text-xs font-medium">{desc}</Text>
            </View>
            <ExternalLink size={16} color="#ADB5BD" />
        </TouchableOpacity>
    );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <TouchableOpacity 
            onPress={() => setExpanded(!expanded)}
            className="mb-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100"
            activeOpacity={0.9}
        >
            <View className="flex-row justify-between items-center">
                <Text className="flex-1 text-[#1A1C1E] font-bold text-sm pr-4">{question}</Text>
                <ChevronDown size={20} color="#ADB5BD" style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }} />
            </View>
            {expanded && (
                <View className="mt-4 pt-4 border-t border-slate-50">
                    <Text className="text-slate-500 text-sm leading-6">{answer}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

export default function SupportScreen() {
    const router = useRouter();
    const [search, setSearch] = useState('');

    const openWhatsApp = () => Linking.openURL('whatsapp://send?phone=553199999999');
    const openPhone = () => Linking.openURL('tel:0800000000');
    const openEmail = () => Linking.openURL('mailto:suporte@frota2026.com.br');

    return (
        <SafeAreaView className="flex-1 bg-[#F1F3F5]">
            <StatusBar barStyle="dark-content" />
            
            {/* Header */}
            <View className="px-6 py-4 flex-row items-center border-b border-slate-100 bg-white">
                <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-xl bg-[#F8F9FA] items-center justify-center border border-slate-200 mr-4">
                    <ChevronLeft size={20} color="#1A1C1E" />
                </TouchableOpacity>
                <Text className="text-[#1A1C1E] font-black text-lg uppercase tracking-tight">Central de Ajuda</Text>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Hero */}
                <View className="bg-[#2563EB] p-10 items-center justify-center">
                    <View className="w-20 h-20 bg-white/20 rounded-full items-center justify-center mb-6">
                        <LifeBuoy size={40} color="white" />
                    </View>
                    <Text className="text-white text-3xl font-black text-center mb-2">Como podemos {search ? 'ajudar?' : 'ajudar você?'}</Text>
                    <Text className="text-blue-100 text-center font-medium opacity-80">Suporte técnico disponível 24h por dia</Text>
                </View>

                {/* Search */}
                <View className="px-6 -mt-8 mb-8">
                    <View className="relative shadow-xl shadow-blue-900/10">
                        <View className="absolute left-4 z-10 top-4">
                            <Search size={20} color="#ADB5BD" />
                        </View>
                        <TextInput
                            className="w-full h-14 pl-12 pr-4 bg-white rounded-2xl border border-transparent text-[#1A1C1E] text-base"
                            placeholder="Pesquisar problemas comuns..."
                            placeholderTextColor="#ADB5BD"
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>
                </View>

                {/* Contact Sections */}
                <View className="px-6 mb-10">
                    <Text className="text-[#1A1C1E] font-black text-sm uppercase tracking-widest mb-4">Contatos Diretos</Text>
                    <ContactCard 
                        icon={MessageCircle} 
                        title="WhatsApp Suporte" 
                        desc="Resposta rápida via chat" 
                        onPress={openWhatsApp}
                        color="#10B981"
                    />
                    <ContactCard 
                        icon={Phone} 
                        title="0800 de Emergência" 
                        desc="Para acidentes ou quebras críticas" 
                        onPress={openPhone}
                        color="#EF4444"
                    />
                    <ContactCard 
                        icon={Mail} 
                        title="E-mail Administrativo" 
                        desc="Dúvidas sobre pagamentos e CNH" 
                        onPress={openEmail}
                        color="#6366F1"
                    />
                </View>

                {/* FAQ */}
                <View className="px-6">
                    <Text className="text-[#1A1C1E] font-black text-sm uppercase tracking-widest mb-4">Dúvidas Frequentes</Text>
                    <FAQItem 
                        question="Como relatar um acidente grave?" 
                        answer="Use o botão de 0800 de Emergência imediatamente. Após o primeiro contato, registre as fotos e detalhes no botão de 'Registrar Incidente' na sua jornada ativa." 
                    />
                    <FAQItem 
                        question="O que fazer se o app ficar offline?" 
                        answer="O Frota2026 funciona offline por padrão. Continue sua jornada normalmente e os dados serão sincronizados automaticamente assim que você recuperar a conexão de internet." 
                    />
                    <FAQItem 
                        question="Esqueci minha senha, como recuperar?" 
                        answer="Clique em 'Esqueci minha senha' na tela de login ou entre em contato com o administrativo da sua transportadora para resetar sua conta." 
                    />
                </View>

                <TouchableOpacity className="mx-6 mt-6 bg-slate-100 p-6 rounded-3xl items-center flex-row justify-center">
                    <HelpCircle size={18} color="#64748B" />
                    <Text className="text-slate-500 font-bold ml-2">Ver todos os manuais (PDF)</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
