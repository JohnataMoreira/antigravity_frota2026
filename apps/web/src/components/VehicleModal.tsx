import { useState, useEffect } from 'react';
import { X, Save, FileText, Info } from 'lucide-react';
import { DocumentVault } from './DocumentVault';

interface Vehicle {
    id?: string;
    plate: string;
    model: string;
    brand: string;
    status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'CRITICAL_ISSUE';
    currentKm: number;
    type: 'CAR' | 'TRUCK' | 'MOTORCYCLE' | 'MACHINE';
    year?: number;
}

interface VehicleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    vehicle?: Vehicle | null;
}

export function VehicleModal({ isOpen, onClose, onSave, vehicle }: VehicleModalProps) {
    const [activeTab, setActiveTab] = useState<'info' | 'documents'>('info');
    const [formData, setFormData] = useState<Partial<Vehicle>>({
        plate: '',
        model: '',
        brand: '',
        status: 'AVAILABLE',
        currentKm: 0,
        type: 'CAR',
        year: new Date().getFullYear(),
    });

    useEffect(() => {
        if (vehicle) {
            setFormData(vehicle);
        } else {
            setFormData({
                plate: '',
                model: '',
                brand: '',
                status: 'AVAILABLE',
                currentKm: 0,
                type: 'CAR',
                year: new Date().getFullYear(),
            });
        }
    }, [vehicle, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-card max-w-lg w-full p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 blur-3xl rounded-full" />

                <div className="flex items-center justify-between mb-8 relative">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {vehicle ? 'Editar Veículo' : 'Novo Veículo'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {vehicle?.id && (
                    <div className="flex gap-4 mb-8 border-b dark:border-gray-800 relative z-10">
                        <button
                            onClick={() => setActiveTab('info')}
                            className={`pb-4 px-2 text-xs font-black uppercase tracking-widest transition-all relative flex items-center gap-2 ${activeTab === 'info' ? 'text-blue-500' : 'text-muted-foreground'}`}
                        >
                            <Info size={14} /> Dados Técnicos
                            {activeTab === 'info' && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded-t-full" />}
                        </button>
                        <button
                            onClick={() => setActiveTab('documents')}
                            className={`pb-4 px-2 text-xs font-black uppercase tracking-widest transition-all relative flex items-center gap-2 ${activeTab === 'documents' ? 'text-blue-500' : 'text-muted-foreground'}`}
                        >
                            <FileText size={14} /> Documentação
                            {activeTab === 'documents' && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded-t-full" />}
                        </button>
                    </div>
                )}

                {activeTab === 'info' ? (
                    <form onSubmit={handleSubmit} className="space-y-6 relative">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Placa</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="ABC-1234"
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all uppercase"
                                    value={formData.plate}
                                    onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Tipo</label>
                                <select
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                >
                                    <option value="CAR">Carro</option>
                                    <option value="TRUCK">Caminhão</option>
                                    <option value="MOTORCYCLE">Moto</option>
                                    <option value="MACHINE">Máquina/Equipamento</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Marca</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Volvo, Ford..."
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    value={formData.brand}
                                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Modelo</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: FH 540, Ranger..."
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    value={formData.model}
                                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Quilometragem Inicial</label>
                                <input
                                    type="number"
                                    required
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    value={formData.currentKm}
                                    onChange={(e) => setFormData({ ...formData, currentKm: Number(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Ano</label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    value={formData.year}
                                    onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Status do Veículo</label>
                            <select
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                            >
                                <option value="AVAILABLE" className="text-green-600">Disponível</option>
                                <option value="IN_USE" className="text-blue-600">Em Uso</option>
                                <option value="MAINTENANCE" className="text-yellow-600">Manutenção</option>
                                <option value="CRITICAL_ISSUE" className="text-red-600">Problema Crítico</option>
                            </select>
                        </div>

                        <div className="flex gap-3 pt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all font-semibold"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 font-semibold transition-all"
                            >
                                <Save size={20} />
                                Salvar Veículo
                            </button>
                        </div>
                    </form>
                ) : (
                    <DocumentVault targetId={vehicle?.id as string} targetType="VEHICLE" />
                )}
            </div>
        </div>
    );
}
