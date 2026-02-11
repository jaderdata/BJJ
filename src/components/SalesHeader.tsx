
import React from 'react';
import { User, UserRole } from '../types';

interface SalesHeaderProps {
    user: User;
}

export const SalesHeader: React.FC<SalesHeaderProps> = ({ user }) => {
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

            <div className="flex items-center space-x-3">
                <div className="text-right">
                    <p className="text-xs font-black text-white/90 leading-none">{user.name}</p>
                    <p className="text-[9px] text-white/40 font-bold uppercase tracking-wider mt-1">Consultor</p>
                </div>
            </div>
        </header>
    );
};
