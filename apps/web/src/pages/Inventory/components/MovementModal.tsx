import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { StockItem } from '../../../types/stock';
import { stockService } from '../../../services/stock.service';
import { Loader2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    item: StockItem;
}

export function MovementModal({ isOpen, onClose, onSuccess, item }: Props) {
    const [loading, setLoading] = useState(false);
    const [type, setType] = useState<'IN' | 'OUT'>('OUT'); // Default to OUT (usage)
    const { register, handleSubmit, reset, setValue, watch } = useForm();
    const quantity = watch('quantity');

    const onSubmit = async (data: any) => {
        setLoading(true);
        try {
            await stockService.registerMovement({
                stockItemId: item.id,
                type,
                quantity: Number(data.quantity),
                unitCost: data.unitCost ? Number(data.unitCost) : undefined,
                reason: data.reason
            });
            toast.success('Movimentação registrada!');
            onSuccess();
            onClose();
            reset();
        } catch (error) {
            console.error(error);
            toast.error('Erro ao registrar movimentação.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {type === 'IN' ? <ArrowUpCircle className="text-green-500" /> : <ArrowDownCircle className="text-red-500" />}
                        Registrar {type === 'IN' ? 'Entrada' : 'Saída'}: {item.name}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex gap-2 mb-4">
                    <Button
                        type="button"
                        variant={type === 'OUT' ? 'default' : 'outline'}
                        className={type === 'OUT' ? 'bg-red-600 hover:bg-red-700' : ''}
                        onClick={() => setType('OUT')}
                    >
                        Saída (Uso)
                    </Button>
                    <Button
                        type="button"
                        variant={type === 'IN' ? 'default' : 'outline'}
                        className={type === 'IN' ? 'bg-green-600 hover:bg-green-700' : ''}
                        onClick={() => setType('IN')}
                    >
                        Entrada (Compra/Devolução)
                    </Button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Quantidade ({item.unit})</Label>
                            <Input
                                type="number"
                                step="any"
                                {...register('quantity', { required: true, min: 0.01 })}
                                placeholder="0.00"
                            />
                        </div>
                        {type === 'IN' && (
                            <div className="space-y-2">
                                <Label>Custo Unitário (R$)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    {...register('unitCost')}
                                    placeholder="0.00"
                                />
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Motivo / Observação</Label>
                        <Select onValueChange={(v) => setValue('reason', v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o motivo" />
                            </SelectTrigger>
                            <SelectContent>
                                {type === 'OUT' ? (
                                    <>
                                        <SelectItem value="MANUTENCAO">Manutenção de Veículo</SelectItem>
                                        <SelectItem value="PERDA">Perda / Avaria</SelectItem>
                                        <SelectItem value="AJUSTE">Ajuste de Estoque</SelectItem>
                                        <SelectItem value="USO_INTERNO">Uso Interno</SelectItem>
                                    </>
                                ) : (
                                    <>
                                        <SelectItem value="COMPRA">Compra</SelectItem>
                                        <SelectItem value="DEVOLUCAO">Devolução</SelectItem>
                                        <SelectItem value="AJUSTE">Ajuste de Estoque</SelectItem>
                                    </>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {type === 'OUT' && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-sm text-red-200">
                            Novo saldo será: <b>{(item.currentQuantity - (Number(quantity) || 0)).toFixed(2)} {item.unit}</b>
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Confirmar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
