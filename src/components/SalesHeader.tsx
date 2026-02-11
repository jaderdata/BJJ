
import React from 'react';
import { User, UserRole } from '../types';
import { cn } from '../lib/utils';

interface SalesHeaderProps {
    user: User;
}

export const SalesHeader: React.FC<SalesHeaderProps> = ({ user }) => {
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
        <header className="sticky top-0 z-40 bg-black/40 backdrop-blur-xl border-b border-white/5 px-6 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3 transition-transform active:scale-95 cursor-default">
                <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
                    <img src="/oss_logo1.png" alt="Logo" className="w-full h-full object-contain mix-blend-screen" />
                </div>
                <div>
                    <h1 className="text-base font-black text-white tracking-tight leading-none italic">BJJVisits</h1>
                    <p className="text-[9px] text-emerald-500/70 font-black uppercase tracking-widest mt-0.5">Live Dashboard</p>
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
                                    ? "bg-emerald-500 ring-emerald-500/20 animate-pulse"
                                    : "bg-red-500 ring-red-500/20"
                            )}></div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};
