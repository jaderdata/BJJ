import React from 'react';
import { CalendarDays, Wallet, LogOut } from 'lucide-react';

interface MobileBottomNavProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    logout: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeTab, setActiveTab, logout }) => {
    return (
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-neutral-900 border-t border-neutral-800 flex items-center justify-around z-50 px-2 pb-safe">
            <button
                onClick={() => setActiveTab('my_events')}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'my_events' || activeTab === 'visit_detail' ? 'text-white' : 'text-neutral-500'
                    }`}
            >
                <CalendarDays size={20} strokeWidth={activeTab === 'my_events' || activeTab === 'visit_detail' ? 2.5 : 1.5} />
                <span className="text-[10px] font-bold">Eventos</span>
            </button>

            <button
                onClick={() => setActiveTab('sales_finance')}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'sales_finance' ? 'text-white' : 'text-neutral-500'
                    }`}
            >
                <Wallet size={20} strokeWidth={activeTab === 'sales_finance' ? 2.5 : 1.5} />
                <span className="text-[10px] font-bold">Financeiro</span>
            </button>

            <button
                onClick={logout}
                className="flex flex-col items-center justify-center w-full h-full space-y-1 text-red-500/70 hover:text-red-500"
            >
                <LogOut size={20} strokeWidth={1.5} />
                <span className="text-[10px] font-bold">Sair</span>
            </button>
        </div>
    );
};
