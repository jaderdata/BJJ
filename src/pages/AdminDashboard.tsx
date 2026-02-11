import React, { useState, useMemo, useEffect } from 'react';
import {
    RefreshCw,
    Bell,
    BellOff
} from 'lucide-react';

import {
    User,
    Academy,
    Event,
    EventStatus,
    Visit,
    VisitStatus,
    AcademyTemperature,
    FinanceRecord,
    FinanceStatus,
    Voucher
} from '../types';
import { supabase, DatabaseService } from '../lib/supabase';


interface AdminDashboardProps {
    events: Event[];
    academies: Academy[];
    visits: Visit[];
    vouchers: Voucher[];
    finance: FinanceRecord[];
    vendedores: User[];
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
    events,
    academies,
    visits,
    vouchers,
    finance = [],
    vendedores = []
}) => {
    // Years based ONLY on events as requested
    const availableYears = useMemo(() => {
        const yearsSet = new Set<string>();
        events.forEach(e => { if (e.startDate) yearsSet.add(new Date(e.startDate).getFullYear().toString()); });
        vouchers.forEach(v => { if (v.createdAt) yearsSet.add(new Date(v.createdAt).getFullYear().toString()); });
        visits.forEach(v => { if (v.finishedAt) yearsSet.add(new Date(v.finishedAt).getFullYear().toString()); });

        if (yearsSet.size === 0) yearsSet.add(new Date().getFullYear().toString());

        return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
    }, [events, vouchers, visits]);

    const [selectedYear, setSelectedYear] = useState<string>(availableYears[0] || new Date().getFullYear().toString());
    const [syncingSheet, setSyncingSheet] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [loadingNotifToggle, setLoadingNotifToggle] = useState(false);

    // Load notifications setting on mount
    useEffect(() => {
        const loadNotificationsSetting = async () => {
            try {
                const setting = await DatabaseService.getSetting('admin_notifications_enabled');
                if (setting !== null) {
                    const isEnabled = setting === true || setting === 'true' || setting === '"true"';
                    setNotificationsEnabled(isEnabled);
                }
            } catch (error) {
                console.error('Error loading notifications setting:', error);
            }
        };
        loadNotificationsSetting();
    }, []);

    const handleToggleNotifications = async () => {
        setLoadingNotifToggle(true);
        try {
            const newValue = !notificationsEnabled;
            await DatabaseService.setSetting('admin_notifications_enabled', newValue);
            setNotificationsEnabled(newValue);
        } catch (error) {
            console.error('Error toggling notifications:', error);
            alert('Erro ao alterar configuração de notificações.');
        } finally {
            setLoadingNotifToggle(false);
        }
    };

    const handleSyncSheet = async () => {
        setSyncingSheet(true);
        try {
            const groupedData: Record<string, any[]> = {};

            filteredVouchers.forEach(v => {
                const visit = visits.find(vis => vis.id === v.visitId);
                const event = events.find(e => e.id === v.eventId);
                const eventName = event?.name || 'Sem Evento';
                const academyName = academies.find(a => a.id === v.academyId)?.name || '';
                const sellerName = vendedores.find(u => u.id === (visit?.salespersonId || event?.salespersonId))?.name || '';
                const dateStr = new Date(v.createdAt).toLocaleDateString('pt-BR');

                if (!groupedData[eventName]) {
                    groupedData[eventName] = [];
                }

                groupedData[eventName].push({
                    codigo: v.code,
                    data: dateStr,
                    academia: academyName,
                    vendedor: sellerName,
                    retirado: "NO"
                });
            });

            const { data, error } = await supabase.functions.invoke('sync-vouchers', {
                body: { events: groupedData }
            });

            if (error) throw error;
            if (data && data.error) throw new Error(data.error);

            alert('Sincronização concluída com sucesso!');
        } catch (error: any) {
            console.error('Error syncing sheet:', error);
            alert(error.message || 'Erro inesperado na sincronização.');
        } finally {
            setSyncingSheet(false);
        }
    };

    // Filter Data by Year
    const filteredEvents = useMemo(() => events.filter(e => e.startDate && new Date(e.startDate).getFullYear().toString() === selectedYear), [events, selectedYear]);

    const visitsInYear = useMemo(() => {
        const eventIds = new Set(filteredEvents.map(e => e.id));
        return visits.filter(v => eventIds.has(v.eventId));
    }, [visits, filteredEvents]);

    // KPIs
    const activeEventsCount = events.filter(e =>
        (e.status === EventStatus.IN_PROGRESS || e.status === EventStatus.UPCOMING) &&
        !e.isTest
    ).length;

    const filteredVisits = useMemo(() => {
        return visits.filter(v => {
            const event = events.find(e => e.id === v.eventId);
            if (event?.isTest) return false;

            return v.status === VisitStatus.VISITED &&
                v.finishedAt &&
                new Date(v.finishedAt).getFullYear().toString() === selectedYear;
        });
    }, [visits, selectedYear, events]);

    const filteredVouchers = useMemo(() => {
        return vouchers.filter(v => {
            const event = events.find(e => e.id === v.eventId);
            if (event?.isTest) return false;
            return new Date(v.createdAt).getFullYear().toString() === selectedYear;
        });
    }, [vouchers, selectedYear, events]);

    const activeEvents = useMemo(() =>
        events.filter(e =>
            (e.status === EventStatus.IN_PROGRESS || e.status === EventStatus.UPCOMING) &&
            !e.name.trim().toUpperCase().endsWith('TESTE')
        ), [events]);

    const pendingVisitsCount = useMemo(() => {
        let count = 0;
        activeEvents.forEach(e => {
            const visitedInEvent = (e.academiesIds || []).filter(aid =>
                visits.some(v => v.eventId === e.id && v.academyId === aid && v.status === VisitStatus.VISITED)
            ).length;
            count += Math.max(0, (e.academiesIds?.length || 0) - visitedInEvent);
        });
        return count;
    }, [activeEvents, visits]);

    const activePerformance = useMemo(() => {
        const activeEventIds = new Set(activeEvents.map(e => e.id));

        let totalAssignments = 0;
        activeEvents.forEach(e => {
            totalAssignments += (e.academiesIds?.length || 0);
        });

        let visitedCount = 0;
        activeEvents.forEach(e => {
            visitedCount += (e.academiesIds || []).filter(aid =>
                visits.some(v => v.eventId === e.id && v.academyId === aid && v.status === VisitStatus.VISITED)
            ).length;
        });

        const activeVs = visits.filter(v => activeEventIds.has(v.eventId));

        const counts = { [AcademyTemperature.HOT]: 0, [AcademyTemperature.WARM]: 0, [AcademyTemperature.COLD]: 0 };
        activeVs.filter(v => v.status === VisitStatus.VISITED).forEach(v => {
            if (v.temperature && v.temperature in counts) {
                counts[v.temperature]++;
            }
        });

        const percent = totalAssignments > 0 ? Math.round((visitedCount / totalAssignments) * 100) : 0;

        return {
            completed: visitedCount,
            pending: Math.max(0, totalAssignments - visitedCount),
            total: totalAssignments,
            percent,
            temperatureData: Object.entries(counts).map(([name, value]) => ({ name, value }))
        };
    }, [activeEvents, visits]);

    // Seller Leaderboard
    const sellerLeaderboard = useMemo(() => {
        const stats: Record<string, { name: string, visits: number }> = {};
        vendedores.forEach(v => stats[v.id] = { name: v.name, visits: 0 });

        filteredVisits.forEach(v => {
            if (v.salespersonId && stats[v.salespersonId]) {
                stats[v.salespersonId].visits += 1;
            }
        });

        return Object.values(stats).sort((a, b) => b.visits - a.visits).slice(0, 5);
    }, [vendedores, filteredVisits]);

    return (
        <div className="space-y-6 p-4">
            {/* Header with Gradient */}
            <div className="relative overflow-hidden bg-neutral-900 border border-white/10 p-6 rounded-2xl shadow-2xl">
                {/* Glassmorphism overlay - Optimized for mobile */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent"></div>

                {/* Decorative elements - Simplified blurs */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl -mr-24 -mt-24"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -ml-16 -mb-16"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-black text-white mb-1 tracking-tight">
                            Dashboard
                        </h1>
                        <p className="text-white/80 text-sm font-medium">
                            Visão geral de performance e métricas
                        </p>
                    </div>

                    <div className="flex items-center space-x-3">
                        {/* Notifications Toggle */}
                        <button
                            onClick={handleToggleNotifications}
                            disabled={loadingNotifToggle}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${notificationsEnabled
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-300'
                                }`}
                            title={notificationsEnabled ? 'Notificações Ativadas' : 'Notificações Desativadas'}
                        >
                            {notificationsEnabled ? (
                                <Bell size={16} strokeWidth={2.5} />
                            ) : (
                                <BellOff size={16} strokeWidth={2.5} />
                            )}
                            <span className="hidden md:inline">
                                {notificationsEnabled ? 'Alertas ON' : 'Alertas OFF'}
                            </span>
                        </button>

                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="bg-white/10 backdrop-blur-md border-2 border-white/20 text-white text-sm font-bold rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-white/30 transition-all hover:bg-white/20 cursor-pointer"
                        >
                            {availableYears.map(yr => (
                                <option key={yr} value={yr} className="bg-[hsl(222,47%,15%)] text-white">{yr}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* KPI Cards with Glassmorphism */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    {
                        label: 'Eventos Ativos',
                        value: activeEventsCount,
                        gradient: 'from-blue-500 to-cyan-500',
                        bgGlow: 'bg-blue-500/20',
                        iconBg: 'bg-blue-500/20',
                        iconColor: 'text-blue-400'
                    },
                    {
                        label: 'Visitas Realizadas',
                        value: filteredVisits.length,
                        gradient: 'from-emerald-500 to-teal-500',
                        bgGlow: 'bg-emerald-500/20',
                        iconBg: 'bg-emerald-500/20',
                        iconColor: 'text-emerald-400'
                    },
                    {
                        label: 'Visitas Pendentes',
                        value: pendingVisitsCount,
                        gradient: 'from-amber-500 to-orange-500',
                        bgGlow: 'bg-amber-500/20',
                        iconBg: 'bg-amber-500/20',
                        iconColor: 'text-amber-400'
                    },
                    {
                        label: 'Vouchers Gerados',
                        value: filteredVouchers.length,
                        gradient: 'from-emerald-500 to-blue-500',
                        bgGlow: 'bg-emerald-500/20',
                        iconBg: 'bg-emerald-500/20',
                        iconColor: 'text-emerald-400',
                        hasAction: true
                    }
                ].map((kpi, i) => (
                    <div
                        key={i}
                        className="group relative overflow-hidden bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                    >
                        {/* Glow effect */}
                        <div className={`absolute -top-24 -right-24 w-48 h-48 ${kpi.bgGlow} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

                        <div className="relative z-10">


                            {/* Value */}
                            <div className="mb-2">
                                <h3 className="text-3xl font-black text-white mb-1 tracking-tight">
                                    {kpi.value}
                                </h3>
                                <p className="text-xs font-bold text-white/60 uppercase tracking-wider">
                                    {kpi.label}
                                </p>
                            </div>

                            {/* Action Button */}
                            {kpi.hasAction && (
                                <button
                                    onClick={handleSyncSheet}
                                    disabled={syncingSheet}
                                    className="mt-4 w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg hover:shadow-emerald-500/50"
                                >
                                    <RefreshCw size={14} strokeWidth={2.5} className={syncingSheet ? 'animate-spin' : ''} />
                                    <span>{syncingSheet ? 'Sincronizando...' : 'Atualizar Planilha'}</span>
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Performance Card - Premium Design */}
            <div className="relative overflow-hidden bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/10 rounded-full blur-[80px] -ml-24 -mb-24"></div>

                <div className="relative z-10">
                    {/* Header */}
                    <div className="mb-6">
                        <div className="flex items-center space-x-2 mb-1">
                            <h2 className="text-lg font-black text-white">Performance de Visitas</h2>
                        </div>
                        <p className="text-white/60 text-xs font-medium ml-10">
                            Acompanhamento de eventos ativos em tempo real
                        </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {/* Completed */}
                        <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 backdrop-blur-sm border border-emerald-500/20 rounded-2xl p-4 hover:border-emerald-500/40 transition-all duration-300">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>

                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Concluídas</span>
                                </div>

                                <div className="flex items-baseline space-x-2">
                                    <span className="text-4xl font-black text-white">{activePerformance.completed}</span>
                                    <span className="text-xl font-black text-emerald-400">{activePerformance.percent}%</span>
                                </div>

                                <p className="text-xs text-white/50 font-medium mt-2">
                                    Visitas registradas com sucesso
                                </p>
                            </div>
                        </div>

                        {/* Pending */}
                        <div className="group relative overflow-hidden bg-gradient-to-br from-amber-500/10 to-amber-500/5 backdrop-blur-sm border border-amber-500/20 rounded-2xl p-4 hover:border-amber-500/40 transition-all duration-300">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>

                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-black text-amber-400 uppercase tracking-widest">Pendentes</span>
                                </div>

                                <div className="flex items-baseline space-x-2">
                                    <span className="text-4xl font-black text-white">{activePerformance.pending}</span>
                                    <span className="text-xl font-black text-amber-400">{100 - activePerformance.percent}%</span>
                                </div>

                                <p className="text-xs text-white/50 font-medium mt-2">
                                    Aguardando atendimento oficial
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-black text-white/60 uppercase tracking-widest">Progresso Total</span>
                            <span className="text-lg font-black text-white">{activePerformance.percent}%</span>
                        </div>
                        <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/10 p-0.5">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-full transition-all duration-1000 shadow-lg shadow-emerald-500/50"
                                style={{ width: `${activePerformance.percent}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Temperature Indicators */}
                    <div className="pt-8 border-t border-white/10">
                        <h3 className="text-sm font-black text-white/60 uppercase tracking-widest mb-6">Indicador de Interesse</h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {(() => {
                                // Calculate total of all temperatures
                                const totalTemperatures = activePerformance.temperatureData.reduce((sum, t) => sum + t.value, 0);

                                return [
                                    { label: 'Quente', key: AcademyTemperature.HOT, color: 'from-red-500 to-orange-500', textColor: 'text-red-400' },
                                    { label: 'Morno', key: AcademyTemperature.WARM, color: 'from-blue-500 to-cyan-500', textColor: 'text-blue-400' },
                                    { label: 'Frio', key: AcademyTemperature.COLD, color: 'from-gray-500 to-gray-600', textColor: 'text-gray-400' }
                                ].map((temp) => {
                                    const count = activePerformance.temperatureData.find(t => t.name === temp.key)?.value || 0;
                                    // Calculate percentage based on total temperatures, not total completed visits
                                    const percent = totalTemperatures > 0 ? Math.round((count / totalTemperatures) * 100) : 0;

                                    return (
                                        <div key={temp.key} className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-black text-white/60 uppercase tracking-widest">{temp.label}</span>
                                                <span className={`text-xl font-black ${temp.textColor}`}>{count}</span>
                                            </div>
                                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full bg-gradient-to-r ${temp.color} rounded-full transition-all duration-1000 shadow-lg`}
                                                    style={{ width: `${percent}%` }}
                                                ></div>
                                            </div>
                                            <p className={`text-sm font-black ${temp.textColor}`}>{percent}%</p>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Grid - Leaderboard & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Top Sellers */}
                <div className="relative overflow-hidden bg-neutral-900 border border-white/10 p-6 rounded-2xl shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent backdrop-blur-sm"></div>
                    <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl -mr-24 -mt-24"></div>

                    <div className="relative z-10">
                        <div className="flex items-center space-x-2 mb-4">
                            <h3 className="text-lg font-black text-white">Top Vendedores</h3>
                        </div>

                        <div className="space-y-3">
                            {sellerLeaderboard.map((seller, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between p-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300 group"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${idx === 0 ? 'bg-gradient-to-br from-yellow-500 to-orange-500 text-white shadow-lg shadow-yellow-500/50' :
                                            idx === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-500 text-white shadow-lg shadow-gray-500/50' :
                                                idx === 2 ? 'bg-gradient-to-br from-orange-600 to-orange-700 text-white shadow-lg shadow-orange-600/50' :
                                                    'bg-white/10 text-white/60'
                                            }`}>
                                            {idx + 1}
                                        </div>
                                        <span className="font-bold text-white group-hover:text-white/90 transition-colors">{seller.name}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-xl font-black text-white">{seller.visits}</span>
                                        <span className="text-xs font-bold text-white/50">visitas</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent Finance */}
                <div className="relative overflow-hidden bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl -mr-24 -mt-24"></div>

                    <div className="relative z-10">
                        <div className="flex items-center space-x-2 mb-4">
                            <h3 className="text-lg font-black text-white">Últimos Lançamentos</h3>
                        </div>

                        <div className="space-y-3">
                            {[...finance]
                                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                                .slice(0, 5)
                                .map(f => (
                                    <div
                                        key={f.id}
                                        className="flex items-center justify-between p-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div>
                                                <p className="text-sm font-bold text-white">
                                                    {events.find(e => e.id === f.eventId)?.name || 'Evento'}
                                                </p>
                                                <p className="text-xs text-white/50 font-medium">
                                                    {new Date(f.updatedAt).toLocaleDateString('pt-BR')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-base font-black text-white">${f.amount.toFixed(2)}</p>
                                            <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase ${f.status === FinanceStatus.PENDING ? 'bg-amber-500/20 text-amber-400' :
                                                f.status === FinanceStatus.PAID ? 'bg-white/10 text-white/50' :
                                                    'bg-emerald-500/20 text-emerald-400'
                                                }`}>
                                                {f.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            {finance.length === 0 && (
                                <p className="text-white/50 text-sm text-center py-8">Nenhum lançamento recente.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
