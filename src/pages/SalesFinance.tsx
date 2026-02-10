import React from 'react';
import {
    CheckCircle2,
    Clock,
    DollarSign,
    Wallet,
    TrendingUp
} from 'lucide-react';
import { FinanceRecord, FinanceStatus, Event } from '../types';
import { cn } from '../lib/utils';

interface SalesFinanceProps {
    finance: FinanceRecord[];
    events: Event[];
    onConfirm: (id: string) => void;
}

export const SalesFinance: React.FC<SalesFinanceProps> = ({
    finance,
    events,
    onConfirm
}) => {
    const getStatusBadge = (status: FinanceStatus) => {
        switch (status) {
            case FinanceStatus.RECEIVED:
                return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Concluído', icon: <CheckCircle2 size={12} /> };
            case FinanceStatus.PAID:
                return { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Pago', icon: <Clock size={12} /> };
            case FinanceStatus.PENDING:
                return { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Pendente', icon: <Clock size={12} /> };
            default:
                return { bg: 'bg-white/5', text: 'text-white/40', label: status, icon: <Clock size={12} /> };
        }
    };

    // Calculate totals
    const totalAmount = finance.reduce((sum, f) => sum + f.amount, 0);
    const receivedAmount = finance.filter(f => f.status === FinanceStatus.RECEIVED).reduce((sum, f) => sum + f.amount, 0);
    const pendingAmount = finance.filter(f => f.status === FinanceStatus.PENDING).reduce((sum, f) => sum + f.amount, 0);

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
            {/* Header - Premium Monochrome/Emerald */}
            <div className="relative group overflow-hidden bg-neutral-900 border border-white/10 p-8 rounded-[2.5rem] shadow-2xl transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>

                <div className="relative z-10 space-y-2">
                    <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-black text-emerald-500/60 uppercase tracking-[0.3em]">Finanças Pessoais</span>
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tighter italic uppercase">Controle de Verbas</h1>
                        <p className="text-white/40 text-xs font-medium uppercase tracking-widest mt-1">Gestão de repasses por evento</p>
                    </div>
                </div>
            </div>

            {/* KPI Section with improved cards */}
            <div className="space-y-6">
                <div className="flex items-center space-x-2 px-2">
                    <h2 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Resumo do Portfólio</h2>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div className="relative group overflow-hidden bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 shadow-xl transition-all duration-500 hover:border-emerald-500/20">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors"></div>
                        <div className="flex items-end justify-between relative z-10">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Total Acumulado</p>
                                <p className="text-4xl font-black text-white italic tracking-tighter tabular-nums">${totalAmount.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 border border-white/5 rounded-[1.5rem] p-5 space-y-1">
                            <p className="text-[9px] font-black text-emerald-500/40 uppercase tracking-[0.15em]">Confirmado</p>
                            <p className="text-xl font-black text-white tracking-tighter">${receivedAmount.toFixed(2)}</p>
                        </div>
                        <div className="bg-white/5 border border-white/5 rounded-[1.5rem] p-5 space-y-1 text-right">
                            <p className="text-[9px] font-black text-amber-500/40 uppercase tracking-[0.15em] text-right">A Receber</p>
                            <p className="text-xl font-black text-white tracking-tighter">${pendingAmount.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Finance Records List Overhaul */}
            <div className="space-y-6">
                <div className="flex items-center space-x-2 px-2">
                    <h2 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Histórico de Lançamentos</h2>
                </div>

                <div className="space-y-4">
                    {finance.length === 0 ? (
                        <div className="bg-neutral-900/50 border border-white/5 rounded-[2.5rem] py-20 flex flex-col items-center space-y-4 text-center">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-white/10 border border-white/5">
                                <DollarSign size={32} strokeWidth={1} />
                            </div>
                            <p className="text-xs font-black text-white/20 uppercase tracking-widest leading-relaxed px-10">Nenhum registro financeiro<br />atribuído ao seu perfil.</p>
                        </div>
                    ) : (
                        finance.map((f, idx) => {
                            const badge = getStatusBadge(f.status);
                            const event = events.find(e => e.id === f.eventId);

                            return (
                                <div
                                    key={f.id}
                                    className="group relative overflow-hidden bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-[2.5rem] shadow-xl transition-all duration-500 hover:border-white/20 animate-in slide-in-from-bottom-4"
                                    style={{ animationDelay: `${idx * 100}ms` }}
                                >
                                    <div className="p-6 relative z-10 space-y-6">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1 max-w-[70%]">
                                                <div className="flex items-center space-x-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                    <h4 className="text-sm font-black text-white uppercase tracking-tight truncate">
                                                        {event?.name || 'Evento não encontrado'}
                                                    </h4>
                                                </div>
                                                <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest truncate">
                                                    Referente ao projeto alocado
                                                </p>
                                            </div>
                                            <div className={cn(
                                                "flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border",
                                                badge.bg, badge.text, "border-white/5"
                                            )}>
                                                {badge.icon}
                                                <span>{badge.label}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-end justify-between">
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Verba Destinada</p>
                                                <p className="text-3xl font-black text-white italic tracking-tighter tabular-nums">
                                                    ${f.amount.toFixed(2)}
                                                </p>
                                            </div>

                                            <div className="text-right">
                                                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Atualizado em</p>
                                                <p className="text-[10px] font-bold text-white/40 mt-1">
                                                    {new Date(f.updatedAt || f.createdAt).toLocaleDateString('pt-BR')}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Action Button Integrated */}
                                        {f.status === FinanceStatus.PAID && (
                                            <button
                                                onClick={() => onConfirm(f.id)}
                                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center space-x-3 active:scale-[0.98]"
                                            >
                                                <CheckCircle2 size={18} strokeWidth={3} />
                                                <span>Confirmar Recebimento</span>
                                            </button>
                                        )}

                                        {f.status === FinanceStatus.RECEIVED && (
                                            <div className="w-full bg-white/5 border border-white/5 text-white/40 h-12 rounded-2xl font-black text-[9px] uppercase tracking-[0.3em] flex items-center justify-center space-x-2">
                                                <CheckCircle2 size={14} className="opacity-40" />
                                                <span>Transação Finalizada</span>
                                            </div>
                                        )}

                                        {f.status === FinanceStatus.PENDING && (
                                            <div className="w-full bg-amber-500/10 border border-amber-500/10 text-amber-500/60 h-12 rounded-2xl font-black text-[9px] uppercase tracking-[0.3em] flex items-center justify-center space-x-2">
                                                <Clock size={14} className="opacity-40 animate-pulse" />
                                                <span>Aguardando Lançamento Admin</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};
