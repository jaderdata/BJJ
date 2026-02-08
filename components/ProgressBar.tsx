import React from 'react';

interface ProgressBarProps {
    percentage: number;
    className?: string;
    height?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ percentage, className = '', height = 'h-4' }) => {
    return (
        <div className={`relative w-full ${height} bg-white/5 rounded-full overflow-hidden border border-white/5 ${className}`}>
            <div
                className="h-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-teal-400 transition-all duration-1000 ease-out relative"
                style={{ width: `${percentage}%` }}
            >
                {/* Glossy overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
                {/* Animated shine */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
            </div>
        </div>
    );
};
