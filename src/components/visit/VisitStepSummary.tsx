
import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { cn, hapticFeedback } from '../../lib/utils';
import { Visit, AcademyTemperature } from '../../types';

interface VisitStepSummaryProps {
    visit: Partial<Visit>;
    handleStartEdit: () => void;
    onCancel: () => void;
}

export const VisitStepSummary: React.FC<VisitStepSummaryProps> = ({
    visit,
    handleStartEdit,
    onCancel
}) => {
    return (
        <div className="space-y-2 animate-in slide-in-from-bottom-10 duration-700">
            <div className="flex flex-col items-center justify-center space-y-1 text-center">
                <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full scale-150"></div>
                    <div className="relative w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-[2rem] flex items-center justify-center border border-emerald-500/20 shadow-xl overflow-hidden group">
                        <div className="absolute inset-0 bg-emerald-500 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                        <CheckCircle2 size={48} strokeWidth={2.5} className="animate-in zoom-in-50 duration-500" />
                    </div>
                </div>
                <div>
                    <h4 className="text-3xl font-black text-white tracking-tighter">Visitado 🏁</h4>
                    <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mt-2 italic">Registro persistido no sistema</p>
                </div>
            </div>

            <div className="space-y-4 pl-8 border-l-2 border-emerald-500/10 relative mx-2">
                <div className="relative">
                    <div className="absolute -left-[39px] top-1.5 w-4 h-4 bg-[#0a0a0a] border-4 border-emerald-500 rounded-full shadow-lg shadow-emerald-500/20"></div>
                    <div className="space-y-3">
                        <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Resumo da Atividade</span>
                        <div className="bg-white/5 rounded-[2rem] p-6 border border-white/10 space-y-4">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <span className="text-[9px] uppercase font-black text-white/20 tracking-widest">Contato</span>
                                    <p className="text-sm font-black text-white/90">{visit.contactPerson}</p>
                                </div>
                                <div className="space-y-2">
                                    <span className="text-[9px] uppercase font-black text-white/20 tracking-widest">Temperatura</span>
                                    <div className="flex items-center space-x-2">
                                        <div className={cn(
                                            "w-2 h-2 rounded-full",
                                            visit.temperature === AcademyTemperature.HOT ? 'bg-red-500' : visit.temperature === AcademyTemperature.WARM ? 'bg-amber-500' : 'bg-blue-500'
                                        )}></div>
                                        <span className={cn(
                                            "text-xs font-black uppercase tracking-tight",
                                            visit.temperature === AcademyTemperature.HOT ? 'text-red-400' : visit.temperature === AcademyTemperature.WARM ? 'text-amber-400' : 'text-blue-400'
                                        )}>
                                            {visit.temperature}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            {visit.summary && (
                                <div className="pt-4 border-t border-white/5">
                                    <span className="text-[9px] uppercase font-black text-white/20 tracking-widest">Observações</span>
                                    <p className="text-xs text-white/60 leading-relaxed italic mt-2">"{visit.summary}"</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="relative">
                    <div className="absolute -left-[39px] top-1.5 w-4 h-4 bg-[#0a0a0a] border-4 border-white/10 rounded-full"></div>
                    <div className="space-y-3">
                        <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Evidências & Marketing</span>
                        <div className="flex flex-wrap gap-2">
                            {visit.leftBanner && <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-full text-[9px] font-black uppercase">Banner 🚩</div>}
                            {visit.leftFlyers && <div className="bg-sky-500/10 text-sky-400 border border-sky-500/20 px-3 py-1.5 rounded-full text-[9px] font-black uppercase">Flyers 📄</div>}
                            {visit.photos?.map((p, i) => (
                                <div key={i} className="w-12 h-12 rounded-xl overflow-hidden border border-white/10">
                                    <img src={p} alt={`Visit Photo ${i + 1}`} className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-8 pb-12">
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => { hapticFeedback('light'); handleStartEdit(); }}
                        className="bg-white/5 border border-white/10 text-white/60 py-5 rounded-[2.5rem] font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
                    >
                        Refazer/Editar
                    </button>
                    <button
                        onClick={() => { hapticFeedback('medium'); onCancel(); }}
                        className="bg-emerald-600 text-white py-5 rounded-[2.5rem] font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-2xl shadow-emerald-500/40"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};
