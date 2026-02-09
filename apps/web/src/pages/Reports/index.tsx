import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { GlassCard } from '../../components/ui/Cards';
import { Download, Filter, FileText, Table as TableIcon } from 'lucide-react';

export function Reports() {
    const [isExporting, setIsExporting] = useState(false);

    const { data: reportData } = useQuery({
        queryKey: ['reports-detailed'],
        queryFn: async () => {
            const res = await api.get('/reports/overview');
            return res.data;
        }
    });

    const exportToCSV = () => {
        setIsExporting(true);
        try {
            const stats = reportData?.stats;
            const history = reportData?.history || [];

            let csvContent = "data:text/csv;charset=utf-8,";
            csvContent += "Mes,Custos (R$),Distancia (KM)\n";

            history.forEach((row: any) => {
                csvContent += `${row.name},${row.costs},${row.km}\n`;
            });

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `relatorio_frota_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight gradient-text">Relatórios Operacionais</h1>
                    <p className="text-muted-foreground mt-2 text-lg">Exporte e analise os dados da sua frota</p>
                </div>
                <button
                    onClick={exportToCSV}
                    disabled={isExporting}
                    className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50"
                >
                    <Download className="w-5 h-5" />
                    {isExporting ? 'Exportando...' : 'Exportar CSV'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-500/20 rounded-lg text-blue-500">
                            <FileText className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold">Resumo Financeiro</h3>
                    </div>
                    <p className="text-muted-foreground text-sm mb-4">Total investido em manutenção no período:</p>
                    <p className="text-3xl font-bold text-primary">R$ {reportData?.stats?.monthlyCosts || 0}</p>
                </GlassCard>

                <GlassCard>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-green-500/20 rounded-lg text-green-500">
                            <TableIcon className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold">Eficiência</h3>
                    </div>
                    <p className="text-muted-foreground text-sm mb-4">Quilometragem total controlada:</p>
                    <p className="text-3xl font-bold text-primary">{reportData?.stats?.totalKm || 0} KM</p>
                </GlassCard>

                <GlassCard>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-amber-500/20 rounded-lg text-amber-500">
                            <Filter className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold">Status de Saúde</h3>
                    </div>
                    <p className="text-muted-foreground text-sm mb-4">Pendências identificadas em checklists:</p>
                    <p className="text-3xl font-bold text-primary">{reportData?.stats?.issuesReported || 0}</p>
                </GlassCard>
            </div>

            <GlassCard>
                <h3 className="text-xl font-bold mb-6">Histórico Detalhado</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="pb-4 font-bold">Mês</th>
                                <th className="pb-4 font-bold">Custos</th>
                                <th className="pb-4 font-bold">Km Percorrido</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {reportData?.history?.map((row: any) => (
                                <tr key={row.name} className="hover:bg-white/5 transition-colors">
                                    <td className="py-4">{row.name}</td>
                                    <td className="py-4">R$ {row.costs}</td>
                                    <td className="py-4">{row.km} KM</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </GlassCard>
        </div>
    );
}
