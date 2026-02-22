import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '../../services/inventoryService';
import { GlassCard } from '../../components/ui/Cards';
import {
    Package,
    Plus,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Filter,
    MoreVertical,
    AlertTriangle,
    History,
    ShoppingCart,
    Archive,
    X,
    Check
} from 'lucide-react';
import { useState } from 'react';
import { formatCurrency } from '../../lib/utils';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export function InventoryList() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [movementType, setMovementType] = useState<'IN' | 'OUT'>('IN');
    const [showOnlyLowStock, setShowOnlyLowStock] = useState(false);

    const { data: inventory = [], isLoading } = useQuery({
        queryKey: ['inventory'],
        queryFn: inventoryService.getAll
    });

    const createMutation = useMutation({
        mutationFn: inventoryService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            setIsCreateModalOpen(false);
        }
    });

    const moveMutation = useMutation({
        mutationFn: (data: any) => inventoryService.registerMovement(selectedItem.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            setIsMoveModalOpen(false);
            setSelectedItem(null);
        }
    });

    const categories = ['ALL', ...new Set(inventory.map((item: any) => item.category))] as string[];

    const filteredInventory = inventory.filter((item: any) => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.sku?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
        const matchesLowStock = !showOnlyLowStock || item.currentQuantity <= item.minQuantity;
        return matchesSearch && matchesCategory && matchesLowStock;
    });

    const stats = {
        totalItems: inventory.length,
        lowStock: inventory.filter((item: any) => item.currentQuantity <= item.minQuantity).length,
        totalValue: inventory.reduce((acc: number, item: any) => acc + (item.price || 0) * item.currentQuantity, 0)
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight gradient-text">Gestão de Estoque</h1>
                    <p className="text-muted-foreground mt-2 font-medium">Controle de peças, lubrificantes e suprimentos</p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={() => setIsCreateModalOpen(true)} className="rounded-xl flex items-center gap-2">
                        <Plus size={18} /> Novo Item
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard className="flex items-center gap-4 py-6">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                        <Archive size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Itens no Catálogo</p>
                        <p className="text-2xl font-black">{stats.totalItems}</p>
                    </div>
                </GlassCard>

                <GlassCard
                    className={`flex items-center gap-4 py-6 cursor-pointer transition-all ${showOnlyLowStock ? 'ring-2 ring-amber-500 bg-amber-50/50' : 'hover:bg-gray-50'}`}
                    onClick={() => setShowOnlyLowStock(!showOnlyLowStock)}
                >
                    <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Estoque Baixo</p>
                        <p className="text-2xl font-black text-amber-500">{stats.lowStock}</p>
                    </div>
                </GlassCard>

                <GlassCard className="flex items-center gap-4 py-6">
                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
                        <ShoppingCart size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Valor em Estoque</p>
                        <p className="text-2xl font-black text-emerald-500">{formatCurrency(stats.totalValue)}</p>
                    </div>
                </GlassCard>
            </div>

            {/* Filters */}
            <GlassCard className="py-4">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou SKU..."
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-primary/50 outline-none transition-all font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 p-1 bg-gray-100 rounded-xl overflow-x-auto max-w-full no-scrollbar">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setCategoryFilter(cat)}
                                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${categoryFilter === cat ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                {cat === 'ALL' ? 'Todos' : cat}
                            </button>
                        ))}
                    </div>
                </div>
            </GlassCard>

            {/* Inventory List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredInventory.map((item: any) => (
                    <GlassCard key={item.id} className="group hover:shadow-xl transition-all duration-300 flex flex-col h-full border-gray-100 ">
                        <div className="flex justify-between items-start mb-4">
                            <Badge variant="default" className="text-[10px] font-black uppercase tracking-tighter">
                                {item.category}
                            </Badge>
                            <button className="text-muted-foreground hover:text-primary transition-colors">
                                <MoreVertical size={18} />
                            </button>
                        </div>

                        <div className="flex-1">
                            <h3 className="text-xl font-black text-gray-900 leading-tight mb-1">{item.name}</h3>
                            <p className="text-xs font-bold text-muted-foreground uppercase mb-4 tracking-widest">SKU: {item.sku || 'N/A'}</p>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="p-3 bg-gray-50 rounded-2xl">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase opacity-50 mb-1">Saldo</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className={`text-2xl font-black ${item.currentQuantity <= item.minQuantity ? 'text-red-500' : 'text-primary'}`}>
                                            {item.currentQuantity}
                                        </span>
                                        <span className="text-xs font-bold text-muted-foreground">{item.unit}</span>
                                    </div>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-2xl">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground opacity-50 mb-1">Custo Médio</p>
                                    <p className="text-sm font-black">{formatCurrency(item.price)}</p>
                                </div>
                            </div>

                            {item.currentQuantity <= item.minQuantity && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-600 rounded-xl mb-4 text-xs font-bold animate-pulse">
                                    <AlertTriangle size={14} />
                                    Estoque abaixo do mínimo ({item.minQuantity})
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2 mt-2">
                            <button
                                onClick={() => {
                                    setSelectedItem(item);
                                    setMovementType('IN');
                                    setIsMoveModalOpen(true);
                                }}
                                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/10"
                            >
                                <ArrowUpRight size={18} /> Entrada
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedItem(item);
                                    setMovementType('OUT');
                                    setIsMoveModalOpen(true);
                                }}
                                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/10"
                            >
                                <ArrowDownRight size={18} /> Saída
                            </button>
                            <button title="Histórico" className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all">
                                <History size={18} />
                            </button>
                        </div>
                    </GlassCard>
                ))}

                {filteredInventory.length === 0 && (
                    <div className="col-span-full py-20 text-center">
                        <Package className="w-16 h-16 text-muted-foreground opacity-20 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-muted-foreground">Nenhum item encontrado</h3>
                        <p className="text-sm text-muted-foreground mt-2">Tente ajustar seus filtros ou cadastre um novo item.</p>
                    </div>
                )}
            </div>

            {/* Create Item Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <GlassCard className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                                <Package className="text-primary" /> Novo Item
                            </h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            createMutation.mutate({
                                name: formData.get('name'),
                                sku: formData.get('sku'),
                                category: formData.get('category'),
                                unit: formData.get('unit'),
                                minQuantity: Number(formData.get('minQuantity')),
                                price: Number(formData.get('price'))
                            });
                        }} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase text-muted-foreground mb-1 block tracking-widest">Nome do Item</label>
                                <input name="name" required className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 font-medium" placeholder="Ex: Filtro de Óleo PSL55" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-muted-foreground mb-1 block tracking-widest">SKU / Cód.</label>
                                    <input name="sku" className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 font-medium" placeholder="Opcional" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-muted-foreground mb-1 block tracking-widest">Categoria</label>
                                    <select name="category" required className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 font-medium">
                                        <option value="FILTROS">Filtros</option>
                                        <option value="LUBRIFICANTES">Lubrificantes</option>
                                        <option value="PNEUS">Pneus</option>
                                        <option value="PECAS">Peças</option>
                                        <option value="LIMPEZA">Limpeza</option>
                                        <option value="OUTROS">Outros</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-muted-foreground mb-1 block tracking-widest">Unidade</label>
                                    <input name="unit" defaultValue="UN" required className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 font-medium" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-muted-foreground mb-1 block tracking-widest">Mínimo</label>
                                    <input name="minQuantity" type="number" defaultValue="0" required className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 font-medium" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-muted-foreground mb-1 block tracking-widest">Preço Est.</label>
                                    <input name="price" type="number" step="0.01" className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 font-medium" />
                                </div>
                            </div>
                            <Button type="submit" className="w-full py-4 rounded-xl font-black uppercase tracking-widest text-sm mt-4" loading={createMutation.isPending}>
                                <Plus size={18} className="mr-2" /> Salvar Item
                            </Button>
                        </form>
                    </GlassCard>
                </div>
            )}

            {/* Movement Modal */}
            {isMoveModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <GlassCard className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                                {movementType === 'IN' ? <ArrowUpRight className="text-emerald-500" /> : <ArrowDownRight className="text-amber-500" />}
                                Registrar {movementType === 'IN' ? 'Entrada' : 'Saída'}
                            </h2>
                            <button onClick={() => setIsMoveModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-2xl mb-6">
                            <p className="text-[10px] font-black text-muted-foreground uppercase mb-1 opacity-50">Item Selecionado</p>
                            <p className="font-bold text-gray-900 ">{selectedItem?.name}</p>
                            <p className="text-xs text-muted-foreground">Saldo atual: {selectedItem?.currentQuantity} {selectedItem?.unit}</p>
                        </div>

                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            moveMutation.mutate({
                                type: movementType,
                                quantity: Number(formData.get('quantity')),
                                reason: formData.get('reason'),
                                notes: formData.get('notes')
                            });
                        }} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-muted-foreground mb-1 block tracking-widest">Quantidade</label>
                                    <input name="quantity" type="number" step="0.01" required autoFocus className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 font-medium" placeholder="0.00" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-muted-foreground mb-1 block tracking-widest">Motivo</label>
                                    <select name="reason" required className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 font-medium">
                                        <option value="PURCHASE">Compra</option>
                                        <option value="MAINTENANCE">Manutenção</option>
                                        <option value="ADJUSTMENT">Ajuste de Saldo</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-muted-foreground mb-1 block tracking-widest">Observações</label>
                                <textarea name="notes" rows={3} className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 font-medium resize-none" placeholder="Opcional. Ex: Nota fiscal, veículo utilizado, etc."></textarea>
                            </div>
                            <Button
                                type="submit"
                                className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-sm mt-4 ${movementType === 'IN' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-amber-500 hover:bg-amber-600'}`}
                                loading={moveMutation.isPending}
                            >
                                <Check size={18} className="mr-2" /> Confirmar {movementType === 'IN' ? 'Entrada' : 'Saída'}
                            </Button>
                        </form>
                    </GlassCard>
                </div>
            )}
        </div>
    );
}

