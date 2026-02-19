import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Map, Truck, Users, FileText, X, Command } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CommandSearch() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const navigate = useNavigate();

    const navigation = [
        { name: 'Painel', href: '/dashboard', icon: Map, category: 'Navegação' },
        { name: 'Veículos', href: '/vehicles', icon: Truck, category: 'Navegação' },
        { name: 'Motoristas', href: '/users', icon: Users, category: 'Navegação' },
        { name: 'Relatórios', href: '/reports', icon: FileText, category: 'Navegação' },
    ];

    const toggleOpen = useCallback(() => setIsOpen(prev => !prev), []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                toggleOpen();
            }
            if (e.key === '/' && !isOpen && document.activeElement?.tagName !== 'INPUT') {
                e.preventDefault();
                toggleOpen();
            }
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, toggleOpen]);

    const filteredItems = query === ''
        ? navigation
        : navigation.filter(item =>
            item.name.toLowerCase().includes(query.toLowerCase()) ||
            item.category.toLowerCase().includes(query.toLowerCase())
        );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 sm:px-6">
            <div
                className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={() => setIsOpen(false)}
            />

            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center px-4 py-3 border-b border-neutral-100">
                    <Search className="w-5 h-5 text-neutral-400 mr-3" />
                    <input
                        autoFocus
                        className="flex-1 bg-transparent border-none outline-none text-lg text-neutral-900 placeholder:text-neutral-400"
                        placeholder="O que você está procurando?"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <div className="flex items-center gap-1 px-2 py-1 bg-neutral-100 rounded text-[10px] font-bold text-neutral-500 uppercase tracking-tight">
                        <kbd>ESC</kbd>
                    </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {filteredItems.length === 0 ? (
                        <div className="py-12 text-center text-neutral-500">
                            Nenhum resultado encontrado para "{query}"
                        </div>
                    ) : (
                        <div className="space-y-4 py-2">
                            {['Navegação'].map(category => {
                                const items = filteredItems.filter(i => i.category === category);
                                if (items.length === 0) return null;
                                return (
                                    <div key={category}>
                                        <h3 className="px-3 text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                                            {category}
                                        </h3>
                                        <div className="space-y-1">
                                            {items.map(item => (
                                                <button
                                                    key={item.name}
                                                    className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-primary-50 hover:text-primary-900 rounded-xl transition-all group"
                                                    onClick={() => {
                                                        navigate(item.href);
                                                        setIsOpen(false);
                                                    }}
                                                >
                                                    <item.icon className="w-5 h-5 mr-3 text-neutral-400 group-hover:text-primary-600" />
                                                    <span className="flex-1 text-left">{item.name}</span>
                                                    <Command className="w-4 h-4 text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="px-4 py-3 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1"><kbd className="bg-white border rounded px-1 shadow-sm font-sans text-[10px]">↑↓</kbd> para navegar</span>
                        <span className="flex items-center gap-1"><kbd className="bg-white border rounded px-1 shadow-sm font-sans text-[10px]">ENTER</kbd> para selecionar</span>
                    </div>
                    <span>Frota2026 Omnibar</span>
                </div>
            </div>
        </div>
    );
}
