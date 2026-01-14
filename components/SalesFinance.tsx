import React from 'react';
import {
    Wallet,
    CheckCircle2,
    Clock,
    DollarSign,
    TrendingUp
} from 'lucide-react';
import { FinanceRecord, FinanceStatus, Event } from '../types';

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
                return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Concluído' };
            case FinanceStatus.PAID:
                return { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Pago' };
            case FinanceStatus.PENDING:
                return { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Pendente' };
            default:
                return { bg: 'bg-white/10', text: 'text-white/60', label: status };
        }
    };

    // Calculate totals
    const totalAmount = finance.reduce((sum, f) => sum + f.amount, 0);
    const receivedAmount = finance.filter(f => f.status === FinanceStatus.RECEIVED).reduce((sum, f) => sum + f.amount, 0);
    const pendingAmount = finance.filter(f => f.status === FinanceStatus.PENDING).reduce((sum, f) => sum + f.amount, 0);

    return (
        <div className="space-y-6 p-4">
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[hsl(262,83%,58%)] via-[hsl(262,83%,48%)] to-[hsl(262,83%,38%)] p-6 rounded-2xl shadow-2xl">
                <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -ml-16 -mb-16"></div>

                <div className="relative z-10">
                    <h1 className="text-xl md:text-2xl font-black text-white mb-1 tracking-tight">
                        Controle Financeiro
                    </h1>
                    <p className="text-white/80 text-sm font-medium">
                        Gestão de pagamentos e recebimentos
                    </p>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    {
                        label: 'Total',
                        value: `$${totalAmount.toFixed(2)}`,
                        icon: DollarSign,
                        gradient: 'from-purple-500 to-pink-500',
                        bgGlow: 'bg-purple-500/20',
                        iconBg: 'bg-purple-500/20',
                        iconColor: 'text-purple-400'
                    },
                    {
                        label: 'Recebido',
                        value: `$${receivedAmount.toFixed(2)}`,
                        icon: CheckCircle2,
                        gradient: 'from-emerald-500 to-teal-500',
                        bgGlow: 'bg-emerald-500/20',
                        iconBg: 'bg-emerald-500/20',
                        iconColor: 'text-emerald-400'
                    },
                    {
                        label: 'Pendente',
                        value: `$${pendingAmount.toFixed(2)}`,
                        icon: Clock,
                        gradient: 'from-amber-500 to-orange-500',
                        bgGlow: 'bg-amber-500/20',
                        iconBg: 'bg-amber-500/20',
                        iconColor: 'text-amber-400'
                    }
                ].map((kpi, i) => (
                    <div
                        key={i}
                        className="group relative overflow-hidden bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                    >
                        <div className={`absolute -top-24 -right-24 w-48 h-48 ${kpi.bgGlow} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

                        <div className="relative z-10">
                            {/* <div className={`inline-flex p-2 rounded-xl ${kpi.iconBg} ${kpi.iconColor} mb-2 group-hover:scale-110 transition-transform duration-300`}>
                                <kpi.icon size={18} strokeWidth={2} />
                            </div> */}

                            <div>
                                <h3 className="text-2xl font-black text-white mb-1 tracking-tight">
                                    {kpi.value}
                                </h3>
                                <p className="text-xs font-bold text-white/60 uppercase tracking-wider">
                                    {kpi.label}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Finance Records */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {finance.length === 0 ? (
                    <div className="col-span-2 text-center py-20">
                        <div className="inline-flex p-4 bg-white/5 rounded-2xl mb-4 font-bold text-xl text-white/20">
                            $
                        </div>
                        <p className="text-white/40 font-medium">Nenhum registro financeiro</p>
                    </div>
                ) : (
                    finance.map(f => {
                        const badge = getStatusBadge(f.status);
                        const event = events.find(e => e.id === f.eventId);

                        return (
                            <div
                                key={f.id}
                                className="group relative overflow-hidden bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl hover:shadow-2xl transition-all duration-500"
                            >
                                {/* Glow effect */}
                                <div className={`absolute -top-24 -right-24 w-48 h-48 ${f.status === FinanceStatus.RECEIVED ? 'bg-emerald-500/20' :
                                    f.status === FinanceStatus.PAID ? 'bg-blue-500/20' :
                                        'bg-amber-500/20'
                                    } rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

                                <div className="relative z-10">
                                    {/* Header */}
                                    <div className="flex justify-between items-start mb-3">
                                        <div className={`p-2 ${badge.bg} rounded-xl`}>
                                            {/* Icon removed */}
                                        </div>
                                        <span className={`text-xs font-black px-2 py-1 rounded-lg uppercase ${badge.bg} ${badge.text}`}>
                                            {badge.label}
                                        </span>
                                    </div>

                                    {/* Content */}
                                    <h4 className="text-base font-black text-white mb-1">
                                        {event?.name || 'Evento não encontrado'}
                                    </h4>
                                    <p className="text-3xl font-black text-white mb-4 tabular-nums">
                                        ${f.amount.toFixed(2)}
                                    </p>

                                    {/* Action Button */}
                                    {f.status === FinanceStatus.PAID && (
                                        <button
                                            onClick={() => onConfirm(f.id)}
                                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-emerald-500/50 flex items-center justify-center space-x-2"
                                        >
                                            <span>Confirmar Recebimento</span>
                                        </button>
                                    )}

                                    {f.status === FinanceStatus.RECEIVED && (
                                        <div className="w-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 py-3 rounded-xl font-bold text-center text-xs flex items-center justify-center space-x-2">
                                            <span>RECEBIDO E CONCLUÍDO</span>
                                        </div>
                                    )}

                                    {f.status === FinanceStatus.PENDING && (
                                        <div className="w-full bg-amber-500/10 border border-amber-500/20 text-amber-400 py-3 rounded-xl font-bold text-center text-xs flex items-center justify-center space-x-2">
                                            <span>AGUARDANDO PAGAMENTO</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
