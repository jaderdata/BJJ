import React from 'react';
import { useLoading } from '../contexts/LoadingContext';
import { Loader2 } from 'lucide-react';

export const LoadingOverlay: React.FC = () => {
    const { isLoading } = useLoading();

    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300">
            <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                    {/* Outer Glow */}
                    <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full scale-150 animate-pulse"></div>

                    {/* Spinner */}
                    <Loader2
                        className="w-12 h-12 text-emerald-500 animate-spin relative z-10"
                        strokeWidth={3}
                    />
                </div>

                <div className="flex flex-col items-center">
                    <span className="text-white font-black text-lg tracking-widest uppercase animate-pulse">
                        Processando
                    </span>
                    <div className="flex space-x-1 mt-1">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};
