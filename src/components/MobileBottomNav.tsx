import React from 'react';
import { CalendarDays, Wallet, User as UserIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface MobileBottomNavProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeTab, setActiveTab }) => {
    const tabs = [
        { id: 'my_events', label: 'Eventos', icon: CalendarDays, activeIds: ['my_events', 'visit_detail'] },
        { id: 'sales_finance', label: 'Finanças', icon: Wallet, activeIds: ['sales_finance'] },
        { id: 'profile', label: 'Perfil', icon: UserIcon, activeIds: ['profile'] },
    ];

    const activeIndex = tabs.findIndex(tab => tab.activeIds.includes(activeTab));

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[110] px-6 pb-6 pt-2">
            <div className="mx-auto max-w-md bg-[#121212]/90 backdrop-blur-md border border-white/10 rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.8)] flex items-center justify-between h-20 px-4 relative overflow-hidden">
                {/* Decorative background pulse */}
                <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent opacity-30 pointer-events-none"></div>

                {/* Sliding active indicator pill */}
                {activeIndex !== -1 && (
                    <div
                        className="absolute h-14 bg-white/5 border border-white/10 rounded-2xl transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-0"
                        style={{
                            width: 'calc((100% - 104px) / 3)', // Adjusted for 3 slots (2 tabs + logout)
                            left: `calc(16px + ${activeIndex} * (100% - 32px) / 3)`
                        }}
                    />
                )}

                {tabs.map((tab, idx) => {
                    const isActive = tab.activeIds.includes(activeTab);
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex flex-col items-center justify-center flex-1 h-16 rounded-2xl transition-all duration-500 relative z-10 group",
                                isActive ? 'text-emerald-400' : 'text-neutral-500 hover:text-neutral-300'
                            )}
                        >
                            <Icon
                                size={22}
                                strokeWidth={isActive ? 2.5 : 1.5}
                                className={cn(
                                    "transition-all duration-500",
                                    isActive ? "scale-110 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]" : "scale-100"
                                )}
                            />
                            <span className={cn(
                                "text-[9px] font-black uppercase tracking-[0.15em] mt-1.5 transition-all duration-500",
                                isActive ? "opacity-100 translate-y-0" : "opacity-40"
                            )}>
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
