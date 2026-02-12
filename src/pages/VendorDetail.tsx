import React, { useMemo, useState } from 'react';
import { User, Visit, Event, FinanceRecord, VisitStatus, AcademyTemperature, ContactPerson } from '../types';
import {
    ArrowLeft,
    Download,
    MapPin,
    Calendar,
    Briefcase,
    Building2,
    CheckCircle2,
    TrendingUp,
    Clock,
    Ticket,
    Flag,
    FileText,
    UserCheck,
    AlertCircle
} from 'lucide-react';
import { mkConfig, generateCsv, download } from 'export-to-csv';

interface VendorDetailProps {
    vendor: User;
    visits: Visit[];
    events: Event[];
    finance: FinanceRecord[];
    onBack: () => void;
}

export const VendorDetail: React.FC<VendorDetailProps> = ({
    vendor,
    visits,
    events,
    finance,
    onBack
}) => {
    // --- Data Processing ---

    // Base Sets
    const vendorVisits = useMemo(() => visits.filter(v => v.salespersonId === vendor.id), [visits, vendor.id]);
    const completedVisits = useMemo(() => vendorVisits.filter(v => v.status === VisitStatus.VISITED), [vendorVisits]);
    const vendorEvents = useMemo(() => events.filter(e => e.salespersonId === vendor.id), [events, vendor.id]);
    const vendorFinance = useMemo(() => finance.filter(f => f.salespersonId === vendor.id), [finance, vendor.id]);

    // Aggregates
    const uniqueAcademies = useMemo(() => new Set(vendorVisits.map(v => v.academyId)).size, [vendorVisits]);
    const totalReceived = vendorFinance.reduce((sum, f) => sum + f.amount, 0);
    const totalVouchers = useMemo(() => completedVisits.reduce((sum, v) => sum + (v.vouchersGenerated?.length || 0), 0), [completedVisits]);

    // Materials
    const bannersLeft = useMemo(() => completedVisits.filter(v => v.leftBanner).length, [completedVisits]);
    const flyersLeft = useMemo(() => completedVisits.filter(v => v.leftFlyers).length, [completedVisits]);

    // Breakdown: Temperature
    const tempStats = useMemo(() => {
        const counts = { [AcademyTemperature.HOT]: 0, [AcademyTemperature.WARM]: 0, [AcademyTemperature.COLD]: 0 };
        completedVisits.forEach(v => {
            if (v.temperature && counts[v.temperature] !== undefined) counts[v.temperature]++;
        });
        return counts;
    }, [completedVisits]);

    // Breakdown: Contact
    const contactStats = useMemo(() => {
        const counts = { [ContactPerson.OWNER]: 0, [ContactPerson.TEACHER]: 0, [ContactPerson.STAFF]: 0, [ContactPerson.NOBODY]: 0 };
        completedVisits.forEach(v => {
            if (v.contactPerson && counts[v.contactPerson] !== undefined) counts[v.contactPerson]++;
        });
        return counts;
    }, [completedVisits]);

    // Avg Time Calculation
    const avgVisitMinutes = useMemo(() => {
        const timedVisits = completedVisits.filter(v => v.startedAt && v.finishedAt);
        if (completedVisits.length === 0) return 0; // Prevent div/0

        const totalMinutes = timedVisits.reduce((sum, v) => {
            const start = new Date(v.startedAt!).getTime();
            const end = new Date(v.finishedAt!).getTime();
            return sum + ((end - start) / 1000 / 60);
        }, 0);

        return Math.round(totalMinutes / completedVisits.length); // Divide by total completed visits
    }, [completedVisits]);

    // Recent Activity Feed (Top 50)
    const recentActivity = useMemo(() => {
        return [...completedVisits].sort((a, b) => {
            const dateA = a.finishedAt ? new Date(a.finishedAt).getTime() : 0;
            const dateB = b.finishedAt ? new Date(b.finishedAt).getTime() : 0;
            return dateB - dateA;
        }).slice(0, 50);
    }, [completedVisits]);


    const handleExport = () => {
        const csvConfig = mkConfig({ useKeysAsHeaders: true, filename: `relatorio_detalhado_${vendor.name.replace(/\s+/g, '_')}` });
        const exportData = vendorVisits.map(v => {
            const event = events.find(e => e.id === v.eventId);
            return {
                Vendedor: vendor.name,
                Evento: event?.name || 'N/A',
                Data: v.finishedAt ? new Date(v.finishedAt).toLocaleDateString() : 'N/A',
                Status: v.status,
                'Tempo (min)': v.startedAt && v.finishedAt ? Math.round((new Date(v.finishedAt).getTime() - new Date(v.startedAt).getTime()) / 60000) : '',
                Temperatura: v.temperature || '',
                Contato: v.contactPerson || '',
                'Banner Deixado': v.leftBanner ? 'Sim' : 'Não',
                'Flyers Deixados': v.leftFlyers ? 'Sim' : 'Não',
                Vouchers: v.vouchersGenerated?.length || 0,
                Notas: v.notes || ''
            };
        });

        if (exportData.length === 0) return alert("Sem dados para exportar.");
        const csv = generateCsv(csvConfig)(exportData);
        download(csvConfig)(csv);
    };

    const formatTime = (minutes: number) => {
        if (minutes < 60) return `${minutes} min`;
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}h ${m}m`;
    };

    return (
        <div className="space-y-8 p-6 md:p-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4">
            {/* Sticky Header */}
            <div className="flex items-center justify-between sticky top-0 bg-neutral-950/80 backdrop-blur-xl z-50 py-4 -mx-6 px-6 border-b border-white/5">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 -ml-2 hover:bg-white/10 rounded-xl transition-colors text-white"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                            {vendor.name}
                            <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">Ativo</span>
                        </h1>
                        <p className="text-xs text-neutral-400 font-mono">{vendor.email}</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleExport}
                        className="flex items-center space-x-2 bg-white text-neutral-900 hover:bg-neutral-200 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg"
                    >
                        <Download size={14} />
                        <span className="hidden md:inline">Exportar Relatório</span>
                    </button>
                </div>
            </div>

            {/* Top Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-neutral-900 border border-white/5 p-5 rounded-2xl relative overflow-hidden group hover:border-white/10 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <CheckCircle2 size={64} />
                    </div>
                    <p className="text-neutral-400 text-xs font-black uppercase tracking-widest mb-1">Visitas Realizadas</p>
                    <p className="text-3xl font-black text-white">{completedVisits.length}</p>
                    <p className="text-xs text-neutral-500 mt-2">de {vendorVisits.length} planejadas</p>
                </div>

                <div className="bg-neutral-900 border border-white/5 p-5 rounded-2xl relative overflow-hidden group hover:border-white/10 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Ticket size={64} />
                    </div>
                    <p className="text-neutral-400 text-xs font-black uppercase tracking-widest mb-1">Vouchers Gerados</p>
                    <p className="text-3xl font-black text-white">{totalVouchers}</p>
                    <p className="text-xs text-neutral-500 mt-2">em {uniqueAcademies} academias distintas</p>
                </div>

                <div className="bg-neutral-900 border border-white/5 p-5 rounded-2xl relative overflow-hidden group hover:border-white/10 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Clock size={64} />
                    </div>
                    <p className="text-neutral-400 text-xs font-black uppercase tracking-widest mb-1">Tempo Médio/Visita</p>
                    <p className="text-3xl font-black text-white">{formatTime(avgVisitMinutes)}</p>
                    <p className="text-xs text-neutral-500 mt-2">dedicação por parceiro</p>
                </div>

                <div className="bg-neutral-900 border border-white/5 p-5 rounded-2xl relative overflow-hidden group hover:border-white/10 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp size={64} />
                    </div>
                    <p className="text-neutral-400 text-xs font-black uppercase tracking-widest mb-1">Financeiro</p>
                    <p className="text-3xl font-black text-emerald-400">$ {totalReceived.toFixed(0)}</p>
                    <p className="text-xs text-neutral-500 mt-2">total recebido/lançado</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Col: Analysis */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Quality & Contact */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Termometer */}
                        <div className="bg-neutral-900 border border-white/5 p-6 rounded-2xl">
                            <div className="flex items-center gap-2 mb-6">
                                <MapPin className="text-amber-500" size={20} />
                                <h3 className="text-sm font-black text-white uppercase tracking-wider">Temperatura das Visitas</h3>
                            </div>
                            <div className="space-y-4">
                                {[
                                    { label: 'Quente (Hot)', val: tempStats[AcademyTemperature.HOT], color: 'bg-red-500' },
                                    { label: 'Morno (Warm)', val: tempStats[AcademyTemperature.WARM], color: 'bg-amber-500' },
                                    { label: 'Frio (Cold)', val: tempStats[AcademyTemperature.COLD], color: 'bg-blue-500' },
                                ].map(item => (
                                    <div key={item.label}>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-neutral-400 font-bold">{item.label}</span>
                                            <span className="text-white font-bold">{item.val}</span>
                                        </div>
                                        <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                                            <div className={`h-full ${item.color}`} style={{ width: `${completedVisits.length ? (item.val / completedVisits.length) * 100 : 0}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Contact Person */}
                        <div className="bg-neutral-900 border border-white/5 p-6 rounded-2xl">
                            <div className="flex items-center gap-2 mb-6">
                                <UserCheck className="text-blue-500" size={20} />
                                <h3 className="text-sm font-black text-white uppercase tracking-wider">Interlocutores</h3>
                            </div>
                            <div className="space-y-3">
                                {[
                                    { label: 'Dono/Responsável', val: contactStats[ContactPerson.OWNER], color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                                    { label: 'Professor', val: contactStats[ContactPerson.TEACHER], color: 'text-blue-400', bg: 'bg-blue-500/10' },
                                    { label: 'Staff/Recepção', val: contactStats[ContactPerson.STAFF], color: 'text-purple-400', bg: 'bg-purple-500/10' },
                                    { label: 'Ninguém Disponível', val: contactStats[ContactPerson.NOBODY], color: 'text-red-400', bg: 'bg-red-500/10' }
                                ].map(item => (
                                    <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5">
                                        <span className={`text-xs font-bold ${item.color}`}>{item.label}</span>
                                        <span className="text-white font-black">{item.val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity Log */}
                    <div className="bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center">
                            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                                <FileText size={16} />
                                Histórico de Atividades
                            </h3>
                            <span className="text-xs text-neutral-500 font-bold">Últimas 50 visitas</span>
                        </div>
                        <div className="divide-y divide-white/5">
                            {recentActivity.map((visit, i) => {
                                const event = events.find(e => e.id === visit.eventId);
                                const duration = visit.startedAt && visit.finishedAt
                                    ? Math.round((new Date(visit.finishedAt).getTime() - new Date(visit.startedAt).getTime()) / 60000)
                                    : null;

                                return (
                                    <div key={visit.id} className="p-4 hover:bg-white/[0.02] transition-colors group">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="text-white font-bold text-sm">Visita em Academia</p>
                                                <p className="text-xs text-neutral-400">{event?.name || 'Evento Desconhecido'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-neutral-300">
                                                    {visit.finishedAt ? new Date(visit.finishedAt).toLocaleDateString() : 'N/A'}
                                                </p>
                                                <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold">
                                                    {duration ? formatTime(duration) : '-'}
                                                </p>
                                            </div>
                                        </div>

                                        {visit.summary && (
                                            <p className="text-xs text-neutral-400 bg-black/20 p-2 rounded-lg border border-white/5 mb-3 line-clamp-2 italic">
                                                "{visit.summary}"
                                            </p>
                                        )}

                                        <div className="flex flex-wrap gap-2">
                                            {visit.temperature && (
                                                <span className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase ${visit.temperature === AcademyTemperature.HOT ? 'bg-red-500/10 text-red-500' :
                                                        visit.temperature === AcademyTemperature.WARM ? 'bg-amber-500/10 text-amber-500' :
                                                            'bg-blue-500/10 text-blue-500'
                                                    }`}>
                                                    {visit.temperature}
                                                </span>
                                            )}
                                            {visit.vouchersGenerated && visit.vouchersGenerated.length > 0 && (
                                                <span className="text-[10px] px-2 py-1 rounded-md font-bold uppercase bg-emerald-500/10 text-emerald-500 flex items-center gap-1">
                                                    <Ticket size={10} />
                                                    {visit.vouchersGenerated.length} Vouchers
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Col: Details & Materials */}
                <div className="space-y-6">
                    {/* Materials Card */}
                    <div className="bg-neutral-900 border border-white/5 p-6 rounded-2xl">
                        <div className="flex items-center gap-2 mb-6">
                            <Flag className="text-purple-500" size={20} />
                            <h3 className="text-sm font-black text-white uppercase tracking-wider">Materiais Entregues</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5 text-center">
                                <p className="text-3xl font-black text-white mb-1">{bannersLeft}</p>
                                <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Banners</p>
                            </div>
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5 text-center">
                                <p className="text-3xl font-black text-white mb-1">{flyersLeft}</p>
                                <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Flyers</p>
                            </div>
                        </div>
                    </div>

                    {/* Active Events List */}
                    <div className="bg-neutral-900 border border-white/5 p-6 rounded-2xl">
                        <div className="flex items-center gap-2 mb-6">
                            <Briefcase className="text-teal-500" size={20} />
                            <h3 className="text-sm font-black text-white uppercase tracking-wider">Eventos Ativos</h3>
                        </div>
                        <div className="space-y-4">
                            {vendorEvents.slice(0, 5).map(event => (
                                <div key={event.id} className="p-3 bg-white/[0.02] rounded-xl border border-white/5">
                                    <p className="text-sm font-bold text-white mb-1">{event.name}</p>
                                    <div className="flex justify-between text-xs text-neutral-400">
                                        <span>{event.city}, {event.state}</span>
                                        <span>{new Date(event.startDate).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                            {vendorEvents.length === 0 && (
                                <div className="text-center py-4 text-neutral-500 text-xs italic">
                                    Nenhum evento ativo no momento.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
