import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { stockService } from '../../services/stock.service';
import { GlassCard } from '../../components/ui/glass-card';
import { Button } from '../../components/ui/button';
import { Plus, Package, AlertTriangle, ArrowRightLeft, Search } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { StockItem } from '../../types/stock';
import { formatCurrency } from '../../lib/utils';
import { StockItemModal } from './components/StockItemModal';
import { MovementModal } from './components/MovementModal';

export function Inventory() {
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
    const [movementItem, setMovementItem] = useState<StockItem | null>(null);

    const { data: items, refetch } = useQuery({
        queryKey: ['stock'],
        queryFn: stockService.getAll
    });

    const filteredItems = items?.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const lowStockItems = items?.filter(i => i.currentQuantity <= i.minQuantity) || [];

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            Controle de Estoque
                        </h1>
                        <p className="text-gray-400">Gerencie peças, fluidos e suprimentos da frota.</p>
                    </div>
                    <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsCreateOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Item
                    </Button>
                </div>

                {/* Alerts Section */}
                {lowStockItems.length > 0 && (
                    <GlassCard className="border-l-4 border-l-yellow-500 bg-yellow-500/5">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-yellow-500/20 rounded-full">
                                <AlertTriangle className="w-6 h-6 text-yellow-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-yellow-100">Alerta de Estoque Baixo</h3>
                                <p className="text-sm text-gray-300 mb-2">
                                    Existem {lowStockItems.length} itens abaixo do nível mínimo.
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {lowStockItems.slice(0, 5).map(item => (
                                        <span key={item.id} className="px-2 py-1 bg-yellow-900/40 rounded text-xs border border-yellow-700/50">
                                            {item.name} ({item.currentQuantity} {item.unit})
                                        </span>
                                    ))}
                                    {lowStockItems.length > 5 && <span className="text-xs text-gray-400 self-center">+{lowStockItems.length - 5} outros</span>}
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                )}

                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                    <Search className="w-5 h-5 text-gray-400" />
                    <Input
                        placeholder="Buscar por nome ou SKU..."
                        className="bg-transparent border-none focus-visible:ring-0 p-0 text-lg placeholder:text-gray-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredItems?.map((item) => (
                        <GlassCard key={item.id} className="relative group hover:border-blue-500/30 transition-all">
                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setSelectedItem(item)}>
                                    <span className="sr-only">Editar</span>
                                    <Package className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="mb-4">
                                <span className="text-xs font-mono text-gray-500 bg-white/5 px-2 py-1 rounded">
                                    {item.sku || 'S/N'}
                                </span>
                                <h3 className="font-bold text-lg mt-2 truncate" title={item.name}>{item.name}</h3>
                                <p className="text-sm text-gray-400">{item.category || 'Geral'}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase">Quantidade</p>
                                    <p className={`text-xl font-bold ${item.currentQuantity <= item.minQuantity ? 'text-yellow-500' : 'text-white'}`}>
                                        {item.currentQuantity} <span className="text-sm font-normal text-gray-400">{item.unit}</span>
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase">Custo Médio</p>
                                    <p className="text-lg font-mono text-gray-300">{formatCurrency(item.averageCost)}</p>
                                </div>
                            </div>

                            <Button
                                className="w-full bg-white/10 hover:bg-white/20 border border-white/10"
                                onClick={() => setMovementItem(item)}
                            >
                                <ArrowRightLeft className="w-4 h-4 mr-2" />
                                Movimentar
                            </Button>
                        </GlassCard>
                    ))}
                </div>
            </div>

            <StockItemModal
                isOpen={isCreateOpen || !!selectedItem}
                onClose={() => { setIsCreateOpen(false); setSelectedItem(null); }}
                onSuccess={refetch}
                item={selectedItem || undefined}
            />

            {movementItem && (
                <MovementModal
                    isOpen={!!movementItem}
                    onClose={() => setMovementItem(null)}
                    onSuccess={refetch}
                    item={movementItem}
                />
            )}
        </DashboardLayout>
    );
}
