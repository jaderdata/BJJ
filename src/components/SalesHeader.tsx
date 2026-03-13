import React from 'react';
import { User, UserRole } from '../types';
import { cn } from '../lib/utils';

interface SalesHeaderProps {
    user: User;
    activeTab?: string;
    onNavigate?: (tab: string) => void;
}

export const SalesHeader: React.FC<SalesHeaderProps> = ({ user, activeTab, onNavigate }) => {
    const [isOnline, setIsOnline] = React.useState(navigator.onLine);

    React.useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <header className="px-6 py-4 bg-[#0a0a0a] border-b border-white/5 relative z-50 flex items-center justify-between">
            <div className="flex items-center space-x-4">
                <div>
                    <h1 className="text-lg font-black text-white tracking-tight leading-none bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                        {user.role === UserRole.CALL_CENTER ? 'Call-Center' : 'Vendedor'}
                    </h1>
                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mt-0.5">
                        {user.role === UserRole.CALL_CENTER ? 'Painel de Atendimento' : 'Painel de Vendas'}
                    </p>
                </div>
            </div>

            <div className="flex items-center space-x-4">
                <div className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                        <p className="text-xs font-black text-white/90 leading-none">{user.name}</p>
                        <div className="relative flex items-center">
                            <div className={cn(
                                "w-2 h-2 rounded-full ring-4 ring-offset-0 transition-all duration-500",
                                isOnline
                                    ? "bg-amber-500 ring-amber-500/20 animate-pulse"
                                    : "bg-red-500 ring-red-500/20"
                            )}></div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};
