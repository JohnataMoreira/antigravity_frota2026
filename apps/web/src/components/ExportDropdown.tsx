import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, FileSpreadsheet, FileJson } from 'lucide-react';
import { exportToCsv, exportToExcel, exportToPdf, ExportColumn } from '../lib/export';

interface ExportDropdownProps<T> {
    data: T[];
    columns: ExportColumn<T>[];
    filename: string;
    pdfTitle?: string;
}

export function ExportDropdown<T>({ data, columns, filename, pdfTitle }: ExportDropdownProps<T>) {
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

    const handleExport = (type: 'csv' | 'excel' | 'pdf') => {
        if (data.length === 0) {
            alert('Não há dados para exportar.');
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
                exportToPdf(data, pdfTitle || filename, filename, columns);
                break;
        }
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm font-medium"
            >
                <Download size={18} className="text-gray-500" />
                <span className="hidden sm:inline">Exportar</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="py-1">
                        <button
                            onClick={() => handleExport('pdf')}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        >
                            <FileText size={16} className="text-red-500" />
                            Documento PDF
                        </button>
                        <button
                            onClick={() => handleExport('excel')}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        >
                            <FileSpreadsheet size={16} className="text-green-600" />
                            Planilha Excel
                        </button>
                        <button
                            onClick={() => handleExport('csv')}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        >
                            <FileJson size={16} className="text-gray-500" />
                            Arquivo CSV
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
