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
                className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-xl transition-all text-xs font-black uppercase tracking-wider border border-red-500/20"
            >
                <FileText className="w-4 h-4" />
                PDF
            </button>
            <button
                onClick={exportToExcel}
                className="flex items-center gap-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 px-4 py-2 rounded-xl transition-all text-xs font-black uppercase tracking-wider border border-green-500/20"
            >
                <FileSpreadsheet className="w-4 h-4" />
                Excel
            </button>
        </div>
    );
}
