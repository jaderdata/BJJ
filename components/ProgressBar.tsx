import React from 'react';
import { CheckCircle2, Clock } from 'lucide-react';

interface ProgressBarProps {
    total: number;
    completed: number;
    className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ total, completed, className = '' }) => {
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    const pending = total - completed;

    return (
        <div className={`bg-neutral-800 p-8 rounded-[2rem] border border-neutral-700 shadow-2xl ${className} relative overflow-hidden`}>
            {/* Subtle Gradient Background */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-[80px] rounded-full -mr-16 -mt-16 pointer-events-none"></div>

            <div className="flex items-center justify-between mb-6 relative">
                <div className="space-y-1">
                    <h3 className="text-xs font-black text-neutral-500 uppercase tracking-[0.2em]">
                        Progresso de Visitas
                    </h3>
                    <p className="text-[10px] text-neutral-600 font-bold uppercase">Meta de Atendimento</p>
                </div>
                <div className="text-right">
                    <span className="text-4xl font-black text-white italic tracking-tighter">
                        {percentage}%
                    </span>
                </div>
            </div>

            {/* Progress Bar Container */}
            <div className="relative w-full h-8 bg-neutral-950 rounded-2xl p-1.5 border border-neutral-800 mb-8">
                <div
                    className="h-full bg-gradient-to-r from-neutral-700 via-neutral-500 to-neutral-300 opacity-90 transition-all duration-700 ease-out rounded-xl relative group shadow-lg shadow-neutral-900/40"
                    style={{ width: `${percentage}%` }}
                >
                    {/* Glossy overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-xl"></div>
                    {/* Animated shine */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite] rounded-xl"></div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 relative">
                <div className="bg-neutral-900/40 p-5 rounded-3xl border border-neutral-700/30 flex flex-col justify-between hover:border-emerald-500/30 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2.5 bg-emerald-900/30 text-emerald-400 rounded-xl">
                            <CheckCircle2 size={24} />
                        </div>
                        <span className="text-[10px] font-black text-emerald-500/40 bg-emerald-900/10 px-2 py-0.5 rounded-full uppercase">Realizadas</span>
                    </div>
                    <div>
                        <p className="text-3xl font-black text-white tabular-nums leading-none tracking-tighter">{completed}</p>
                        <p className="text-[10px] text-neutral-500 font-bold mt-1 uppercase tracking-widest">Academias visitadas</p>
                    </div>
                </div>

                <div className="bg-neutral-900/40 p-5 rounded-3xl border border-neutral-700/30 flex flex-col justify-between hover:border-neutral-500/30 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2.5 bg-neutral-800 text-neutral-400 rounded-xl">
                            <Clock size={24} />
                        </div>
                        <span className="text-[10px] font-black text-neutral-500 bg-neutral-800/20 px-2 py-0.5 rounded-full uppercase">Pendentes</span>
                    </div>
                    <div>
                        <p className="text-3xl font-black text-white tabular-nums leading-none tracking-tighter">{pending}</p>
                        <p className="text-[10px] text-neutral-500 font-bold mt-1 uppercase tracking-widest">Restantes na lista</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
