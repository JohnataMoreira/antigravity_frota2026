import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export interface ExportColumn {
    header: string;
    dataKey: string;
}

export class ExportService {
    static async exportToPDF(
        title: string,
        data: any[],
        columns: ExportColumn[],
        filename: string,
        organization?: { name: string, logoUrl?: string }
    ) {
        const doc = new jsPDF();

        // White-label Header
        if (organization?.logoUrl) {
            try {
                // In a real scenario, we'd need to convert URL to base64 or ensure it's accessible
                // For now, we'll reserve space and put the name
                doc.setFontSize(20);
                doc.setTextColor(37, 99, 235);
                doc.text(organization.name.toUpperCase(), 14, 22);
            } catch (e) {
                doc.setFontSize(22);
                doc.setTextColor(37, 99, 235);
                doc.text('FROTA2026', 14, 22);
            }
        } else {
            doc.setFontSize(22);
            doc.setTextColor(37, 99, 235);
            doc.text(organization?.name?.toUpperCase() || 'FROTA2026', 14, 22);
        }

        doc.setFontSize(14);
        doc.setTextColor(100);
        doc.text(title, 14, 32);

        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Gerado por: ${organization?.name || 'Sistema Frota2026'} em ${new Date().toLocaleString('pt-BR')}`, 14, 38);

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
    }

    static async exportToExcel(data: any[], filename: string) {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatórios');

        // Auto-size columns (rough approximation)
        const colWidths = Object.keys(data[0] || {}).map(() => ({ wch: 20 }));
        worksheet['!cols'] = colWidths;

        XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
    }
}
