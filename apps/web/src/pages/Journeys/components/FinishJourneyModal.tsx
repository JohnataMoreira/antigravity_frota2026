import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';
import { GlassCard } from '../../../components/ui/Cards';
import { X, Flag, Gauge, CheckCircle2, AlertTriangle, ArrowRight, ClipboardCheck, Camera, PenTool } from 'lucide-react';
import { formatKm } from '../../../lib/utils';
import { db } from '../../../lib/offline-db';
import { CameraCapture } from '../../../components/ui/CameraCapture';
import { SignaturePad } from '../../../components/ui/SignaturePad';

interface FinishJourneyModalProps {
    isOpen: boolean;
    onClose: () => void;
    journey: any;
}

const DEFAULT_CHECKLIST = [
    'Integridade da Lataria',
    'Limpeza da Cabine',
    'Funcionamento do Rastreador',
    'Nível de Combustível (Relatado)',
    'Ocorrências de Trajeto'
];

export function FinishJourneyModal({ isOpen, onClose, journey }: FinishJourneyModalProps) {
    const queryClient = useQueryClient();
    const [step, setStep] = useState(1);
    const [endKm, setEndKm] = useState(journey?.startKm || 0);
    const [checklistItems, setChecklistItems] = useState(
        DEFAULT_CHECKLIST.map(name => ({ itemName: name, status: 'OK', photo: null as File | null }))
    );
    const [signature, setSignature] = useState<File | null>(null);
    const [activeCameraItem, setActiveCameraItem] = useState<string | null>(null);
    const [isSignatureOpen, setIsSignatureOpen] = useState(false);

    const endMutation = useMutation({
        mutationFn: async (data: any) => {
            if (!navigator.onLine) {
                await db.pendingChecklists.add({
                    journeyId: journey.id,
                    items: data.checklistItems,
                    rating: 5,
                    timestamp: Date.now(),
                    synced: false,
                    type: 'CHECKIN',
                    ...data
                } as any);
                return { offline: true };
            }
            return api.patch(`/journeys/${journey.id}/end`, data);
        },
        onSuccess: (res: any) => {
            if (res.offline) {
                alert('Jornada encerrada em MODO OFFLINE. A sincronização ocorrerá automaticamente.');
            }
            queryClient.invalidateQueries({ queryKey: ['journeys'] });
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
            onClose();
        }
    });

    if (!isOpen) return null;

    const handleEnd = async () => {
        // First finish the journey
        const res = await endMutation.mutateAsync({
            endKm,
            checklistItems: checklistItems.map(({ itemName, status }) => ({ itemName, status }))
        });

        const journeyRes = (res as any).data;
        const checklistId = journeyRes?.checklists?.find((c: any) => c.type === 'CHECKIN')?.id;

        // Upload photos for problem items
        for (const item of checklistItems) {
            if (item.photo && checklistId) {
                const formData = new FormData();
                formData.append('file', item.photo);
                formData.append('type', 'IMAGE');
                formData.append('checklistId', checklistId);
                await api.post('/attachments/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
        }

        // Upload signature
        if (signature && journey.id) {
            const formData = new FormData();
            formData.append('file', signature);
            formData.append('type', 'SIGNATURE');
            formData.append('journeyId', journey.id);
            await api.post('/attachments/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        }
    };

    const handlePhotoCapture = (file: File) => {
        setChecklistItems(prev => prev.map(item =>
            item.itemName === activeCameraItem ? { ...item, photo: file } : item
        ));
        setActiveCameraItem(null);
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

            <GlassCard className="w-full max-w-2xl relative z-10 animate-in zoom-in-95 duration-200 !p-0 overflow-hidden border border-border/50 shadow-2xl bg-card">
                <div className="p-6 bg-gradient-to-r from-primary to-purple-600 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <Flag size={24} fill="white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tight">Finalizar Jornada</h2>
                            <p className="text-xs font-bold opacity-80 uppercase tracking-widest">Encerrando Check-in do Veículo</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar bg-card">
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-muted-foreground/60 mb-4">
                                <Gauge size={16} />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Odômetro Final</span>
                            </div>
                            <div className="bg-muted/30 p-6 rounded-3xl border border-border/50">
                                <label className="block text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest mb-2">Km de Chegada</label>
                                <input
                                    type="number"
                                    className="bg-transparent text-4xl font-black w-full outline-none text-foreground placeholder:text-muted-foreground/20"
                                    value={endKm}
                                    onChange={(e) => setEndKm(parseInt(e.target.value))}
                                />
                                <p className="text-[10px] text-muted-foreground/40 mt-2 font-black uppercase tracking-widest">Km de saída: {formatKm(journey.startKm)}</p>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center gap-2 text-muted-foreground/60 mb-4">
                                <ClipboardCheck size={16} />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Inspeção de Retorno (Check-in)</span>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                {checklistItems.map((item) => (
                                    <div
                                        key={item.itemName}
                                        onClick={() => toggleItemStatus(item.itemName)}
                                        className={`
 flex items-center justify-between p-4 rounded-3xl border-2 cursor-pointer transition-all
 ${item.status === 'OK'
                                                ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500'
                                                : 'bg-amber-500/5 border-amber-500/20 text-amber-500'}
 `}
                                    >
                                        <div className="flex items-center gap-3">
                                            {item.photo ? (
                                                <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-border shadow-sm">
                                                    <img src={URL.createObjectURL(item.photo)} className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className={`p-2.5 rounded-xl ${item.status === 'OK' ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
                                                    {item.status === 'OK' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                                                </div>
                                            )}
                                            <span className="font-black text-xs uppercase tracking-tight">{item.itemName}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {item.status === 'PROBLEM' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveCameraItem(item.itemName);
                                                    }}
                                                    className={`p-2 rounded-lg transition-all ${item.photo ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                                                >
                                                    <Camera size={16} />
                                                </button>
                                            )}
                                            <span className="text-[10px] font-black uppercase tracking-widest">
                                                {item.status === 'OK' ? 'Conforme' : 'Divergência'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center gap-2 text-muted-foreground/60 mb-4">
                                <PenTool size={16} />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Formalização e Assinatura</span>
                            </div>

                            <div
                                onClick={() => setIsSignatureOpen(true)}
                                className="border-4 border-dashed border-border/50 rounded-[40px] p-8 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-muted/30 transition-all min-h-[250px] bg-muted/10 group"
                            >
                                {signature ? (
                                    <img src={URL.createObjectURL(signature)} className="max-h-40 object-contain invert opacity-80" />
                                ) : (
                                    <>
                                        <div className="p-6 bg-muted rounded-full text-muted-foreground/20 group-hover:text-primary transition-colors">
                                            <PenTool size={48} />
                                        </div>
                                        <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Clique para assinar eletronicamente</p>
                                    </>
                                )}
                            </div>
                            <p className="text-center text-[10px] text-muted-foreground uppercase font-medium">
                                Ao assinar, você confirma que as informações prestadas são verdadeiras e refletem a condição atual do veículo.
                            </p>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-muted/30 border-t border-border flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 font-black text-[10px] uppercase tracking-widest text-muted-foreground/60 hover:text-foreground transition-all"
                    >
                        Descartar
                    </button>
                    {step === 1 ? (
                        <button
                            disabled={!endKm || endKm < journey.startKm}
                            onClick={() => setStep(2)}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center gap-2 transition-all active:scale-95"
                        >
                            Check-in
                            <ArrowRight size={16} />
                        </button>
                    ) : step === 2 ? (
                        <button
                            onClick={() => setStep(3)}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center gap-2 transition-all active:scale-95"
                        >
                            Continuar para Assinatura
                            <ArrowRight size={16} />
                        </button>
                    ) : (
                        <button
                            disabled={endMutation.isPending || !signature}
                            onClick={handleEnd}
                            className="bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-500/20 flex items-center gap-2 transition-all active:scale-95"
                        >
                            {endMutation.isPending ? 'PROCESSANDO...' : 'FINALIZAR JORNADA'}
                            <Flag size={16} />
                        </button>
                    )}
                </div>

                {activeCameraItem && (
                    <CameraCapture
                        onCapture={handlePhotoCapture}
                        onClose={() => setActiveCameraItem(null)}
                    />
                )}

                {isSignatureOpen && (
                    <SignaturePad
                        onSave={(file) => {
                            setSignature(file);
                            setIsSignatureOpen(false);
                        }}
                        onCancel={() => setIsSignatureOpen(false)}
                    />
                )}
            </GlassCard>
        </div>
    );
}

