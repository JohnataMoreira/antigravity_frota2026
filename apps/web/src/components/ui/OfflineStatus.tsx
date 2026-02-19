import { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { db } from '../../lib/offline-db';
import { useLiveQuery } from 'dexie-react-hooks';

export function OfflineStatus() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const pendingCount = useLiveQuery(() => db.pendingChecklists.where('synced').equals(0).count());

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (isOnline && (!pendingCount || pendingCount === 0)) return null;

    return (
        <div className={`
            fixed bottom-20 left-1/2 -translate-x-1/2 z-50
            flex items-center gap-3 px-4 py-2 rounded-full
            shadow-2xl border transition-all duration-500
            ${isOnline
                ? 'bg-blue-600 border-blue-400 text-white animate-pulse'
                : 'bg-red-600 border-red-400 text-white'}
        `}>
            {isOnline ? (
                <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                        Sincronizando {pendingCount} pendentes...
                    </span>
                </>
            ) : (
                <>
                    <WifiOff className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                        Modo Offline {pendingCount && pendingCount > 0 ? `(${pendingCount} novos)` : ''}
                    </span>
                </>
            )}
        </div>
    );
}
