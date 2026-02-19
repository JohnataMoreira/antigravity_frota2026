import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { Disc, Plus, Search, Filter, ArrowUpRight, AlertTriangle, TrendingDown } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';
import { formatKm } from '../../lib/utils';

export function TyreInventory() {
 const [search, setSearch] = useState('');

 const { data: tyres, isLoading } = useQuery({
 queryKey: ['tyres'],
 queryFn: async () => {
 const res = await api.get('/tyres');
 return res.data;
 }
 });

 const stats = {
 total: tyres?.length || 0,
 inUse: tyres?.filter((t: any) => t.status === 'IN_USE').length || 0,
 needAttention: tyres?.filter((t: any) => t.status === 'RETREADING' || (t.currentKm > 60000)).length || 0,
 avgCPK: 0.12 // Example value
 };

 return (
 <div className="space-y-6">
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div>
 <h1 className="text-3xl font-bold tracking-tight">Gestão de Pneus</h1>
 <p className="text-muted-foreground">Controle de ciclo de vida e custo por quilômetro (CPK).</p>
 </div>
 <Button className="gap-2">
 <Plus size={20} /> Novo Pneu
 </Button>
 </div>

 {/* Stats Overview */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 <Card className="bg-white/50 backdrop-blur border-none shadow-sm capitalize group hover:shadow-md transition-all">
 <CardContent className="pt-6">
 <div className="flex items-center justify-between mb-2">
 <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
 <Disc size={20} />
 </div>
 <span className="text-[10px] font-bold text-gray-400">Total Frota</span>
 </div>
 <div className="text-2xl font-black">{stats.total}</div>
 <div className="text-xs text-muted-foreground">Pneus cadastrados</div>
 </CardContent>
 </Card>

 <Card className="bg-white/50 backdrop-blur border-none shadow-sm capitalize group hover:shadow-md transition-all">
 <CardContent className="pt-6">
 <div className="flex items-center justify-between mb-2">
 <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
 <ArrowUpRight size={20} />
 </div>
 <span className="text-[10px] font-bold text-gray-400">Em Operação</span>
 </div>
 <div className="text-2xl font-black">{stats.inUse}</div>
 <div className="text-xs text-muted-foreground">Sincronizados com veículos</div>
 </CardContent>
 </Card>

 <Card className="bg-white/50 backdrop-blur border-none shadow-sm capitalize group hover:shadow-md transition-all">
 <CardContent className="pt-6">
 <div className="flex items-center justify-between mb-2">
 <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
 <AlertTriangle size={20} />
 </div>
 <span className="text-[10px] font-bold text-gray-400">Atenção</span>
 </div>
 <div className="text-2xl font-black">{stats.needAttention}</div>
 <div className="text-xs text-muted-foreground">Vida útil crítica</div>
 </CardContent>
 </Card>

 <Card className="bg-white/50 backdrop-blur border-none shadow-sm capitalize group hover:shadow-md transition-all">
 <CardContent className="pt-6">
 <div className="flex items-center justify-between mb-2">
 <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
 <TrendingDown size={20} />
 </div>
 <span className="text-[10px] font-bold text-gray-400">CPK Médio</span>
 </div>
 <div className="text-2xl font-black">R$ {stats.avgCPK.toFixed(2)}</div>
 <div className="text-xs text-muted-foreground">Custo por KM rodado</div>
 </CardContent>
 </Card>
 </div>

 {/* List */}
 <Card className="border-none shadow-sm overflow-hidden">
 <div className="p-4 border-b bg-gray-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
 <div className="relative flex-1 w-full">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
 <input
 type="text"
 placeholder="Buscar por fogo, marca ou placa..."
 className="w-full pl-10 pr-4 py-2 rounded-xl border-none bg-white focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 />
 </div>
 <Button variant="outline" className="gap-2 w-full md:w-auto">
 <Filter size={18} /> Filtros
 </Button>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full">
 <thead>
 <tr className="text-left text-xs font-black uppercase tracking-widest text-muted-foreground border-b ">
 <th className="px-6 py-4">ID / Fogo</th>
 <th className="px-6 py-4">Marca / Modelo</th>
 <th className="px-6 py-4">Status</th>
 <th className="px-6 py-4">Localização</th>
 <th className="px-6 py-4 text-right">KM Rodado</th>
 <th className="px-6 py-4">Custo</th>
 </tr>
 </thead>
 <tbody className="divide-y ">
 {isLoading ? (
 <tr>
 <td colSpan={6} className="px-6 py-10 text-center">
 <div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
 </td>
 </tr>
 ) : tyres?.length === 0 ? (
 <tr>
 <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground italic">Nenhum pneu encontrado</td>
 </tr>
 ) : (
 tyres?.map((tyre: any) => (
 <tr key={tyre.id} className="hover:bg-gray-50 transition-colors">
 <td className="px-6 py-4">
 <div className="font-black text-blue-600">{tyre.identifier}</div>
 <div className="text-[10px] text-muted-foreground">{tyre.size}</div>
 </td>
 <td className="px-6 py-4">
 <div className="font-bold">{tyre.brand}</div>
 <div className="text-xs text-muted-foreground">{tyre.model}</div>
 </td>
 <td className="px-6 py-4">
 <Badge
 variant={tyre.status === 'STOCK' ? 'default' : tyre.status === 'IN_USE' ? 'success' : 'danger'}
 size="sm"
 >
 {tyre.status}
 </Badge>
 </td>
 <td className="px-6 py-4">
 {tyre.vehicle ? (
 <div className="flex items-center gap-2">
 <Badge variant="info" size="sm">{tyre.vehicle.plate}</Badge>
 <span className="text-xs text-muted-foreground font-medium">Eixo {tyre.axle} - {tyre.position}</span>
 </div>
 ) : (
 <span className="text-xs text-muted-foreground italic">Em estoque</span>
 )}
 </td>
 <td className="px-6 py-4 text-right font-mono text-sm font-bold">
 {formatKm(tyre.currentKm)}
 </td>
 <td className="px-6 py-4">
 <div className="text-sm font-bold">R$ {tyre.initialCost?.toLocaleString('pt-BR')}</div>
 <div className="text-[10px] text-emerald-600 font-bold">CPK: R$ 0,08</div>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </Card>
 </div>
 );
}

