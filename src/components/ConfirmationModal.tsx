
import React from 'react';
import { X, AlertCircle } from 'lucide-react';
import { cn, hapticFeedback } from '../lib/utils';

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    type?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    type = 'warning',
    onConfirm,
    onCancel
}) => {
    if (!isOpen) return null;

    const handleConfirm = () => {
        hapticFeedback('medium');
        onConfirm();
    };

    const handleCancel = () => {
        hapticFeedback('light');
        onCancel();
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={handleCancel}
            />

            {/* Modal Content */}
            <div className={cn(
                "relative w-full max-w-sm bg-neutral-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300",
                type === 'danger' ? 'ring-1 ring-red-500/20' : type === 'warning' ? 'ring-1 ring-amber-500/20' : 'ring-1 ring-emerald-500/20'
            )}>
                {/* Decorative background flare */}
                <div className={cn(
                    "absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full -mr-16 -mt-16 pointer-events-none opacity-20",
                    type === 'danger' ? 'bg-red-500' : type === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                )}></div>

                <div className="p-8 space-y-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className={cn(
                            "w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-xl",
                            type === 'danger' ? 'bg-red-500/10 text-red-500' : type === 'warning' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
                        )}>
                            <AlertCircle size={32} />
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-white italic uppercase tracking-tight">{title}</h3>
                            <p className="text-white/40 text-xs font-medium leading-relaxed">{message}</p>
                        </div>
                    </div>

                    <div className="flex flex-col space-y-3">
                        <button
                            onClick={handleConfirm}
                            className={cn(
                                "w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 shadow-lg",
                                type === 'danger' ? 'bg-red-600 text-white' : type === 'warning' ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'
                            )}
                        >
                            {confirmLabel}
                        </button>

                        <button
                            onClick={handleCancel}
                            className="w-full py-4 bg-white/5 hover:bg-white/10 text-white/40 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 border border-white/5"
                        >
                            {cancelLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
