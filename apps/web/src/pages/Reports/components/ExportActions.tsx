import { FileText, FileSpreadsheet } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ExportActionsProps {
    data: any[];
    columns: { header: string; dataKey: string }[];
    filename: string;
    title: string;
}

export function ExportActions({ data, columns, filename, title }: ExportActionsProps) {
    const exportToPDF = () => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.setTextColor(37, 99, 235); // Blue-600
        doc.text('GRUPO PARAOPEBA', 14, 22);

        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text(title, 14, 30);
        doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 37);

        // Table
        (doc as any).autoTable({
            startY: 45,
            head: [columns.map(col => col.header)],
            body: data.map(row => columns.map(col => row[col.dataKey])),
            theme: 'grid',
            headStyles: { fillColor: [37, 99, 235], fontSize: 10, fontStyle: 'bold' },
            bodyStyles: { fontSize: 9 },
            margin: { top: 45 },
        });

        doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const exportToExcel = () => {
        // Flatten data for excel if needed, but Utils.json_to_sheet is usually enough
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório');
        XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
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
