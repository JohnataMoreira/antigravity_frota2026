import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Download, X } from 'lucide-react';

interface PWAContextType {
    isInstallable: boolean;
    installPWA: () => void;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export function PWAProvider({ children }: { children: React.ReactNode }) {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);

            // Opcional: Mostrar um toast discreto informando que o app pode ser instalado
            toast.custom((t) => (
                <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white dark:bg-gray-900 shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-4 border border-primary/20`}>
                    <div className="flex-1 w-0">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 pt-0.5">
                                <Download className="h-10 w-10 text-primary" />
                            </div>
                            <div className="ml-3 flex-1">
                                <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">
                                    Instalar Frota2026
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground font-bold uppercase tracking-widest">
                                    Adicione à sua tela inicial para acesso rápido e offline.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex flex-col gap-2">
                        <button
                            onClick={() => {
                                installPWA();
                                toast.dismiss(t.id);
                            }}
                            className="w-full border border-transparent rounded-xl p-2 flex items-center justify-center text-xs font-black bg-primary text-white hover:bg-primary/90 focus:outline-none"
                        >
                            INSTALAR
                        </button>
                        <button
                            onClick={() => toast.dismiss(t.id)}
                            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-2 flex items-center justify-center text-xs font-black text-gray-500 hover:text-gray-700 focus:outline-none"
                        >
                            DEPOIS
                        </button>
                    </div>
                </div>
            ), { duration: 10000, position: 'bottom-right' });
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const installPWA = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setIsInstallable(false);
        }
    };

    return (
        <PWAContext.Provider value={{ isInstallable, installPWA }}>
            {children}
        </PWAContext.Provider>
    );
}

export function usePWA() {
    const context = useContext(PWAContext);
    if (!context) {
        throw new Error('usePWA must be used within a PWAProvider');
    }
    return context;
}
