import React, { useState, useEffect } from 'react';
import { Shield, Clock, X, AlertTriangle } from 'lucide-react';

interface AdminModeIndicatorProps {
    expiresAt: string;
    onRevoke: () => void;
    userName: string;
}

const AdminModeIndicator: React.FC<AdminModeIndicatorProps> = ({ expiresAt, onRevoke, userName }) => {
    const [timeRemaining, setTimeRemaining] = useState<number>(0);
    const [showWarning, setShowWarning] = useState(false);

    useEffect(() => {
        const updateTimer = () => {
            const now = new Date().getTime();
            const expiry = new Date(expiresAt).getTime();
            const remaining = Math.max(0, Math.floor((expiry - now) / 1000));

            setTimeRemaining(remaining);

            // Mostrar aviso 5 minutos antes de expirar
            if (remaining <= 300 && remaining > 0) {
                setShowWarning(true);
            }

            // Auto-revoke quando expirar
            if (remaining === 0) {
                onRevoke();
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [expiresAt, onRevoke]);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getProgressPercentage = (): number => {
        const totalDuration = 30 * 60; // 30 minutos em segundos
        return (timeRemaining / totalDuration) * 100;
    };

    const getColorClass = (): string => {
        if (timeRemaining <= 300) return 'bg-red-500'; // Últimos 5 minutos
        if (timeRemaining <= 600) return 'bg-amber-500'; // Últimos 10 minutos
        return 'bg-emerald-500'; // Normal
    };

    const getTextColorClass = (): string => {
        if (timeRemaining <= 300) return 'text-red-400';
        if (timeRemaining <= 600) return 'text-amber-400';
        return 'text-emerald-400';
    };

    const getBgColorClass = (): string => {
        if (timeRemaining <= 300) return 'bg-red-500/10 border-red-500/30';
        if (timeRemaining <= 600) return 'bg-amber-500/10 border-amber-500/30';
        return 'bg-emerald-500/10 border-emerald-500/30';
    };

    return (
        <div className="fixed top-0 left-0 right-0 z-[90] animate-in slide-in-from-top duration-500">
            {/* Main Banner */}
            <div className={`${getBgColorClass()} border-b backdrop-blur-xl`}>
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        {/* Left: Status */}
                        <div className="flex items-center space-x-3">
                            <div className={`p-2 ${getColorClass()} rounded-lg animate-pulse`}>
                                <Shield size={18} className="text-white" strokeWidth={2.5} />
                            </div>
                            <div>
                                <div className="flex items-center space-x-2">
                                    <h3 className={`text-sm font-black ${getTextColorClass()} uppercase tracking-wider`}>
                                        Modo Administrativo Ativo
                                    </h3>
                                    {showWarning && (
                                        <AlertTriangle size={14} className="text-red-400 animate-pulse" />
                                    )}
                                </div>
                                <p className="text-xs text-neutral-400 font-medium mt-0.5">
                                    {userName} • Sessão expira em <span className={`font-bold ${getTextColorClass()}`}>{formatTime(timeRemaining)}</span>
                                </p>
                            </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center space-x-3">
                            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-neutral-900/50 rounded-lg border border-neutral-700">
                                <Clock size={14} className="text-neutral-400" />
                                <span className={`text-sm font-mono font-bold ${getTextColorClass()}`}>
                                    {formatTime(timeRemaining)}
                                </span>
                            </div>
                            <button
                                onClick={onRevoke}
                                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-lg font-bold text-xs transition-colors flex items-center space-x-2 border border-neutral-700"
                            >
                                <X size={14} />
                                <span>Sair do Modo Admin</span>
                            </button>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3 h-1 bg-neutral-900/50 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${getColorClass()} transition-all duration-1000 ease-linear`}
                            style={{ width: `${getProgressPercentage()}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Warning Banner (últimos 5 minutos) */}
            {showWarning && (
                <div className="bg-red-500/20 border-b border-red-500/30 backdrop-blur-xl animate-in slide-in-from-top">
                    <div className="max-w-7xl mx-auto px-4 py-2">
                        <div className="flex items-center justify-center space-x-2 text-xs">
                            <AlertTriangle size={14} className="text-red-400" />
                            <p className="text-red-400 font-bold">
                                Sua sessão administrativa expirará em breve. Salve seu trabalho ou renove a sessão.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminModeIndicator;
