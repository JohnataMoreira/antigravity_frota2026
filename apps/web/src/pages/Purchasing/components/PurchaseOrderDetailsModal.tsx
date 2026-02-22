import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { purchasingService } from '../../../services/purchasingService';
import {
    X,
    CheckCircle2,
    XCircle,
    Truck,
    Clock,
    DollarSign,
    Package,
    AlertCircle,
    ShoppingCart
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '../../../lib/utils';
import { clsx } from 'clsx';

interface PurchaseOrderDetailsModalProps {
    order: any;
    isOpen: boolean;
    onClose: () => void;
}

export function PurchaseOrderDetailsModal({ order, isOpen, onClose }: PurchaseOrderDetailsModalProps) {
    const queryClient = useQueryClient();
    const [totalValue, setTotalValue] = useState(order?.totalValue || '');
    const [approveNotes, setApproveNotes] = useState('');

    const mutation = useMutation({
        mutationFn: ({ action, data }: { action: string, data?: any }) => {
            if (action === 'approve') return purchasingService.approveOrder(order.id, data);
            if (action === 'complete') return purchasingService.completeOrder(order.id);
            if (action === 'cancel') return purchasingService.cancelOrder(order.id);
            throw new Error(`Invalid action: ${action}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            onClose();
        }
    });

    if (!isOpen || !order) return null;

    const canApprove = order.status === 'REQUESTED' || order.status === 'QUOTING';
    const canComplete = order.status === 'APPROVED';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
                <header className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 ">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-600/20">
                            <ShoppingCart size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black">Pedido #{order.id.split('-')[0]}</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{formatDateTime(order.createdAt)}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                        <X size={24} />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Status Banner */}
                    <div className={clsx(
                        "p-4 rounded-2xl border flex items-center gap-3",
                        order.status === 'APPROVED' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" :
                            order.status === 'REQUESTED' ? "bg-blue-500/10 border-blue-500/20 text-blue-600" :
                                "bg-gray-500/10 border-gray-500/20 text-gray-600"
                    )}>
                        <AlertCircle size={20} />
                        <p className="text-sm font-bold uppercase tracking-widest">Status Atual: {order.status}</p>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-3">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Package size={14} />
                            Itens do Pedido
                        </h3>
                        {order.items.map((item: any) => (
                            <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 ">
                                <div>
                                    <p className="font-bold">{item.description}</p>
                                    <p className="text-xs text-muted-foreground">Qtd: {item.quantity}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-mono font-bold">{item.unitPrice ? formatCurrency(item.unitPrice) : '---'}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Admin Actions */}
                    {canApprove && (
                        <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 space-y-4">
                            <h3 className="text-sm font-black uppercase tracking-widest text-blue-600 flex items-center gap-2">
                                <DollarSign size={16} />
                                Aprovação Financeira
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-blue-400 ml-1">Valor Total (Cotação)</label>
                                    <input
                                        type="number"
                                        placeholder="0,00"
                                        className="w-full px-4 py-3 bg-white border border-blue-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/40 font-bold"
                                        value={totalValue}
                                        onChange={e => setTotalValue(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-blue-400 ml-1">Notas de Aprovação</label>
                                    <textarea
                                        rows={2}
                                        placeholder="Ex: Valor negociado com 5% de desconto..."
                                        className="w-full px-4 py-3 bg-white border border-blue-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/40 text-sm"
                                        value={approveNotes}
                                        onChange={e => setApproveNotes(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <footer className="p-6 border-t border-gray-100 flex flex-wrap gap-3 justify-end">
                    <button onClick={onClose} className="px-6 py-3 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-all">
                        Fechar
                    </button>

                    {canApprove && (
                        <button
                            onClick={() => mutation.mutate({ action: 'approve', data: { totalValue: Number(totalValue), notes: approveNotes } })}
                            disabled={mutation.isPending || !totalValue}
                            className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black shadow-xl shadow-blue-600/20 hover:scale-105 transition-all disabled:opacity-50"
                        >
                            Aprovar Pedido
                        </button>
                    )}

                    {canComplete && (
                        <button
                            onClick={() => mutation.mutate({ action: 'complete' })}
                            disabled={mutation.isPending}
                            className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black shadow-xl shadow-emerald-600/20 hover:scale-105 transition-all disabled:opacity-50"
                        >
                            Confirmar Recebimento & Estoque
                        </button>
                    )}

                    {!mutation.isPending && order.status !== 'CANCELED' && order.status !== 'COMPLETED' && (
                        <button
                            onClick={() => {
                                if (confirm('Deseja cancelar este pedido?')) {
                                    mutation.mutate({ action: 'cancel' });
                                }
                            }}
                            className="px-4 py-3 rounded-2xl font-bold text-red-500 hover:bg-red-50 transition-all"
                        >
                            <XCircle size={20} />
                        </button>
                    )}
                </footer>
            </div>
        </div>
    );
}
