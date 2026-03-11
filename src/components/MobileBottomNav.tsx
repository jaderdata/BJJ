import React from 'react';
import { CalendarDays, Wallet, User as UserIcon, Building2, TrendingUp } from 'lucide-react';
import { cn } from '../lib/utils';
import { UserRole } from '../types';

interface MobileBottomNavProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    userRole: UserRole;
    followUpOverdueCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeTab, setActiveTab, userRole, followUpOverdueCount = 0 }) => {
    const tabs = [
        { id: 'my_events', label: 'Eventos', icon: CalendarDays, activeIds: ['my_events', 'visit_detail'], badge: 0 },
        ...(userRole === UserRole.CALL_CENTER ? [{ id: 'academies', label: 'Academias', icon: Building2, activeIds: ['academies'], badge: 0 }] : []),
        { id: 'follow_up', label: 'Follow-Up', icon: TrendingUp, activeIds: ['follow_up'], badge: followUpOverdueCount },
        { id: 'sales_finance', label: 'Finanças', icon: Wallet, activeIds: ['sales_finance'], badge: 0 },
        { id: 'profile', label: 'Perfil', icon: UserIcon, activeIds: ['profile'], badge: 0 },
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
                            width: `calc(((100% - 32px) / ${tabs.length}) - 12px)`, // Slot width minus gap
                            left: `calc(16px + 6px + ${activeIndex} * ((100% - 32px) / ${tabs.length}))` // Left padding + half gap + index offset
                        }}
                    />
                )}

                {tabs.map((tab) => {
                    const isActive = tab.activeIds.includes(activeTab);
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex flex-col items-center justify-center flex-1 h-16 rounded-2xl transition-all duration-500 relative z-10 group",
                                isActive ? 'text-amber-400' : 'text-neutral-500 hover:text-neutral-300'
                            )}
                        >
                            <div className="relative">
                                <Icon
                                    size={22}
                                    strokeWidth={isActive ? 2.5 : 1.5}
                                    className={cn(
                                        "transition-all duration-500",
                                        isActive ? "scale-110 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]" : "scale-100"
                                    )}
                                />
                                {tab.badge > 0 && (
                                    <span className="absolute -top-1.5 -right-2.5 min-w-[14px] h-[14px] px-0.5 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center leading-none">
                                        {tab.badge > 99 ? '99+' : tab.badge}
                                    </span>
                                )}
                            </div>
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
