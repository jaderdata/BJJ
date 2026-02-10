
import React from 'react';
import { TrendingUp, Bell, X } from 'lucide-react';
import { DatabaseService } from '../lib/supabase';
import { Notification, User } from '../types';

interface SystemAlertsProps {
    notifications: Notification[];
    currentUser: User;
    setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
}

export const SystemAlerts: React.FC<SystemAlertsProps> = ({ notifications, currentUser, setNotifications }) => {
    const alerts = notifications.filter(n => n.userId === currentUser.id && !n.read);
    if (alerts.length === 0) return null;

    return (
        <div className="mb-8 space-y-3 max-w-2xl">
            <div className="flex items-center space-x-2 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4 ml-2">
                <TrendingUp size={12} />
                <span>Alertas do Sistema</span>
            </div>
            {alerts.map((n) => (
                <div key={n.id} className="group relative overflow-hidden bg-gradient-to-r from-neutral-800 to-neutral-800/50 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-4 flex justify-between items-center shadow-xl animate-in slide-in-from-left-4 duration-500 hover:border-white/20 transition-all">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                    <div className="flex items-center space-x-4 relative z-10">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-emerald-400 border border-white/5 group-hover:scale-110 transition-transform">
                            <Bell size={18} strokeWidth={2} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white/90 leading-tight">{n.message}</p>
                            <p className="text-[10px] text-white/30 font-medium mt-1 uppercase tracking-wider">há poucos segundos</p>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            setNotifications(prev => prev.map(notif => notif.id === n.id ? { ...notif, read: true } : notif));
                            DatabaseService.markNotificationAsRead(n.id).catch(err => console.error("Error marking read:", err));
                        }}
                        className="relative z-10 p-2 text-white/20 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>
            ))}
        </div>
    );
};
