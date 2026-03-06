import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Download, FileText, FileSpreadsheet, FileJson } from 'lucide-react';
import { exportToCsv, exportToExcel, exportToPdf, ExportColumn } from '../lib/export';
import { useAuth } from '../context/AuthContext';

interface ExportDropdownProps<T> {
    data: T[];
    columns: ExportColumn<T>[];
    filename: string;
    pdfTitle?: string;
}

export function ExportDropdown<T>({ data, columns, filename, pdfTitle }: ExportDropdownProps<T>) {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleExport = async (type: 'csv' | 'excel' | 'pdf') => {
        if (data.length === 0) {
            toast.error('Não há dados para exportar.');
            return;
        }

        switch (type) {
            case 'csv':
                exportToCsv(data, filename, columns);
                break;
            case 'excel':
                exportToExcel(data, filename, columns);
                break;
            case 'pdf':
                await exportToPdf(data, pdfTitle || filename, filename, columns, {
                    organizationName: (user as any)?.organization?.name,
                    logoUrl: (user as any)?.organization?.logoUrl,
                    primaryColor: (user as any)?.organization?.primaryColor
                });
                break;
        }
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-foreground hover:bg-muted hover:border-primary/30 transition-all rounded-xl shadow-sm font-bold text-sm"
            >
                <Download size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="hidden sm:inline">Exportar</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-card rounded-xl shadow-xl border border-border overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="py-1">
                        <button
                            onClick={() => handleExport('pdf')}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-bold text-foreground hover:bg-primary/5 hover:text-primary transition-colors"
                        >
                            <FileText size={16} className="text-destructive" />
                            Documento PDF
                        </button>
                        <button
                            onClick={() => handleExport('excel')}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-bold text-foreground hover:bg-primary/5 hover:text-primary transition-colors"
                        >
                            <FileSpreadsheet size={16} className="text-emerald-500" />
                            Planilha Excel
                        </button>
                        <button
                            onClick={() => handleExport('csv')}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-bold text-foreground hover:bg-primary/5 hover:text-primary transition-colors"
                        >
                            <FileJson size={16} className="text-muted-foreground" />
                            Arquivo CSV
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
