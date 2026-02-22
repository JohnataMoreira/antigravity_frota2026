import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';
import { GlassCard } from '../../../components/ui/Cards';
import { X, Play, MapPin, Gauge, CheckCircle2, AlertTriangle, ArrowRight, ClipboardCheck, Camera, Trash2, Image as ImageIcon } from 'lucide-react';
import { RouteSelector } from '../../../components/RouteSelector';
import { formatKm } from '../../../lib/utils';
import { db } from '../../../lib/offline-db';
import { complianceService } from '../../../services/complianceService';
import { useQuery } from '@tanstack/react-query';

interface StartJourneyModalProps {
    isOpen: boolean;
    onClose: () => void;
    vehicle: any;
}

const DEFAULT_CHECKLIST = [
    'Luzes e Faróis',
    'Freios e Suspensão',
    'Pneus e Rodas',
    'Níveis de Óleo/Água',
    'Limpeza Interna/Externa',
    'Equipamentos de Segurança (Triângulo/Macaco)'
];

export function StartJourneyModal({ isOpen, onClose, vehicle }: StartJourneyModalProps) {
    const queryClient = useQueryClient();
    const [step, setStep] = useState(1);
    const [startKm, setStartKm] = useState(vehicle?.currentKm || 0);
    const [plannedRoute, setPlannedRoute] = useState<[number, number][] | null>(null);
    const [destinationName, setDestinationName] = useState('');
    const [checklistItems, setChecklistItems] = useState(
        DEFAULT_CHECKLIST.map(name => ({ itemName: name, status: 'OK' }))
    );
    const [photos, setPhotos] = useState<string[]>([]);

    const { data: complianceAlerts } = useQuery({
        queryKey: ['compliance-alerts', vehicle?.id],
        queryFn: () => complianceService.getAlerts(vehicle?.id),
        enabled: !!vehicle?.id
    });

    const hasExpiredDocs = complianceAlerts?.some((a: any) => a.isExpired);

    const startMutation = useMutation({
        mutationFn: async (data: any) => {
            if (!navigator.onLine) {
                // Save to IndexedDB if offline
                await db.pendingChecklists.add({
                    journeyId: `OFFLINE_${Date.now()}`,
                    items: data.checklistItems,
                    rating: 5,
                    timestamp: Date.now(),
                    synced: false,
                    ...data // Also save the rest of the journey data to sync later
                } as any);
                return { offline: true };
            }
            return api.post('/journeys/start', data);
        },
        onSuccess: (res: any) => {
            if (res.offline) {
                alert('Jornada iniciada em MODO OFFLINE. Os dados serão sincronizados quando a internet retornar.');
            }
            queryClient.invalidateQueries({ queryKey: ['journeys'] });
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
            onClose();
        }
    });

    if (!isOpen) return null;

    const handleStart = () => {
        startMutation.mutate({
            vehicleId: vehicle.id,
            startKm,
            plannedRoute,
            destinationName,
            checklistItems,
            photos // Sending base64 photos
        });
    };

    const handleTakePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotos(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        }
    };

    const removePhoto = (index: number) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const toggleItemStatus = (name: string) => {
        setChecklistItems(prev => prev.map(item =>
            item.itemName === name
                ? { ...item, status: item.status === 'OK' ? 'PROBLEM' : 'OK' }
                : item
        ));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <GlassCard className="w-full max-w-2xl relative z-10 animate-in zoom-in-95 duration-200 !p-0 overflow-hidden border shadow-2xl">
                <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <Play size={24} fill="white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tight">Iniciar Jornada</h2>
                            <p className="text-xs font-bold opacity-80 uppercase tracking-widest">{vehicle.plate} • {vehicle.model}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {step === 1 && (
                        <>
                            {/* Compliance Warning (Soft Block) */}
                            {hasExpiredDocs && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
                                    <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                                        <AlertTriangle size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-red-700 text-sm uppercase tracking-tight">Alerta de Conformidade</h3>
                                        <p className="text-xs text-red-600 font-medium">Este veículo possui documentos vencidos ou irregularidades. A jornada pode ser iniciada, mas o registro de auditoria será gerado.</p>
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {complianceAlerts?.filter((a: any) => a.isExpired).map((a: any) => (
                                                <span key={a.name} className="px-2 py-0.5 bg-red-600 text-white text-[9px] font-black rounded uppercase">{a.name}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 1: KM Info */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                                    <Gauge size={16} />
                                    <span className="text-xs font-black uppercase tracking-widest">Informações de Saída</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-gray-50 p-4 rounded-2xl border ">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Km Atual no Painel</label>
                                        <input
                                            type="number"
                                            className="bg-transparent text-xl font-black w-full outline-none"
                                            value={startKm}
                                            onChange={(e) => setStartKm(parseInt(e.target.value))}
                                        />
                                        <p className="text-[10px] text-muted-foreground mt-2">Relatado anteriormente: {formatKm(vehicle.currentKm)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Step 2: Route Selection */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                                    <MapPin size={16} />
                                    <span className="text-xs font-black uppercase tracking-widest">Definição de Destino (OSRM)</span>
                                </div>
                                <RouteSelector onRouteSelected={(route, name) => {
                                    setPlannedRoute(route);
                                    setDestinationName(name);
                                }} />

                                {plannedRoute && (
                                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-2">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                                                <CheckCircle2 size={20} />
                                            </div>
                                            <div>
                                                <div className="text-xs font-black uppercase tracking-tighter text-emerald-600">Rota Planejada com Sucesso</div>
                                                <div className="text-[10px] font-bold text-muted-foreground truncate max-w-[300px]">{destinationName}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xl font-black text-emerald-600 leading-none">{(plannedRoute.length * 0.1).toFixed(1)} <span className="text-xs font-bold">km</span></div>
                                            <div className="text-[9px] font-black text-muted-foreground uppercase">Estimativa OSRM</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center gap-2 text-muted-foreground mb-4">
                                <ClipboardCheck size={16} />
                                <span className="text-xs font-black uppercase tracking-widest">Inspeção Obrigatória (Check-out)</span>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                {checklistItems.map((item) => (
                                    <div
                                        key={item.itemName}
                                        onClick={() => toggleItemStatus(item.itemName)}
                                        className={`
 flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all
 ${item.status === 'OK'
                                                ? 'bg-emerald-50/50 border-emerald-100 text-emerald-700'
                                                : 'bg-amber-50/50 border-amber-100 text-amber-700'}
 `}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-xl ${item.status === 'OK' ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                                                {item.status === 'OK' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                                            </div>
                                            <span className="font-bold text-sm uppercase tracking-tight">{item.itemName}</span>
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest">
                                            {item.status === 'OK' ? 'Conforme' : 'Atenção'}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Photos Section */}
                            <div className="space-y-4 pt-4 border-t border-gray-100">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Camera size={16} />
                                        <span className="text-xs font-black uppercase tracking-widest">Evidências Fotográficas</span>
                                    </div>
                                    <label className="cursor-pointer bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-blue-100 transition-all">
                                        <Camera size={14} />
                                        Tirar Foto
                                        <input
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            className="hidden"
                                            onChange={handleTakePhoto}
                                        />
                                    </label>
                                </div>

                                <div className="grid grid-cols-4 gap-3">
                                    {photos.map((photo, index) => (
                                        <div key={index} className="relative aspect-square rounded-2xl overflow-hidden group border border-gray-100 shadow-sm">
                                            <img src={photo} alt="Evidência" className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => removePhoto(index)}
                                                className="absolute top-1 right-1 p-1.5 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                    {photos.length === 0 && (
                                        <div className="col-span-4 py-8 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center text-gray-300">
                                            <ImageIcon size={32} />
                                            <p className="text-[10px] font-black uppercase mt-2">Nenhuma foto anexada</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-gray-50 border-t flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 font-black text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"
                    >
                        Cancelar
                    </button>
                    {step === 1 ? (
                        <button
                            disabled={!startKm || !plannedRoute}
                            onClick={() => setStep(2)}
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 flex items-center gap-2 transition-all active:scale-95"
                        >
                            Verificar Veículo
                            <ArrowRight size={18} />
                        </button>
                    ) : (
                        <button
                            disabled={startMutation.isPending}
                            onClick={handleStart}
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 flex items-center gap-2 transition-all active:scale-95"
                        >
                            {startMutation.isPending ? 'Iniciando...' : 'Iniciar Jornada'}
                            <Play size={18} />
                        </button>
                    )}
                </div>
            </GlassCard>
        </div>
    );
}

