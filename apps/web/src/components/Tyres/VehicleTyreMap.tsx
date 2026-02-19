import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { Disc } from 'lucide-react';

interface TyreItem {
 id: string;
 identifier: string;
 axle: number;
 position: string;
 status: string;
}

interface VehicleTyreMapProps {
 tyres: TyreItem[];
 config?: '4x2' | '6x2' | '6x4';
}

export function VehicleTyreMap({ tyres, config = '4x2' }: VehicleTyreMapProps) {
 const renderAxle = (axleNumber: number, type: 'STEER' | 'DRIVE' | 'SUPPORT') => {
 const axleTyres = tyres.filter(t => t.axle === axleNumber);
 const isDouble = type !== 'STEER';

 return (
 <div key={axleNumber} className="flex flex-col items-center gap-2 py-4 border-b last:border-0 ">
 <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Eixo {axleNumber} ({type})</span>

 <div className="flex items-center gap-12">
 {/* Left Side */}
 <div className="flex gap-1">
 {isDouble && <TyreGraphic tyre={axleTyres.find(t => t.position === 'LE')} label="LE" />}
 <TyreGraphic tyre={axleTyres.find(t => t.position === (isDouble ? 'LI' : 'L'))} label={isDouble ? 'LI' : 'L'} />
 </div>

 {/* Axle bar */}
 <div className="w-24 h-4 bg-gray-200 rounded-full flex items-center justify-center">
 <div className="w-20 h-0.5 bg-gray-300 " />
 </div>

 {/* Right Side */}
 <div className="flex gap-1">
 <TyreGraphic tyre={axleTyres.find(t => t.position === (isDouble ? 'RI' : 'R'))} label={isDouble ? 'RI' : 'R'} />
 {isDouble && <TyreGraphic tyre={axleTyres.find(t => t.position === 'RE')} label="RE" />}
 </div>
 </div>
 </div>
 );
 };

 return (
 <Card className="p-6 bg-gray-50/50 border-none shadow-inner">
 <div className="flex flex-col gap-4">
 {renderAxle(1, 'STEER')}
 {renderAxle(2, 'DRIVE')}
 {config !== '4x2' && renderAxle(3, config === '6x4' ? 'DRIVE' : 'SUPPORT')}
 </div>
 </Card>
 );
}

function TyreGraphic({ tyre, label }: { tyre?: TyreItem; label: string }) {
 return (
 <div className={`
 relative w-10 h-16 rounded-md border-2 transition-all flex flex-col items-center justify-center gap-1
 ${tyre
 ? 'border-blue-500 bg-blue-50 text-blue-600'
 : 'border-dashed border-gray-300 bg-white text-gray-400'}
 `}>
 <Disc size={16} />
 <span className="text-[8px] font-black">{tyre ? tyre.identifier : label}</span>
 {tyre && (
 <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 shadow-sm" />
 )}
 </div>
 );
}

