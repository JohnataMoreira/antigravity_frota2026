import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Wallet, TrendingUp, Clock, CheckCircle2, AlertCircle, FileText, Receipt, ArrowUpRight } from 'lucide-react-native';
import { database } from '../src/model/database';
import Expense from '../src/model/Expense';
import withObservables from '@nozbe/with-observables';
import { Q } from '@nozbe/watermelondb';

function WalletScreen({ expenses }: { expenses: Expense[] }) {
    const router = useRouter();

    const pendingReimbursements = expenses
        .filter(e => e.paymentMethod === 'REIMBURSEMENT' && e.status === 'PENDING')
        .reduce((sum, e) => sum + e.amount, 0);

    const paidReimbursements = expenses
        .filter(e => e.paymentMethod === 'REIMBURSEMENT' && e.status === 'PAID')
        .reduce((sum, e) => sum + e.amount, 0);

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'PAID': return { label: 'Pago', color: '#10B981', bg: '#F1FDF9', icon: CheckCircle2 };
            case 'CANCELED': return { label: 'Cancelado', color: '#EF4444', bg: '#FEF2F2', icon: AlertCircle };
            default: return { label: 'Pendente', color: '#D97706', bg: '#FFFBEB', icon: Clock };
        }
    };

    const getExpenseIcon = (type: string) => {
        switch (type) {
            case 'TOLL': return { label: 'Pedágio', icon: ArrowUpRight, color: '#2563EB', bg: '#EFF6FF' };
            case 'PARKING': return { label: 'Estacionam.', icon: Clock, color: '#7C3AED', bg: '#F5F3FF' };
            case 'FUEL': return { label: 'Combustível', icon: TrendingUp, color: '#059669', bg: '#ECFDF5' };
            default: return { label: 'Despesa', icon: Receipt, color: '#64748B', bg: '#F8F9FA' };
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-[#F1F3F5]">
            <StatusBar barStyle="dark-content" />
            
            <View className="px-6 py-4 flex-row items-center border-b border-slate-100 bg-white">
                <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-xl bg-[#F8F9FA] items-center justify-center border border-slate-200 mr-4">
                    <ChevronLeft size={20} color="#1A1C1E" />
                </TouchableOpacity>
                <Text className="text-[#1A1C1E] font-black text-lg uppercase tracking-tight">Fluxo Financeiro</Text>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
                {/* Balance Card */}
                <View className="bg-[#1A1C1E] p-8 rounded-[40px] shadow-xl shadow-black/20 mb-10 overflow-hidden">
                    <Text className="text-blue-500 font-black text-xs uppercase tracking-[4px] mb-2">Reembolso Pendente</Text>
                    <View className="flex-row items-baseline mb-6">
                        <Text className="text-white text-base font-bold mr-2">R$</Text>
                        <Text className="text-white text-5xl font-black tracking-tighter">
                            {pendingReimbursements.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </Text>
                    </View>
                    
                    <View className="flex-row justify-between items-center bg-white/5 p-4 rounded-3xl border border-white/10">
                        <View className="flex-row items-center">
                            <View className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
                            <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total Recebido</Text>
                        </View>
                        <Text className="text-white font-bold">R$ {paidReimbursements.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
                    </View>
                </View>

                <View className="flex-row items-center justify-between mb-6 px-2">
                    <Text className="text-[#1A1C1E] font-black text-sm uppercase tracking-widest">Atividade Recente</Text>
                    <TouchableOpacity>
                        <Text className="text-blue-600 font-bold text-xs">Ver Tudo</Text>
                    </TouchableOpacity>
                </View>

                {expenses.length === 0 ? (
                    <View className="bg-white rounded-[32px] p-10 items-center justify-center border border-slate-100 border-dashed">
                        <Receipt size={48} color="#CBD5E1" />
                        <Text className="text-slate-500 font-bold mt-4 text-center">Nenhuma despesa registrada.</Text>
                        <Text className="text-slate-400 text-[10px] uppercase tracking-widest text-center mt-2">Suas cobranças e reembolsos aparecerão aqui.</Text>
                    </View>
                ) : (
                    <View className="space-y-4">
                        {expenses.map(expense => {
                            const status = getStatusInfo(expense.status);
                            const type = getExpenseIcon(expense.type);
                            const Icon = type.icon;
                            const StatusIcon = status.icon;

                            return (
                                <TouchableOpacity 
                                    key={expense.id}
                                    className="bg-white p-5 rounded-[32px] shadow-sm border border-slate-100 flex-row items-center"
                                >
                                    <View className="w-14 h-14 rounded-2xl items-center justify-center mr-4" style={{ backgroundColor: type.bg }}>
                                        <Icon size={24} color={type.color} />
                                    </View>
                                    
                                    <View className="flex-1">
                                        <Text className="text-[#1A1C1E] font-bold text-base">{type.label}</Text>
                                        <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                                            {new Date(expense.updatedAt).toLocaleDateString()} • {expense.paymentMethod === 'REIMBURSEMENT' ? '🛠 Reembolso' : '💳 Pago'}
                                        </Text>
                                    </View>

                                    <View className="items-end">
                                        <Text className="text-[#1A1C1E] font-black text-base">
                                            R$ {expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </Text>
                                        <View className="flex-row items-center mt-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: status.bg }}>
                                            <StatusIcon size={10} color={status.color} />
                                            <Text className="ml-1 font-bold text-[9px] uppercase" style={{ color: status.color }}>
                                                {status.label}
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                <TouchableOpacity className="mt-10 bg-white p-6 rounded-[32px] border border-blue-100 items-center justify-center shadow-sm">
                    <View className="flex-row items-center">
                        <FileText size={18} color="#2563EB" />
                        <Text className="text-[#2563EB] font-bold ml-2">Exportar Relatório Mensal</Text>
                    </View>
                </TouchableOpacity>

                <View className="mt-8 bg-blue-50/50 p-6 rounded-[32px] border border-blue-100">
                    <View className="flex-row items-center mb-2">
                        <AlertCircle size={18} color="#2563EB" />
                        <Text className="ml-2 font-bold text-blue-900">Como funciona o reembolso?</Text>
                    </View>
                    <Text className="text-blue-800/80 text-[11px] leading-5">
                        Toda despesa paga com seus próprios recursos deve ser registrada como "Reembolso". Após a revisão do gestor, o valor será depositado em sua conta cadastrada.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const EnhancedWallet = withObservables([], () => ({
    expenses: database.get<Expense>('expenses').query(Q.sortBy('updated_at', Q.desc)).observe()
}))(WalletScreen);

export default EnhancedWallet;
