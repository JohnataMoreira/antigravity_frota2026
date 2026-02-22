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
                    <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3 uppercase bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent">
                        <div className="p-2 bg-primary rounded-2xl text-primary-foreground shadow-lg shadow-primary/20 shrink-0">
                            <Package size={32} />
                        </div>
                        Gestão de Estoque
                    </h1>
                    <p className="text-muted-foreground/60 font-black uppercase tracking-[0.2em] mt-2 text-[10px]">Controle de peças, lubrificantes e suprimentos da frota</p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={() => setIsCreateModalOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl px-8 py-3.5 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 flex items-center gap-2 transition-all active:scale-95">
                        <Plus size={18} /> Novo Item
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card/40 backdrop-blur-sm border border-border/50 p-6 rounded-[32px] flex items-center gap-5 shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all group">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <Archive size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-[0.2em] mb-1">Itens no Catálogo</p>
                        <p className="text-3xl font-black text-foreground tracking-tighter">{stats.totalItems}</p>
                    </div>
                </div>

                <div
                    className={`bg-card/40 backdrop-blur-sm border-2 p-6 rounded-[32px] flex items-center gap-5 shadow-sm transition-all group cursor-pointer ${showOnlyLowStock ? 'border-amber-500 bg-amber-500/5 shadow-amber-500/10' : 'border-border/50 hover:shadow-2xl hover:shadow-amber-500/5'}`}
                    onClick={() => setShowOnlyLowStock(!showOnlyLowStock)}
                >
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                        <AlertTriangle size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-[0.2em] mb-1">Estoque Baixo</p>
                        <p className="text-3xl font-black text-amber-500 tracking-tighter">{stats.lowStock}</p>
                    </div>
                </div>

                <div className="bg-card/40 backdrop-blur-sm border border-border/50 p-6 rounded-[32px] flex items-center gap-5 shadow-sm hover:shadow-2xl hover:shadow-emerald-500/5 transition-all group">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                        <ShoppingCart size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-[0.2em] mb-1">Valor em Estoque</p>
                        <p className="text-3xl font-black text-emerald-500 tracking-tighter">{formatCurrency(stats.totalValue)}</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-card/30 backdrop-blur-sm border border-border/50 p-6 rounded-[32px] flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 group w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou SKU..."
                            className="w-full pl-12 pr-4 py-3 bg-muted/30 border border-border/50 rounded-2xl text-[10px] font-black uppercase tracking-tight focus:ring-2 focus:ring-primary/50 outline-none transition-all text-foreground placeholder:text-muted-foreground/20"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 p-1 bg-muted/50 border border-border/50 rounded-xl overflow-x-auto max-w-full no-scrollbar">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setCategoryFilter(cat)}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${categoryFilter === cat ? 'bg-background shadow-md text-primary' : 'text-muted-foreground/40 hover:text-foreground hover:bg-muted/50'}`}
                            >
                                {cat === 'ALL' ? 'Todos' : cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Inventory List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredInventory.map((item: any) => (
                    <div key={item.id} className="group bg-card/40 backdrop-blur-sm border border-border/50 hover:border-primary/30 p-6 rounded-[32px] transition-all flex flex-col h-full shadow-sm hover:shadow-2xl hover:shadow-primary/5">
                        <div className="flex justify-between items-start mb-6">
                            <Badge variant="silver" className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 border border-border/50">
                                {item.category}
                            </Badge>
                            <button className="text-muted-foreground/40 hover:text-primary transition-colors p-2 hover:bg-muted rounded-full">
                                <MoreVertical size={18} />
                            </button>
                        </div>

                        <div className="flex-1">
                            <h3 className="text-2xl font-black text-foreground uppercase tracking-tight leading-tight group-hover:text-primary transition-colors mb-2">{item.name}</h3>
                            <p className="text-[10px] font-black text-muted-foreground/40 uppercase mb-6 tracking-[0.2em]">SKU ID: {item.sku || 'NÃO DEFINIDO'}</p>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="p-4 bg-muted/30 border border-border/40 rounded-2xl group/stat hover:bg-muted/50 transition-all">
                                    <p className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest mb-1.5">Saldo Un.</p>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className={`text-3xl font-black tracking-tighter ${item.currentQuantity <= item.minQuantity ? 'text-amber-500' : 'text-primary'}`}>
                                            {item.currentQuantity}
                                        </span>
                                        <span className="text-[10px] font-black text-muted-foreground/20 uppercase tracking-widest">{item.unit}</span>
                                    </div>
                                </div>
                                <div className="p-4 bg-muted/30 border border-border/40 rounded-2xl group/stat hover:bg-muted/50 transition-all">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground/30 tracking-widest mb-1.5">Custo Médio</p>
                                    <p className="text-lg font-black text-foreground tracking-tighter">{formatCurrency(item.price)}</p>
                                </div>
                            </div>

                            {item.currentQuantity <= item.minQuantity && (
                                <div className="flex items-center gap-3 px-4 py-3 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-2xl mb-6 text-[10px] font-black uppercase tracking-widest animate-pulse shadow-lg shadow-amber-500/5">
                                    <AlertTriangle size={16} />
                                    Abaixo do limite ({item.minQuantity})
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2.5 mt-auto">
                            <button
                                onClick={() => {
                                    setSelectedItem(item);
                                    setMovementType('IN');
                                    setIsMoveModalOpen(true);
                                }}
                                className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 active:scale-95"
                            >
                                <ArrowUpRight size={16} /> Entrada
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedItem(item);
                                    setMovementType('OUT');
                                    setIsMoveModalOpen(true);
                                }}
                                className="flex-1 py-4 bg-amber-500 text-white rounded-2xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 hover:bg-amber-600 active:scale-95"
                            >
                                <ArrowDownRight size={16} /> Saída
                            </button>
                            <button title="Histórico" className="p-4 bg-muted hover:bg-muted/80 text-muted-foreground/60 hover:text-primary rounded-2xl transition-all border border-border/50 active:scale-95">
                                <History size={18} />
                            </button>
                        </div>
                    </div>
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsCreateModalOpen(false)} />
                    <div className="w-full max-w-lg relative z-10 animate-in zoom-in-95 duration-200 !p-0 overflow-hidden border border-border/50 shadow-2xl bg-card rounded-[40px]">
                        <div className="p-8 bg-gradient-to-r from-primary to-amber-500 text-white flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                                    <Package size={28} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">Novo Recurso</h2>
                                    <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mt-1">Catalogar item no inventário</p>
                                </div>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                createMutation.mutate({
                                    name: formData.get('name') as string,
                                    sku: formData.get('sku') as string,
                                    category: formData.get('category') as string,
                                    unit: formData.get('unit') as string,
                                    minQuantity: Number(formData.get('minQuantity')),
                                    price: Number(formData.get('price'))
                                });
                            }} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground/40 block tracking-widest px-1">Nome do Item</label>
                                    <input name="name" required className="w-full px-5 py-4 bg-muted/30 border border-border/50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 font-black uppercase text-xs tracking-tight text-foreground placeholder:text-muted-foreground/10" placeholder="Ex: Filtro de Óleo PSL55" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground/40 block tracking-widest px-1">SKU / ID Interno</label>
                                        <input name="sku" className="w-full px-5 py-4 bg-muted/30 border border-border/50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 font-black uppercase text-xs tracking-tight text-foreground placeholder:text-muted-foreground/10" placeholder="Opcional" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground/40 block tracking-widest px-1">Categoria</label>
                                        <select name="category" required className="w-full px-5 py-4 bg-muted/30 border border-border/50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 font-black uppercase text-xs tracking-tight text-foreground appearance-none">
                                            <option value="FILTROS">Filtros</option>
                                            <option value="LUBRIFICANTES">Lubrificantes</option>
                                            <option value="PNEUS">Pneus</option>
                                            <option value="PECAS">Peças</option>
                                            <option value="LIMPEZA">Limpeza</option>
                                            <option value="OUTROS">Outros</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground/40 block tracking-widest px-1">Unidade</label>
                                        <input name="unit" defaultValue="UN" required className="w-full px-5 py-4 bg-muted/30 border border-border/50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 font-black uppercase text-xs tracking-tight text-foreground" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground/40 block tracking-widest px-1">Mínimo</label>
                                        <input name="minQuantity" type="number" defaultValue="0" required className="w-full px-5 py-4 bg-muted/30 border border-border/50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 font-black uppercase text-xs tracking-tight text-foreground" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground/40 block tracking-widest px-1">Preço Estimates</label>
                                        <input name="price" type="number" step="0.01" className="w-full px-5 py-4 bg-muted/30 border border-border/50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 font-black uppercase text-xs tracking-tight text-foreground" />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full py-5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-[24px] font-black uppercase tracking-[0.2em] text-[10px] mt-6 shadow-2xl shadow-primary/20 transition-all active:scale-95" loading={createMutation.isPending}>
                                    <Check size={18} className="mr-2" /> Efetuar Cadastro
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Movement Modal */}
            {isMoveModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsMoveModalOpen(false)} />
                    <div className="w-full max-w-lg relative z-10 animate-in zoom-in-95 duration-200 !p-0 overflow-hidden border border-border/50 shadow-2xl bg-card rounded-[40px]">
                        <div className={`p-8 flex justify-between items-center text-white ${movementType === 'IN' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'}`}>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                                    {movementType === 'IN' ? <ArrowUpRight size={28} /> : <ArrowDownRight size={28} />}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">Registrar {movementType === 'IN' ? 'Entrada' : 'Saída'}</h2>
                                    <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mt-1">Atualização manual de saldo</p>
                                </div>
                            </div>
                            <button onClick={() => setIsMoveModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="p-5 bg-muted/40 border-2 border-dashed border-border/40 rounded-3xl group transition-all">
                                <p className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest mb-1.5 px-1">Alvo da Operação</p>
                                <p className="font-black text-xl text-foreground uppercase tracking-tight leading-none mb-2">{selectedItem?.name}</p>
                                <div className="flex items-center gap-2">
                                    <Badge variant="silver" className="text-[8px] font-black px-2 py-0.5">ESTOQUE ATUAL: {selectedItem?.currentQuantity} {selectedItem?.unit}</Badge>
                                </div>
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
                            }} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground/40 block tracking-widest px-1">Quantidade</label>
                                        <input name="quantity" type="number" step="0.01" required autoFocus className="w-full px-5 py-4 bg-muted/30 border border-border/50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 font-black uppercase text-xs tracking-tight text-foreground placeholder:text-muted-foreground/10" placeholder="0.00" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground/40 block tracking-widest px-1">Motivo / Causa</label>
                                        <select name="reason" required className="w-full px-5 py-4 bg-muted/30 border border-border/50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 font-black uppercase text-xs tracking-tight text-foreground appearance-none">
                                            <option value="PURCHASE">Compra / Fornecedor</option>
                                            <option value="MAINTENANCE">Aplicação em Manutenção</option>
                                            <option value="ADJUSTMENT">Ajuste de Saldo / Inventário</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground/40 block tracking-widest px-1">Notas Suplementares</label>
                                    <textarea name="notes" rows={3} className="w-full px-5 py-4 bg-muted/30 border border-border/50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 font-black uppercase text-xs tracking-tight text-foreground placeholder:text-muted-foreground/10 resize-none" placeholder="Opcional. Ex: ID da NF, placa do veículo, etc."></textarea>
                                </div>
                                <Button
                                    type="submit"
                                    className={`w-full py-5 rounded-[24px] font-black uppercase tracking-[0.2em] text-[10px] mt-6 shadow-2xl transition-all active:scale-95 ${movementType === 'IN' ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20' : 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/20'}`}
                                    loading={moveMutation.isPending}
                                >
                                    <Check size={18} className="mr-2" /> Confirmar Operação
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
