import { FileText, FileSpreadsheet } from 'lucide-react';
import { ExportService } from '../../../services/exportService';

interface ExportActionsProps {
    data: any[];
    columns: { header: string; dataKey: string }[];
    filename: string;
    title: string;
}

export function ExportActions({ data, columns, filename, title }: ExportActionsProps) {
    const exportToPDF = () => {
        ExportService.exportToPDF(title, data, columns, filename);
    };

    const exportToExcel = () => {
        ExportService.exportToExcel(data, filename);
    };

    return (
        <div className="flex gap-2">
            <button
                onClick={exportToPDF}
                className="flex items-center gap-2 bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all active:scale-95 shadow-lg shadow-red-500/5 group"
            >
                <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" />
                PDF
            </button>
            <button
                onClick={exportToExcel}
                className="flex items-center gap-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all active:scale-95 shadow-lg shadow-emerald-500/5 group"
            >
                <FileSpreadsheet className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Excel
            </button>
        </div>
    );
}
