import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { StockItem } from '../../../types/stock';
import { stockService } from '../../../services/stock.service';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    item?: StockItem;
}

export function StockItemModal({ isOpen, onClose, onSuccess, item }: Props) {
    const [loading, setLoading] = useState(false);
    const { register, handleSubmit, reset, setValue } = useForm();

    useEffect(() => {
        if (isOpen) {
            if (item) {
                setValue('name', item.name);
                setValue('description', item.description);
                setValue('category', item.category);
                setValue('sku', item.sku);
                setValue('unit', item.unit);
                setValue('minQuantity', item.minQuantity);
            } else {
                reset();
            }
        }
    }, [isOpen, item, setValue, reset]);

    const onSubmit = async (data: any) => {
        setLoading(true);
        try {
            await stockService.create({
                ...data,
                minQuantity: Number(data.minQuantity)
            });
            toast.success(item ? 'Item atualizado!' : 'Item criado com sucesso!');
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Erro ao salvar item.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{item ? 'Editar Item' : 'Novo Item de Estoque'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Nome do Item</Label>
                        <Input {...register('name', { required: true })} placeholder="Ex: Óleo de Motor 5W30" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Categoria</Label>
                            <Select onValueChange={(v) => setValue('category', v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PEÇAS">Peças</SelectItem>
                                    <SelectItem value="FLUIDOS">Fluidos</SelectItem>
                                    <SelectItem value="PNEUS">Pneus</SelectItem>
                                    <SelectItem value="FERRAMENTAS">Ferramentas</SelectItem>
                                    <SelectItem value="OUTROS">Outros</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>SKU / Código</Label>
                            <Input {...register('sku')} placeholder="CÓD-123" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Unidade</Label>
                            <Select onValueChange={(v) => setValue('unit', v)} defaultValue="UN">
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="UN">Unidade (UN)</SelectItem>
                                    <SelectItem value="LT">Litros (L)</SelectItem>
                                    <SelectItem value="KG">Quilos (KG)</SelectItem>
                                    <SelectItem value="CX">Caixa (CX)</SelectItem>
                                    <SelectItem value="JG">Jogo (JG)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Estoque Mínimo</Label>
                            <Input type="number" step="0.01" {...register('minQuantity')} placeholder="0" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Descrição (Opcional)</Label>
                        <Input {...register('description')} />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Salvar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
