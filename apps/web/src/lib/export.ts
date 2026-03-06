import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportColumn<T> {
    header: string;
    key: keyof T | string; // Permitir chaves aninhadas ou formatadas no futuro se necessário
    format?: (value: any, row: T) => string; // Função opcional para formatar o valor (ex: moeda, data)
}

/**
 * Utilitário genérico para mapear dados baseando-se nas colunas configuradas.
 */
function prepareData<T>(data: T[], columns: ExportColumn<T>[]) {
    return data.map((row) => {
        const rowData: Record<string, any> = {};
        columns.forEach((col) => {
            // Se houver um formatador customizado, usa ele
            if (col.format) {
                rowData[col.header] = col.format((row as any)[col.key], row);
            } else {
                rowData[col.header] = (row as any)[col.key] ?? '';
            }
        });
        return rowData;
    });
}

/**
 * Exporta os dados para um arquivo CSV.
 */
export function exportToCsv<T>(data: T[], filename: string, columns: ExportColumn<T>[]) {
    const preparedData = prepareData(data, columns);

    // Extrair cabeçalhos
    const headers = columns.map(c => c.header).join(',');

    // Extrair linhas
    const rows = preparedData.map(row => {
        return columns.map(c => {
            let val = row[c.header];
            // Escapar aspas duplas e englobar em aspas duplas se houver vírgula
            if (typeof val === 'string') {
                val = val.replace(/"/g, '""');
                if (val.includes(',') || val.includes('\n') || val.includes('"')) {
                    val = `"${val}"`;
                }
            }
            return val;
        }).join(',');
    });

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' }); // \ufeff para BOM no Excel

    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Exporta os dados para uma planilha Excel (.xlsx).
 */
export function exportToExcel<T>(data: T[], filename: string, columns: ExportColumn<T>[]) {
    const preparedData = prepareData(data, columns);

    const worksheet = XLSX.utils.json_to_sheet(preparedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados');

    // Forçar o download
    XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export interface BrandingOptions {
    organizationName?: string;
    logoUrl?: string | null;
    primaryColor?: string | null; // Hex format #RRGGBB
}

/**
 * Converte HEX para array RGB [R, G, B] para o jsPDF
 */
function hexToRgb(hex: string): [number, number, number] {
    const hexVal = hex.replace(/^#/, '');
    const r = parseInt(hexVal.substring(0, 2), 16) || 41;
    const g = parseInt(hexVal.substring(2, 4), 16) || 128;
    const b = parseInt(hexVal.substring(4, 6), 16) || 185;
    return [r, g, b];
}

/**
 * Helper to get image as Base64 for jsPDF
 */
function getBase64ImageFromUrl(imageUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject('No ctx');
            ctx.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL('image/png');
            resolve(dataURL);
        };
        img.onerror = error => reject(error);
        img.src = imageUrl;
    });
}

/**
 * Exporta os dados para um documento PDF.
 */
export async function exportToPdf<T>(
    data: T[],
    title: string,
    filename: string,
    columns: ExportColumn<T>[],
    branding?: BrandingOptions
) {
    const doc = new jsPDF('landscape');
    let startY = 36;
    let headerTextY = 22;

    // Define cor primária
    const primaryRgb = branding?.primaryColor ? hexToRgb(branding.primaryColor) : [41, 128, 185] as [number, number, number];

    // Tentar adicionar o logo
    if (branding?.logoUrl) {
        try {
            const base64Img = await getBase64ImageFromUrl(branding.logoUrl);
            // Renderiza logo top-left
            doc.addImage(base64Img, 'PNG', 14, 10, 30, 15);
            headerTextY = 32; // Move o título para baixo se tiver logo
            startY = 46;
        } catch (error) {
            console.warn('Could not load logo for PDF:', error);
        }
    }

    // Organização Name (Se tiver)
    if (branding?.organizationName) {
        doc.setFontSize(10);
        doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
        doc.text(branding.organizationName, 14, headerTextY - 8);
    }

    // Cabeçalho do Documento
    doc.setFontSize(18);
    doc.setTextColor(20);
    doc.text(title, 14, headerTextY);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, headerTextY + 8);

    // Extrair cabeçalhos da tabela
    const tableHeaders = columns.map(c => c.header);

    // Extrair corpo da tabela
    const tableData = data.map(row => {
        return columns.map(col => {
            if (col.format) {
                return col.format((row as any)[col.key], row);
            }
            return (row as any)[col.key] ?? '';
        });
    });

    // Gerar a tabela usando o plugin autotable
    autoTable(doc, {
        startY: startY,
        head: [tableHeaders],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: primaryRgb }, // Cor dinâmica
        styles: { fontSize: 8, cellPadding: 3 },
        margin: { top: 30 },
    });

    doc.save(`${filename}.pdf`);
}
