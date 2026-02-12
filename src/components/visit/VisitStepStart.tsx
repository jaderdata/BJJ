
import React from 'react';
import { Play, Clock, ChevronRight } from 'lucide-react';
import { hapticFeedback } from '../../lib/utils';

interface VisitStepStartProps {
    onStart: () => void;
}

export const VisitStepStart: React.FC<VisitStepStartProps> = ({ onStart }) => {
    const handleStart = () => {
        hapticFeedback('medium');
        onStart();
    };

    return (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-10 animate-in zoom-in-95 duration-500">
            <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/20 blur-[60px] rounded-full animate-pulse"></div>
                <div className="relative w-32 h-32 bg-neutral-900 border-2 border-emerald-500/30 text-emerald-500 rounded-[3rem] flex items-center justify-center shadow-2xl shadow-emerald-500/10 transition-transform hover:scale-105 duration-500">
                    <Play size={48} strokeWidth={1} fill="currentColor" className="ml-1 opacity-20" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Clock size={40} strokeWidth={1.5} className="animate-[spin_10s_linear_infinite]" />
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <h4 className="text-3xl font-black text-white tracking-tighter">Pronto para a visita?</h4>
                <p className="text-white/40 text-sm max-w-xs mx-auto leading-relaxed font-medium">
                    O cronômetro iniciará assim que você tocar no botão abaixo. Garanta um registro fiel do seu esforço.
                </p>
            </div>

            <button
                onClick={handleStart}
                className="group relative w-full h-20 bg-emerald-600 rounded-[2.5rem] p-1 flex items-center shadow-2xl shadow-emerald-500/20 active:scale-[0.98] transition-all overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-full h-full rounded-[2.2rem] border-2 border-white/20 flex items-center justify-center space-x-3 relative z-10 transition-transform group-hover:scale-[0.99]">
                    <span className="text-white text-xl font-black uppercase tracking-tight">Iniciar Atendimento</span>
                    <ChevronRight size={24} className="text-white group-hover:translate-x-1 transition-transform" />
                </div>
            </button>
        </div>
    );
};
