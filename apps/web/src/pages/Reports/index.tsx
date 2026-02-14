import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { GlassCard } from '../../components/ui/Cards';
import { Download, FileText, Table as TableIcon, Filter, Layers, Users, Truck, Fuel, DollarSign } from 'lucide-react';
import { DriversTab } from './components/DriversTab';
import { VehiclesTab } from './components/VehiclesTab';
import { FuelTab } from './components/FuelTab';
import { FinanceTab } from './components/FinanceTab';
import { ExportActions } from './components/ExportActions';
import { clsx } from 'clsx';
import { formatCurrency, formatKm } from '../../lib/utils';

export default function Reports() {
    const [activeTab, setActiveTab] = useState<'overview' | 'drivers' | 'vehicles' | 'fuel' | 'finance'>('overview');
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-white/5 rounded-xl w-fit">
                {[
                    { id: 'overview', label: 'Visão Geral', icon: Layers },
                    { id: 'drivers', label: 'Motoristas', icon: Users },
                    { id: 'vehicles', label: 'Veículos', icon: Truck },
                    { id: 'fuel', label: 'Combustível', icon: Fuel },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={clsx(
                            "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all",
                            activeTab === tab.id
                                ? "bg-primary text-white shadow-lg"
                                : "text-muted-foreground hover:bg-white/5 hover:text-white"
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <GlassCard>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-blue-500/20 rounded-lg text-blue-500">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-bold">Resumo Financeiro</h3>
                                </div>
                                <p className="text-muted-foreground text-sm mb-4">Total investido em manutenção no período:</p>
                                <p className="text-3xl font-bold text-primary">{formatCurrency(reportData?.stats?.monthlyCosts || 0)}</p>
                            </GlassCard>

                            <GlassCard>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-green-500/20 rounded-lg text-green-500">
                                        <TableIcon className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-bold">Eficiência</h3>
                                </div>
                                <p className="text-muted-foreground text-sm mb-4">Quilometragem total controlada:</p>
                                <p className="text-3xl font-bold text-primary">{formatKm(reportData?.stats?.totalKm || 0)}</p>
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
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold">Histórico Detalhado</h3>
                                <ExportActions
                                    data={reportData?.history || []}
                                    filename="relatorio_geral"
                                    title="Relatório Geral de Custos e Quilometragem"
                                    columns={[
                                        { header: 'Mês', dataKey: 'name' },
                                        { header: 'Custos (R$)', dataKey: 'costs' },
                                        { header: 'Distância (KM)', dataKey: 'km' }
                                    ]}
                                />
                            </div>
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
                                                <td className="py-4 font-bold">{formatCurrency(row.costs)}</td>
                                                <td className="py-4 font-bold">{formatKm(row.km)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </GlassCard>
                    </div>
                )}

                {activeTab === 'drivers' && <DriversTab />}
                {activeTab === 'vehicles' && <VehiclesTab />}
                {activeTab === 'fuel' && <FuelTab />}
                {activeTab === 'finance' && <FinanceTab />}
            </div>
        </div>
    );
}
