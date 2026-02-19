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

 <GlassCard className="w-full max-w-2xl relative z-10 animate-in zoom-in-95 duration-200 !p-0 overflow-hidden border shadow-2xl">
 <div className="p-6 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white flex justify-between items-center">
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

 <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
 {step === 1 && (
 <div className="space-y-4">
 <div className="flex items-center gap-2 text-muted-foreground mb-4">
 <Gauge size={16} />
 <span className="text-xs font-black uppercase tracking-widest">Odômetro Final</span>
 </div>
 <div className="bg-gray-50 p-6 rounded-2xl border ">
 <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Km de Chegada</label>
 <input
 type="number"
 className="bg-transparent text-3xl font-black w-full outline-none"
 value={endKm}
 onChange={(e) => setEndKm(parseInt(e.target.value))}
 />
 <p className="text-[10px] text-muted-foreground mt-2">Km de saída: {formatKm(journey.startKm)}</p>
 </div>
 </div>
 )}

 {step === 2 && (
 <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
 <div className="flex items-center gap-2 text-muted-foreground mb-4">
 <ClipboardCheck size={16} />
 <span className="text-xs font-black uppercase tracking-widest">Inspeção de Retorno (Check-in)</span>
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
 {item.photo ? (
 <div className="w-10 h-10 rounded-lg overflow-hidden border-2 border-white shadow-sm">
 <img src={URL.createObjectURL(item.photo)} className="w-full h-full object-cover" />
 </div>
 ) : (
 <div className={`p-2 rounded-xl ${item.status === 'OK' ? 'bg-emerald-100' : 'bg-amber-100'}`}>
 {item.status === 'OK' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
 </div>
 )}
 <span className="font-bold text-sm uppercase tracking-tight">{item.itemName}</span>
 </div>
 <div className="flex items-center gap-3">
 {item.status === 'PROBLEM' && (
 <button
 onClick={(e) => {
 e.stopPropagation();
 setActiveCameraItem(item.itemName);
 }}
 className={`p-2 rounded-lg transition-all ${item.photo ? 'bg-emerald-600 text-white' : 'bg-neutral-200 text-neutral-600'}`}
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
 <div className="flex items-center gap-2 text-muted-foreground mb-4">
 <PenTool size={16} />
 <span className="text-xs font-black uppercase tracking-widest">Formalização e Assinatura</span>
 </div>

 <div
 onClick={() => setIsSignatureOpen(true)}
 className="border-4 border-dashed border-neutral-200 rounded-3xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-neutral-50 transition-all min-h-[200px]"
 >
 {signature ? (
 <img src={URL.createObjectURL(signature)} className="max-h-32 object-contain" />
 ) : (
 <>
 <div className="p-4 bg-neutral-100 rounded-full text-neutral-400">
 <PenTool size={32} />
 </div>
 <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest">Clique para assinar</p>
 </>
 )}
 </div>
 <p className="text-center text-[10px] text-muted-foreground uppercase font-medium">
 Ao assinar, você confirma que as informações prestadas são verdadeiras e refletem a condição atual do veículo.
 </p>
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
 disabled={!endKm || endKm < journey.startKm}
 onClick={() => setStep(2)}
 className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 flex items-center gap-2 transition-all active:scale-95"
 >
 Verificar Retorno
 <ArrowRight size={18} />
 </button>
 ) : step === 2 ? (
 <button
 onClick={() => setStep(3)}
 className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 flex items-center gap-2 transition-all active:scale-95"
 >
 Próximo: Assinatura
 <ArrowRight size={18} />
 </button>
 ) : (
 <button
 disabled={endMutation.isPending || !signature}
 onClick={handleEnd}
 className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 flex items-center gap-2 transition-all active:scale-95"
 >
 {endMutation.isPending ? 'Finalizando...' : 'Encerrar Jornada'}
 <Flag size={18} />
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

