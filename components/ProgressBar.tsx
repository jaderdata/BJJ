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
        <div className={`bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-sm ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                    Progresso de Visitas
                </h3>
                <span className="text-2xl font-black text-white tabular-nums">
                    {percentage}%
                </span>
            </div>

            {/* Progress Bar */}
            <div className="relative w-full h-4 bg-slate-900 rounded-full overflow-hidden mb-4 border border-slate-700">
                <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-500 ease-out rounded-full"
                    style={{ width: `${percentage}%` }}
                >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-900/30 p-4 rounded-2xl border border-emerald-800/50 flex items-center space-x-3">
                    <div className="p-2 bg-emerald-600/20 rounded-xl">
                        <CheckCircle2 size={20} className="text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Concluídas</p>
                        <p className="text-2xl font-black text-white tabular-nums">{completed}</p>
                    </div>
                </div>

                <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700 flex items-center space-x-3">
                    <div className="p-2 bg-slate-700 rounded-xl">
                        <Clock size={20} className="text-slate-400" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Pendentes</p>
                        <p className="text-2xl font-black text-white tabular-nums">{pending}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
