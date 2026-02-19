import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { GlassCard } from '../../components/ui/Cards';
import {
 ShoppingCart,
 Plus,
 Search,
 Filter,
 Clock,
 CheckCircle2,
 AlertCircle,
 XCircle,
 Truck,
 FileText,
 ArrowRight,
 Factory as SupplierIcon
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '../../lib/utils';
import { clsx } from 'clsx';
import { ExportService } from '../../services/exportService';
import { PurchaseOrderModal } from './components/PurchaseOrderModal';
import { PurchaseOrderDetailsModal } from './components/PurchaseOrderDetailsModal';

export default function PurchasingList() {
 const [activeTab, setActiveTab] = useState<'ALL' | 'REQUESTED' | 'APPROVED' | 'COMPLETED' | 'CANCELED'>('ALL');
 const [searchTerm, setSearchTerm] = useState('');
 const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
 const [selectedOrder, setSelectedOrder] = useState<any>(null);

 const { data: orders, isLoading } = useQuery({
 queryKey: ['purchase-orders', activeTab],
 queryFn: async () => {
 const params: any = {};
 if (activeTab !== 'ALL') params.status = activeTab;
 const res = await api.get('/purchasing/orders', { params });
 return res.data;
 }
 });

 const getStatusStyle = (status: string) => {
 switch (status) {
 case 'REQUESTED': return { label: 'Solicitado', color: 'text-blue-500', bg: 'bg-blue-500/10', icon: Clock };
 case 'QUOTING': return { label: 'Cotação', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: Search };
 case 'APPROVED': return { label: 'Aprovado', color: 'text-indigo-500', bg: 'bg-indigo-500/10', icon: CheckCircle2 };
 case 'COMPLETED': return { label: 'Concluído', color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle2 };
 case 'CANCELED': return { label: 'Cancelado', color: 'text-red-500', bg: 'bg-red-500/10', icon: XCircle };
 default: return { label: status, color: 'text-gray-500', bg: 'bg-gray-500/10', icon: AlertCircle };
 }
 };

 return (
 <div className="space-y-6">
 <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div>
 <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
 <ShoppingCart className="w-10 h-10 text-blue-600" />
 Compras & Suprimentos
 </h1>
 <p className="text-muted-foreground mt-2 text-lg">Gestão de aquisições e controle de estoque</p>
 </div>
 <div className="flex gap-2">
 <button
 onClick={() => setIsCreateModalOpen(true)}
 className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-blue-600/20"
 >
 <Plus className="w-5 h-5" />
 Novo Pedido
 </button>
 <button className="flex items-center gap-2 bg-gray-100 text-gray-900 px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all">
 Fornecedores
 </button>
 </div>
 </header>

 <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
 <div className="flex gap-1 p-1 bg-gray-50 rounded-xl overflow-x-auto w-full md:w-auto">
 {(['ALL', 'REQUESTED', 'APPROVED', 'COMPLETED', 'CANCELED'] as const).map((tab) => (
 <button
 key={tab}
 onClick={() => setActiveTab(tab)}
 className={clsx(
 "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all",
 activeTab === tab ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
 )}
 >
 {tab === 'ALL' ? 'Todos' : getStatusStyle(tab).label}
 </button>
 ))}
 </div>

 <div className="relative w-full md:w-96">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
 <input
 type="text"
 placeholder="Buscar por ID, fornecedor ou item..."
 className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 />
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
 {isLoading ? (
 Array(6).fill(0).map((_, i) => (
 <GlassCard key={i} className="animate-pulse h-48">
 <div className="h-full bg-gray-200/20 rounded-xl" />
 </GlassCard>
 ))
 ) : orders?.length === 0 ? (
 <div className="col-span-full py-20 text-center">
 <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
 <p className="text-xl font-bold text-gray-400">Nenhum pedido encontrado</p>
 </div>
 ) : orders?.map((order: any) => {
 const status = getStatusStyle(order.status);
 return (
 <GlassCard key={order.id} className="group hover:border-blue-500/30 transition-all">
 <div className="flex justify-between items-start mb-4">
 <div>
 <p className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground mb-1">ID: #{order.id.split('-')[0]}</p>
 <h3 className="font-bold text-lg leading-tight flex items-center gap-2">
 {order.supplier?.name || 'Fornecedor Pendente'}
 </h3>
 </div>
 <div className={clsx("px-3 py-1 rounded-full flex items-center gap-1.5 text-[10px] font-black uppercase", status.bg, status.color)}>
 <status.icon size={12} />
 {status.label}
 </div>
 </div>

 <div className="space-y-2 mb-6">
 {order.items.slice(0, 2).map((item: any) => (
 <div key={item.id} className="flex justify-between text-sm">
 <span className="text-gray-500">{item.quantity}x {item.description}</span>
 <span className="font-mono">{item.unitPrice ? formatCurrency(item.unitPrice) : '---'}</span>
 </div>
 ))}
 {order.items.length > 2 && (
 <p className="text-xs text-blue-500 font-bold">+ {order.items.length - 2} itens</p>
 )}
 </div>

 <div className="flex items-center justify-between pt-4 border-t border-gray-100 ">
 <div>
 <p className="text-[10px] font-black uppercase text-gray-400">Solicitado por</p>
 <p className="text-sm font-bold">{order.requester.name}</p>
 </div>
 <div className="text-right">
 <p className="text-[10px] font-black uppercase text-gray-400">Total</p>
 <p className="text-lg font-black text-blue-600">{order.totalValue ? formatCurrency(order.totalValue) : '---'}</p>
 </div>
 </div>

 <button
 onClick={() => setSelectedOrder(order)}
 className="w-full mt-4 py-2 bg-gray-50 group-hover:bg-blue-600 group-hover:text-white rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
 >
 Detalhes e Ações
 <ArrowRight size={14} />
 </button>
 </GlassCard>
 );
 })}
 </div>

 <PurchaseOrderModal
 isOpen={isCreateModalOpen}
 onClose={() => setIsCreateModalOpen(false)}
 />

 <PurchaseOrderDetailsModal
 order={selectedOrder}
 isOpen={!!selectedOrder}
 onClose={() => setSelectedOrder(null)}
 />
 </div>
 );
}

