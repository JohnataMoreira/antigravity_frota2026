import React, { useState, useEffect } from 'react';
import { Building2, FileText, Globe, MapPin, Phone, Upload, Palette, Save, Check } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';

import { useAuth } from '../../../context/AuthContext';

export function OrganizationTab() {
    const queryClient = useQueryClient();
    const { refreshUser } = useAuth();
    const [logo, setLogo] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        document: '',
        address: '',
        phone: '',
        primaryColor: '#2563eb'
    });

    const { data: org, isLoading } = useQuery({
        queryKey: ['my-organization'],
        queryFn: async () => {
            const res = await api.get('/organizations/me');
            return res.data;
        }
    });

    useEffect(() => {
        if (org) {
            setFormData({
                name: org.name || '',
                document: org.document || '',
                address: org.address || '',
                phone: org.phone || '',
                primaryColor: org.primaryColor || '#2563eb'
            });
            if (org.logoUrl) setLogoPreview(org.logoUrl);
        }
    }, [org]);

    const mutation = useMutation({
        mutationFn: async (data: FormData) => {
            return api.patch('/organizations/me', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        },
        onSuccess: async () => {
            queryClient.invalidateQueries({ queryKey: ['my-organization'] });
            await refreshUser();
        }
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogo(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const data = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            data.append(key, value);
        });
        if (logo) {
            data.append('logo', logo);
        }
        mutation.mutate(data);
    };

    if (isLoading) return <div className="p-8 text-center animate-pulse uppercase font-black text-xs tracking-widest text-muted-foreground">Carregando dados...</div>;

    return (
        <form onSubmit={handleSave} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Banner */}
            <div className="flex flex-col md:flex-row items-center gap-6 p-8 bg-primary/5 rounded-[2rem] border border-primary/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[50px] rounded-full -mr-16 -mt-16 animate-pulse" />

                <div className="relative group/logo">
                    <div className="w-32 h-32 bg-background border-2 border-primary/20 rounded-3xl overflow-hidden flex items-center justify-center shadow-xl group-hover/logo:border-primary/50 transition-all">
                        {logoPreview ? (
                            <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-4" />
                        ) : (
                            <Building2 size={48} className="text-primary/40" />
                        )}
                    </div>
                    <label className="absolute -bottom-2 -right-2 p-3 bg-primary text-primary-foreground rounded-2xl shadow-lg cursor-pointer hover:scale-110 transition-transform active:scale-95">
                        <Upload size={18} />
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                </div>

                <div className="flex-1 text-center md:text-left">
                    <h3 className="text-3xl font-black uppercase tracking-tighter">{formData.name || 'Nova Organização'}</h3>
                    <p className="text-muted-foreground/60 text-xs font-black uppercase tracking-[0.2em] mt-1 shadow-primary/20">Identidade Visual da Unidade</p>
                </div>

                <div className="flex flex-col items-center gap-2">
                    <div
                        className="w-16 h-16 rounded-2xl shadow-lg border-4 border-background"
                        style={{ backgroundColor: formData.primaryColor }}
                    />
                    <input
                        type="color"
                        value={formData.primaryColor}
                        onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                        className="w-12 h-8 bg-transparent cursor-pointer opacity-0 absolute"
                    />
                    <div className="px-3 py-1 bg-muted/50 rounded-lg text-[10px] font-black tracking-widest uppercase">{formData.primaryColor}</div>
                </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">Nome da Empresa</label>
                    <div className="relative group">
                        <Building2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary group-focus-within:scale-110 transition-transform" />
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full pl-12 pr-4 py-4 bg-muted/30 border border-border rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium"
                            placeholder="Nome Corporativo"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">CNPJ / Documento</label>
                    <div className="relative group">
                        <FileText size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary group-focus-within:scale-110 transition-transform" />
                        <input
                            type="text"
                            value={formData.document}
                            onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                            className="w-full pl-12 pr-4 py-4 bg-muted/30 border border-border rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium"
                            placeholder="00.000.000/0000-00"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">Telefone de Contato</label>
                    <div className="relative group">
                        <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary group-focus-within:scale-110 transition-transform" />
                        <input
                            type="text"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full pl-12 pr-4 py-4 bg-muted/30 border border-border rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium"
                            placeholder="(00) 00000-0000"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">Endereço Principal</label>
                    <div className="relative group">
                        <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary group-focus-within:scale-110 transition-transform" />
                        <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className="w-full pl-12 pr-4 py-4 bg-muted/30 border border-border rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium"
                            placeholder="Logradouro, Nº - Cidade/UF"
                        />
                    </div>
                </div>
            </div>

            {/* Action Bar */}
            <div className="pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
                    <Globe size={14} className="animate-spin-slow" />
                    Mudanças afetam todos os usuários da organização
                </div>
                <button
                    type="submit"
                    disabled={mutation.isPending}
                    className="w-full md:w-auto px-10 py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-[1.05] active:scale-[0.95] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                    {mutation.isPending ? (
                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    ) : mutation.isSuccess ? (
                        <>
                            <Check size={18} />
                            Salvo com Sucesso
                        </>
                    ) : (
                        <>
                            <Save size={18} />
                            Salvar Alterações
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
