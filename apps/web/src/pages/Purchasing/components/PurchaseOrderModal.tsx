import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';
import {
 X,
 Plus,
 Trash2,
 ShoppingCart,
 Package,
 User,
 Factory,
 AlertCircle,
 CheckCircle2
} from 'lucide-react';
import { formatCurrency } from '../../../lib/utils';
import { clsx } from 'clsx';

interface PurchaseOrderModalProps {
 isOpen: boolean;
 onClose: () => void;
}

export function PurchaseOrderModal({ isOpen, onClose }: PurchaseOrderModalProps) {
 const queryClient = useQueryClient();
 const [supplierId, setSupplierId] = useState('');
 const [notes, setNotes] = useState('');
 const [items, setItems] = useState<any[]>([{ description: '', quantity: 1, inventoryItemId: '' }]);

 const { data: suppliers } = useQuery({
 queryKey: ['suppliers'],
 queryFn: async () => (await api.get('/purchasing/suppliers')).data
 });

 const { data: inventory } = useQuery({
 queryKey: ['inventory'],
 queryFn: async () => (await api.get('/inventory')).data
 });

 const createMutation = useMutation({
 mutationFn: (data: any) => api.post('/purchasing/orders', data),
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
 onClose();
 // Reset form
 setSupplierId('');
 setNotes('');
 setItems([{ description: '', quantity: 1, inventoryItemId: '' }]);
 }
 });

 const handleAddItem = () => {
 setItems(prev => [...prev, { description: '', quantity: 1, inventoryItemId: '' }]);
 };

 const handleRemoveItem = (index: number) => {
 setItems(prev => prev.filter((_, i) => i !== index));
 };

 const handleUpdateItem = (index: number, field: string, value: any) => {
 setItems(prev => prev.map((item, i) => {
 if (i === index) {
 const updated = { ...item, [field]: value };
 // If picking from inventory, auto-fill description
 if (field === 'inventoryItemId' && value) {
 const invItem = inventory?.find((i: any) => i.id === value);
 if (invItem) updated.description = invItem.name;
 }
 return updated;
 }
 return item;
 }));
 };

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 const validItems = items.filter(i => i.description && i.quantity > 0);
 if (validItems.length === 0) return alert('Adicione pelo menos um item válido');

 createMutation.mutate({
 supplierId: supplierId || undefined,
 notes,
 items: validItems.map(i => ({
 description: i.description,
 quantity: Number(i.quantity),
 inventoryItemId: i.inventoryItemId || undefined
 }))
 });
 };

 if (!isOpen) return null;

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
 <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
 <header className="p-6 border-b border-gray-100 flex items-center justify-between">
 <div className="flex items-center gap-4">
 <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-600/20">
 <ShoppingCart size={24} />
 </div>
 <div>
 <h2 className="text-2xl font-black">Nova Solicitação de Compra</h2>
 <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Preencha os itens necessários para cotação</p>
 </div>
 </div>
 <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
 <X size={24} />
 </button>
 </header>

 <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
 {/* Basic Info */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-2">
 <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Fornecedor (Opcional na fase inicial)</label>
 <div className="relative">
 <Factory className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
 <select
 className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none"
 value={supplierId}
 onChange={e => setSupplierId(e.target.value)}
 >
 <option value="">Selecionar Fornecedor...</option>
 {suppliers?.map((s: any) => (
 <option key={s.id} value={s.id}>{s.name}</option>
 ))}
 </select>
 </div>
 </div>
 <div className="space-y-2">
 <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Observações Internas</label>
 <input
 type="text"
 placeholder="Ex: Urgente para o veículo ABC-1234"
 className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
 value={notes}
 onChange={e => setNotes(e.target.value)}
 />
 </div>
 </div>

 {/* Items Section */}
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
 <Package size={16} />
 Itens da Solicitação
 </h3>
 <button
 type="button"
 onClick={handleAddItem}
 className="flex items-center gap-2 text-xs font-black uppercase text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-xl transition-all"
 >
 <Plus size={14} />
 Adicionar Item
 </button>
 </div>

 <div className="space-y-3">
 {items.map((item, index) => (
 <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-4 bg-gray-50 rounded-2xl border border-gray-100 animate-in slide-in-from-right-4 duration-300">
 <div className="md:col-span-4 space-y-1">
 <label className="text-[9px] font-black uppercase text-gray-400">Referência do Estoque</label>
 <select
 className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
 value={item.inventoryItemId}
 onChange={e => handleUpdateItem(index, 'inventoryItemId', e.target.value)}
 >
 <option value="">Item não cadastrado (Manual)</option>
 {inventory?.map((inv: any) => (
 <option key={inv.id} value={inv.id}>{inv.name} - ({inv.category})</option>
 ))}
 </select>
 </div>
 <div className="md:col-span-5 space-y-1">
 <label className="text-[9px] font-black uppercase text-gray-400">Descrição/Peça</label>
 <input
 type="text"
 placeholder="Ex: Pneu 295/80 R22.5"
 className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
 value={item.description}
 onChange={e => handleUpdateItem(index, 'description', e.target.value)}
 required
 />
 </div>
 <div className="md:col-span-2 space-y-1">
 <label className="text-[9px] font-black uppercase text-gray-400">Quantidade</label>
 <input
 type="number"
 min="1"
 className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
 value={item.quantity}
 onChange={e => handleUpdateItem(index, 'quantity', e.target.value)}
 required
 />
 </div>
 <div className="md:col-span-1 flex justify-end">
 <button
 type="button"
 onClick={() => handleRemoveItem(index)}
 className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
 disabled={items.length === 1}
 >
 <Trash2 size={18} />
 </button>
 </div>
 </div>
 ))}
 </div>
 </div>
 </form>

 <footer className="p-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
 <p className="text-xs text-muted-foreground max-w-sm">
 * Esta solicitação ficará aguardando cotação de valores e aprovação do gerente financeiro.
 </p>
 <div className="flex gap-3">
 <button
 type="button"
 onClick={onClose}
 className="px-6 py-3 rounded-2xl font-bold text-gray-500 hover:bg-gray-200 transition-all"
 >
 Descartar
 </button>
 <button
 onClick={handleSubmit}
 disabled={createMutation.isPending}
 className="bg-blue-600 text-white px-10 py-3 rounded-2xl font-black shadow-xl shadow-blue-600/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
 >
 {createMutation.isPending ? 'Criando...' : 'Enviar Solicitação'}
 </button>
 </div>
 </footer>
 </div>
 </div>
 );
}

