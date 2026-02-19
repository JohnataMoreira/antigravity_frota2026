import { useState } from 'react';
import { api } from '../../../lib/axios';
import { X, Upload, FileText, Calendar, Info } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface DocumentUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    userId?: string;
    vehicleId?: string;
}

export function DocumentUploadModal({ isOpen, onClose, onSuccess, userId, vehicleId }: DocumentUploadModalProps) {
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        type: 'OTHER',
        name: '',
        number: '',
        issueDate: '',
        expiryDate: ''
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setLoading(true);
        try {
            const data = new FormData();
            data.append('file', file);
            data.append('type', formData.type);
            data.append('name', formData.name);
            data.append('number', formData.number);
            if (formData.issueDate) data.append('issueDate', formData.issueDate);
            if (formData.expiryDate) data.append('expiryDate', formData.expiryDate);
            if (userId) data.append('userId', userId);
            if (vehicleId) data.append('vehicleId', vehicleId);

            await api.post('/compliance/upload', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error uploading document:', error);
        } finally {
            setLoading(true);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Upload className="w-5 h-5 text-primary" />
                        Novo Documento
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Tipo de Documento</label>
                        <select
                            required
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary transition-all outline-none"
                        >
                            <option value="CNH">CNH (Motorista)</option>
                            <option value="CRLV">CRLV (Veículo)</option>
                            <option value="ANTT">ANTT</option>
                            <option value="INSURANCE">Seguro</option>
                            <option value="MAINTENANCE">Laudo Técnico</option>
                            <option value="OTHER">Outros</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Nome/Descrição</label>
                        <input
                            required
                            type="text"
                            placeholder="Ex: CNH John Doe"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary transition-all outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Número</label>
                            <input
                                type="text"
                                value={formData.number}
                                onChange={e => setFormData({ ...formData, number: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary transition-all outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Vencimento</label>
                            <input
                                type="date"
                                value={formData.expiryDate}
                                onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Arquivo</label>
                        <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${file ? 'border-primary bg-primary/5' : 'border-white/10 hover:border-white/20'}`}>
                            <input
                                type="file"
                                onChange={e => setFile(e.target.files?.[0] || null)}
                                className="hidden"
                                id="doc-file"
                            />
                            <label htmlFor="doc-file" className="cursor-pointer space-y-2 block">
                                <FileText className={`w-8 h-8 mx-auto ${file ? 'text-primary' : 'text-muted-foreground'}`} />
                                <p className="text-sm">{file ? file.name : 'Clique para selecionar ou arraste'}</p>
                                <p className="text-[10px] text-muted-foreground">PDF, JPG ou PNG (Max 5MB)</p>
                            </label>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading || !file} className="flex-1">
                            {loading ? 'Enviando...' : 'Salvar'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
