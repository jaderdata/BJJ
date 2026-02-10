
import React from 'react';
import { CheckCircle2, AlertCircle, Bell, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface GlobalToastProps {
    toast: { message: string, type: 'success' | 'info' | 'error' } | null;
    onClose: () => void;
}

export const GlobalToast: React.FC<GlobalToastProps> = ({ toast, onClose }) => {
    if (!toast) return null;

    return (
        <div className="fixed top-20 right-4 left-4 md:left-auto md:w-96 z-[200] animate-in slide-in-from-top-4 duration-500">
            <div className={cn(
                "p-4 rounded-[1.5rem] shadow-2xl border backdrop-blur-xl flex items-center space-x-3",
                toast.type === 'success' ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" :
                    toast.type === 'error' ? "bg-red-500/20 border-red-500/30 text-red-400" :
                        "bg-zinc-800 border-white/10 text-white"
            )}>
                <div className={cn(
                    "p-2 rounded-xl",
                    toast.type === 'success' ? "bg-emerald-500/20" :
                        toast.type === 'error' ? "bg-red-500/20" :
                            "bg-white/10"
                )}>
                    {toast.type === 'success' ? <CheckCircle2 size={18} /> :
                        toast.type === 'error' ? <AlertCircle size={18} /> :
                            <Bell size={18} />}
                </div>
                <div className="flex-1">
                    <p className="text-sm font-black leading-tight">{toast.message}</p>
                </div>
                <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};
