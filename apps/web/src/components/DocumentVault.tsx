import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { GlassCard } from './ui/Cards';
import { FileText, Plus, Trash2, Calendar, AlertTriangle, CheckCircle2, Download, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { formatDateTime } from '../lib/utils';

interface DocumentVaultProps {
 targetId: string;
 targetType: 'USER' | 'VEHICLE';
}

export function DocumentVault({ targetId, targetType }: DocumentVaultProps) {
 const queryClient = useQueryClient();
 const [isUploading, setIsUploading] = useState(false);
 const [uploadData, setUploadData] = useState({
 type: 'OTHER',
 name: '',
 expiryDate: '',
 });

 const { data: documents = [], isLoading } = useQuery({
 queryKey: ['documents', targetId],
 queryFn: async () => {
 const params = targetType === 'USER' ? { userId: targetId } : { vehicleId: targetId };
 const res = await api.get('/compliance/documents', { params });
 return res.data;
 }
 });

 const uploadMutation = useMutation({
 mutationFn: async (file: File) => {
 const formData = new FormData();
 formData.append('file', file);
 formData.append('type', uploadData.type);
 formData.append('name', uploadData.name || file.name);
 if (uploadData.expiryDate) formData.append('expiryDate', uploadData.expiryDate);

 if (targetType === 'USER') formData.append('userId', targetId);
 else formData.append('vehicleId', targetId);

 return api.post('/compliance/upload', formData, {
 headers: { 'Content-Type': 'multipart/form-data' }
 });
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ['documents', targetId] });
 setIsUploading(false);
 setUploadData({ type: 'OTHER', name: '', expiryDate: '' });
 }
 });

 const deleteMutation = useMutation({
 mutationFn: (id: string) => api.delete(`/compliance/documents/${id}`),
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ['documents', targetId] });
 }
 });

 const getExpiryStatus = (date?: string) => {
 if (!date) return 'valid';
 const expiry = new Date(date);
 const now = new Date();
 const diff = expiry.getTime() - now.getTime();
 const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

 if (days < 0) return 'expired';
 if (days <= 30) return 'warning';
 return 'valid';
 };

 const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (file) {
 uploadMutation.mutate(file);
 }
 };

 return (
 <div className="space-y-6">
 <div className="flex items-center justify-between">
 <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
 <FileText className="text-blue-500" />
 Cofre Digital de Documentos
 </h3>

 <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold cursor-pointer hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95">
 <Plus size={18} />
 Novo Documento
 <input type="file" className="hidden" onChange={handleFileChange} disabled={uploadMutation.isPending} />
 </label>
 </div>

 {isUploading && (
 <GlassCard className="border-blue-500/30 bg-blue-500/5 animate-pulse">
 <div className="flex items-center gap-4">
 <Loader2 className="animate-spin text-blue-500" />
 <span className="font-bold text-sm">Enviando arquivo para o cofre seguro...</span>
 </div>
 </GlassCard>
 )}

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {isLoading ? (
 Array(3).fill(0).map((_, i) => (
 <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
 ))
 ) : documents.map((doc: any) => {
 const status = getExpiryStatus(doc.expiryDate);
 return (
 <GlassCard key={doc.id} className="group relative overflow-hidden">
 <div className={clsx(
 "absolute top-0 left-0 w-1 h-full",
 status === 'valid' ? 'bg-emerald-500' : status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
 )} />

 <div className="flex justify-between items-start mb-4">
 <div className="p-2 bg-gray-100 rounded-xl">
 <FileText size={24} className="text-gray-500" />
 </div>
 <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
 <a
 href={doc.fileUrl}
 target="_blank"
 rel="noopener noreferrer"
 className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-all"
 >
 <Download size={18} />
 </a>
 <button
 onClick={() => deleteMutation.mutate(doc.id)}
 className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-all"
 >
 <Trash2 size={18} />
 </button>
 </div>
 </div>

 <div className="space-y-1">
 <h4 className="font-bold text-sm truncate uppercase tracking-tight">{doc.name}</h4>
 <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
 <span className="px-1.5 py-0.5 bg-gray-100 rounded">{doc.type}</span>
 {doc.number && <span>• {doc.number}</span>}
 </div>
 </div>

 <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
 <div className="flex items-center gap-1.5 text-[10px] font-bold">
 <Calendar size={12} className="text-muted-foreground" />
 <span className={clsx(
 status === 'expired' ? 'text-red-500' : status === 'warning' ? 'text-amber-500' : 'text-emerald-500'
 )}>
 {doc.expiryDate ? `Vence: ${new Date(doc.expiryDate).toLocaleDateString('pt-BR')}` : 'Sem validade'}
 </span>
 </div>
 {status === 'valid' ? (
 <CheckCircle2 size={14} className="text-emerald-500" />
 ) : (
 <AlertTriangle size={14} className={status === 'warning' ? 'text-amber-500' : 'text-red-500'} />
 )}
 </div>
 </GlassCard>
 );
 })}

 {!isLoading && documents.length === 0 && (
 <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-3xl opacity-50">
 <FileText size={48} className="text-gray-300 mb-4" />
 <p className="font-bold text-sm">Nenhum documento anexado ainda.</p>
 </div>
 )}
 </div>
 </div>
 );
}


