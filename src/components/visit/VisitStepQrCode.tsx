
import React from 'react';
import { QrCode, MessageCircle, Smartphone, ExternalLink } from 'lucide-react';
import { hapticFeedback } from '../../lib/utils';
import { Visit, VisitStatus } from '../../types';

interface VisitStepQrCodeProps {
    generateShareLink: () => string;
    handleShareWhatsApp: () => void;
    handleShareSMS: () => void;
    onFinish: (v: any) => void;
    visit: Partial<Visit>;
}

export const VisitStepQrCode: React.FC<VisitStepQrCodeProps> = ({
    generateShareLink,
    handleShareWhatsApp,
    handleShareSMS,
    onFinish,
    visit
}) => {
    return (
        <div className="space-y-12 animate-in zoom-in-95 duration-700 text-center py-10">
            <div className="space-y-2">
                <div className="inline-flex p-3 bg-emerald-500/20 text-emerald-500 rounded-2xl mb-4">
                    <QrCode size={32} strokeWidth={1.5} />
                </div>
                <h4 className="text-3xl font-black text-white tracking-tighter">Resgate Pronto!</h4>
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest leading-relaxed">
                    Mostre este código para o responsável<br />da academia ou envie o link.
                </p>
            </div>

            <div className="relative inline-block group">
                <div className="absolute -inset-8 bg-emerald-500/10 blur-[60px] rounded-full animate-pulse transition-all group-hover:bg-emerald-500/20"></div>
                <div className="relative bg-white p-6 rounded-[3rem] shadow-2xl border-[6px] border-emerald-500/10 transition-transform duration-700 hover:rotate-2">
                    <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(generateShareLink())}`}
                        alt="Voucher QR Code"
                        className="w-56 h-56 mx-auto mix-blend-multiply"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                <button
                    onClick={() => { hapticFeedback('medium'); handleShareWhatsApp(); }}
                    className="bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 py-4 rounded-[1.5rem] font-black text-[9px] uppercase tracking-widest flex items-center justify-center space-x-2 active:scale-95 transition-all hover:bg-emerald-600/20"
                >
                    <MessageCircle size={14} />
                    <span>WhatsApp</span>
                </button>

                <button
                    onClick={() => { hapticFeedback('medium'); handleShareSMS(); }}
                    className="bg-sky-600/10 border border-sky-500/20 text-sky-400 py-4 rounded-[1.5rem] font-black text-[9px] uppercase tracking-widest flex items-center justify-center space-x-2 active:scale-95 transition-all hover:bg-sky-600/20"
                >
                    <Smartphone size={14} />
                    <span>SMS Direct</span>
                </button>

                <button
                    onClick={() => { hapticFeedback('light'); window.open(generateShareLink(), '_blank'); }}
                    className="col-span-2 bg-white/5 border border-white/10 text-white/40 mb-2 py-3 rounded-xl font-black text-[8px] uppercase tracking-[0.2em] flex items-center justify-center space-x-2 active:scale-95 transition-all hover:bg-white/10"
                >
                    <ExternalLink size={12} />
                    <span>Acessar Landing Page</span>
                </button>
            </div>

            <button
                onClick={() => {
                    hapticFeedback('success');
                    const finalVisit = {
                        ...visit,
                        status: VisitStatus.VISITED,
                        finishedAt: new Date().toISOString()
                    };
                    onFinish(finalVisit);
                }}
                className="w-full h-20 bg-emerald-600 text-white rounded-[2.5rem] font-black text-xl uppercase tracking-widest shadow-2xl shadow-emerald-500/40 active:scale-[0.98] transition-all"
            >
                Concluir Visita
            </button>
        </div>
    );
};
