import React from 'react';
import { GlassCard } from './ui/Cards';

interface KanbanColumn {
    id: string;
    title: string;
    count: number;
    color: string;
}

interface KanbanBoardProps<T> {
    columns: KanbanColumn[];
    items: T[];
    renderCard: (item: T) => React.ReactNode;
    getItemColumnId: (item: T) => string;
}

export function KanbanBoard<T>({ columns, items, renderCard, getItemColumnId }: KanbanBoardProps<T>) {
    return (
        <div className="flex gap-6 overflow-x-auto pb-6 -mx-4 px-4 scrollbar-hide">
            {columns.map((column) => {
                const columnItems = items.filter((item) => getItemColumnId(item) === column.id);

                return (
                    <div key={column.id} className="flex-shrink-0 w-80 flex flex-col gap-4">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-2">
                                <div className={`w-2.5 h-2.5 rounded-full ${column.color}`} />
                                <h3 className="font-black text-foreground uppercase tracking-wider text-sm">
                                    {column.title}
                                </h3>
                            </div>
                            <span className="bg-muted text-muted-foreground text-[10px] font-black px-2 py-0.5 rounded-full border border-border/50">
                                {columnItems.length}
                            </span>
                        </div>

                        <div className="bg-card/30 backdrop-blur-sm rounded-3xl p-3 flex flex-col gap-4 min-h-[500px] border-2 border-dashed border-border/40">
                            {columnItems.map((item, index) => (
                                <div key={(item as any).id || index} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    {renderCard(item)}
                                </div>
                            ))}

                            {columnItems.length === 0 && (
                                <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground/30 gap-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest">Vazio</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
