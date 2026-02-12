
import React from 'react';
import { Minus, Plus, QrCode } from 'lucide-react';
import { cn, hapticFeedback } from '../../lib/utils';
import { Visit } from '../../types';

interface VisitStepVouchersProps {
    vouchers: string[];
    adjust: (count: number) => void;
    handleFinishWithQr: () => void;
    setStep: (step: any) => void;
}

export const VisitStepVouchers: React.FC<VisitStepVouchersProps> = ({
    vouchers = [],
    adjust,
    handleFinishWithQr,
    setStep
}) => {
    return (
        <div className="space-y-12 animate-in slide-in-from-right-10 duration-500 text-center py-10">
            <div className="space-y-2">
                <h4 className="text-3xl font-black text-white tracking-tighter italic uppercase">Gerador de Vouchers</h4>
                <p className="text-white/40 text-xs font-medium max-w-[200px] mx-auto uppercase tracking-widest">
                    Selecione o volume de benefícios para esta academia.
                </p>
            </div>

            <div className="relative group flex items-center justify-center space-x-12 py-10">
                <div className="absolute inset-0 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none"></div>

                <button
                    onClick={() => { hapticFeedback('light'); adjust(-1); }}
                    className="w-20 h-20 bg-white/5 rounded-[2rem] border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-90 shadow-2xl"
                >
                    <Minus size={24} strokeWidth={3} />
                </button>

                <div className="flex flex-col items-center">
                    <div className="text-8xl font-black text-white italic tracking-tighter tabular-nums drop-shadow-[0_10px_30px_rgba(16,185,129,0.3)]">
                        {vouchers.length}
                    </div>
                    <div className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mt-2">Vouchers Ativos</div>
                </div>

                <button
                    onClick={() => { hapticFeedback('medium'); adjust(1); }}
                    className="w-20 h-20 bg-emerald-500 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-emerald-500/40 hover:bg-emerald-400 transition-all active:scale-90"
                >
                    <Plus size={24} strokeWidth={3} />
                </button>
            </div>

            <div className="flex flex-wrap gap-2 justify-center max-w-sm mx-auto min-h-[40px]">
                {vouchers.map((c, i) => (
                    <div
                        key={i}
                        className="bg-white/5 border border-white/10 px-3 py-2 rounded-xl font-mono text-[10px] font-black text-emerald-400 animate-in zoom-in-95"
                        style={{ animationDelay: `${i * 50}ms` }}
                    >
                        {c}
                    </div>
                ))}
            </div>

            <button
                onClick={() => { hapticFeedback('success'); handleFinishWithQr(); }}
                disabled={!vouchers.length}
                className={cn(
                    "w-full h-20 rounded-[2.5rem] font-black text-lg uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center space-x-4 shadow-2xl",
                    vouchers.length
                        ? "bg-white text-black shadow-white/10"
                        : "bg-white/5 text-white/10 cursor-not-allowed"
                )}
            >
                <QrCode size={24} strokeWidth={2.5} />
                <span>Confirmar Vouchers</span>
            </button>

            <button
                onClick={() => { hapticFeedback('light'); setStep('ACTIVE'); }}
                className="text-white/20 font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors"
            >
                Voltar ao formulário
            </button>
        </div>
    );
};
