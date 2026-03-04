import React, { useMemo, useState } from 'react';
import { User, Visit, Event, FinanceRecord, Academy, Voucher, VisitStatus, AcademyTemperature, ContactPerson, UserRole } from '../types';
import { mkConfig, generateCsv, download } from 'export-to-csv';
import {
    formatTime,
    filterVendorVisits,
    countVendorVouchers,
    calculateTemperatureStats,
    calculateContactStats,
    calculateAvgVisitMinutes,
    calculateTrueVisitDuration
} from '../lib/business-utils';

interface VendorDetailProps {
    vendor: User;
    visits: Visit[];
    events: Event[];
    academies: Academy[];
    vouchers: Voucher[];
    finance: FinanceRecord[];
    onBack: () => void;
}

export const VendorDetail: React.FC<VendorDetailProps> = ({
    vendor,
    visits,
    events,
    academies,
    vouchers,
    finance,
    onBack
}) => {
    // --- Data Processing ---

    const [filterYear, setFilterYear] = useState<string>('');
    const [filterEventId, setFilterEventId] = useState<string>('');

    // Base Sets
    const vendorVisits = useMemo(() => filterVendorVisits(visits, events, vendor.id), [visits, events, vendor.id]);
    const vendorFinance = useMemo(() => finance.filter(f => f.salespersonId === vendor.id), [finance, vendor.id]);

    // Derived Available Filters
    const availableEvents = useMemo(() => {
        const eventIds = new Set(vendorVisits.map(v => v.eventId));
        let evts = events.filter(e => eventIds.has(e.id));
        if (filterYear) {
            evts = evts.filter(e => new Date(e.startDate).getFullYear().toString() === filterYear);
        }
        return evts.sort((a, b) => a.name.localeCompare(b.name));
    }, [vendorVisits, events, filterYear]);

    const availableYears = useMemo(() => {
        const eventIds = new Set(vendorVisits.map(v => v.eventId));
        const evts = events.filter(e => eventIds.has(e.id));
        const years = new Set(evts.map(e => new Date(e.startDate).getFullYear().toString()));
        return Array.from(years).sort((a, b) => b.localeCompare(a));
    }, [vendorVisits, events]);

    // Filtered Display Data
    const displayedVisits = useMemo(() => {
        return vendorVisits.filter(v => {
            const event = events.find(e => e.id === v.eventId);
            if (!event) return false;

            if (filterEventId && event.id !== filterEventId) return false;
            if (filterYear) {
                const eventYear = new Date(event.startDate).getFullYear().toString();
                if (eventYear !== filterYear) return false;
            }
            return true;
        });
    }, [vendorVisits, events, filterEventId, filterYear]);

    const completedVisits = useMemo(() => displayedVisits.filter(v => v.status === VisitStatus.VISITED), [displayedVisits]);

    const displayedFinance = useMemo(() => {
        return vendorFinance.filter(f => {
            const event = events.find(e => e.id === f.eventId);
            if (!event) return false;
            if (filterEventId && event.id !== filterEventId) return false;
            if (filterYear) {
                const eventYear = new Date(event.startDate).getFullYear().toString();
                if (eventYear !== filterYear) return false;
            }
            return true;
        });
    }, [vendorFinance, events, filterEventId, filterYear]);

    const vendorEvents = useMemo(() => events.filter(e => !e.isTest && e.salespersonIds?.includes(vendor.id)), [events, vendor.id]);

    // Aggregates
    const uniqueAcademiesWithVouchers = useMemo(() => {
        const pertinentVouchers = vouchers.filter(v => {
            const event = events.find(e => e.id === v.eventId);
            if (event?.isTest) return false;

            // Must match vendor & filters
            const visit = displayedVisits.find(vis => vis.id === v.visitId);
            if (!visit) return false;

            return visit.vouchersGenerated?.includes(v.code);
        });
        return new Set(pertinentVouchers.map(v => v.academyId)).size;
    }, [vouchers, events, displayedVisits]);

    const totalReceived = displayedFinance.reduce((sum, f) => sum + f.amount, 0);
    const totalVouchersCount = useMemo(() => countVendorVouchers(vouchers, events, displayedVisits, vendor.id), [vouchers, events, displayedVisits, vendor.id]);

    // Materials
    const bannersLeft = useMemo(() => completedVisits.filter(v => v.leftBanner).length, [completedVisits]);

    // Breakdown: Temperature
    const tempStats = useMemo(() => calculateTemperatureStats(completedVisits), [completedVisits]);

    // Breakdown: Contact
    const contactStats = useMemo(() => calculateContactStats(completedVisits), [completedVisits]);

    // Avg Time Calculation
    const avgVisitMinutes = useMemo(() => calculateAvgVisitMinutes(completedVisits), [completedVisits]);

    // Recent Activity Feed (Top 50)
    const recentActivity = useMemo(() => {
        return [...completedVisits].sort((a, b) => {
            const dateA = a.finishedAt ? new Date(a.finishedAt).getTime() : 0;
            const dateB = b.finishedAt ? new Date(b.finishedAt).getTime() : 0;
            return dateB - dateA;
        }).slice(0, 50);
    }, [completedVisits]);


    const isCallCenter = vendor.role === UserRole.CALL_CENTER;

    const handleExport = () => {
        const csvConfig = mkConfig({
            useKeysAsHeaders: true,
            filename: `relatorio_detalhado_${vendor.name.replace(/\s+/g, '_')}`
        });

        // Export only completed visits to avoid "incomplete" rows
        const exportData = completedVisits.map(v => {
            const event = events.find(e => e.id === v.eventId);

            const baseData: any = {
                Vendedor: vendor.name,
                Evento: event?.name || 'N/A',
                Academia: academies.find(a => a.id === v.academyId)?.name || 'N/A',
                Data: v.finishedAt ? new Date(v.finishedAt).toLocaleDateString() : 'N/A',
                Status: v.status === VisitStatus.VISITED ? 'Concluída' : v.status,
            };

            if (!isCallCenter) {
                baseData['Tempo (min)'] = calculateTrueVisitDuration(v.startedAt, v.finishedAt) || '';
            }

            return {
                ...baseData,
                Temperatura: v.temperature || '',
                Contato: v.contactPerson || '',
                'Banner Deixado': v.leftBanner ? 'Sim' : 'Não',
                Vouchers: v.vouchersGenerated?.length || 0,
                Resumo: v.summary || ''
            };
        });

        if (exportData.length === 0) return alert("Sem dados para exportar.");
        const csv = generateCsv(csvConfig)(exportData);
        download(csvConfig)(csv);
    };

    // formatTime imported from business-utils

    return (
        <div className="space-y-8 p-6 md:p-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4">
            {/* Sticky Header */}
            <div className="flex items-center justify-between sticky top-0 bg-neutral-950/80 backdrop-blur-xl z-50 py-4 -mx-6 px-6 border-b border-white/5">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 -ml-2 hover:bg-white/10 rounded-xl transition-colors text-white text-xs font-bold uppercase tracking-widest"
                    >
                        Voltar
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                            {vendor.name}
                            <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">Ativo</span>
                        </h1>
                        <p className="text-xs text-neutral-400 font-mono">{vendor.email}</p>
                    </div>
                </div>

                <div className="flex gap-3 flex-wrap justify-end">
                    <select
                        value={filterYear}
                        onChange={(e) => setFilterYear(e.target.value)}
                        className="bg-black/40 border border-white/10 text-white text-xs rounded-xl px-3 py-2 outline-none font-bold"
                    >
                        <option value="" className="bg-neutral-900">Todos os Anos</option>
                        {availableYears.map(year => (
                            <option key={year} value={year} className="bg-neutral-900">{year}</option>
                        ))}
                    </select>

                    <select
                        value={filterEventId}
                        onChange={(e) => setFilterEventId(e.target.value)}
                        className="bg-black/40 border border-white/10 text-white text-xs rounded-xl px-3 py-2 outline-none font-bold max-w-[200px]"
                    >
                        <option value="" className="bg-neutral-900">Todos os Eventos</option>
                        {availableEvents.map(e => (
                            <option key={e.id} value={e.id} className="bg-neutral-900">{e.name}</option>
                        ))}
                    </select>

                    <button
                        onClick={handleExport}
                        className="flex items-center space-x-2 bg-white text-neutral-900 hover:bg-neutral-200 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg"
                    >
                        <span>Exportar Relatório</span>
                    </button>
                </div>
            </div>

            {/* Top Metrics Grid */}
            <div className={`grid grid-cols-2 ${isCallCenter ? 'md:grid-cols-3' : 'md:grid-cols-4'} gap-4`}>
                <div className="bg-neutral-900 border border-white/5 p-5 rounded-2xl relative overflow-hidden group hover:border-white/10 transition-all">
                    <p className="text-neutral-400 text-xs font-black uppercase tracking-widest mb-1">Visitas Realizadas</p>
                    <p className="text-3xl font-black text-white">{completedVisits.length}</p>
                    <p className="text-xs text-neutral-500 mt-2">de {vendorVisits.length} planejadas</p>
                </div>

                <div className="bg-neutral-900 border border-white/5 p-5 rounded-2xl relative overflow-hidden group hover:border-white/10 transition-all">
                    <p className="text-neutral-400 text-xs font-black uppercase tracking-widest mb-1">Vouchers Gerados</p>
                    <p className="text-3xl font-black text-white">{totalVouchersCount}</p>
                    <p className="text-xs text-neutral-500 mt-2">em {uniqueAcademiesWithVouchers} academias distintas</p>
                </div>

                {!isCallCenter && (
                    <div className="bg-neutral-900 border border-white/5 p-5 rounded-2xl relative overflow-hidden group hover:border-white/10 transition-all">
                        <p className="text-neutral-400 text-xs font-black uppercase tracking-widest mb-1">Tempo Médio/Visita</p>
                        <p className="text-3xl font-black text-white">{formatTime(avgVisitMinutes)}</p>
                        <p className="text-xs text-neutral-500 mt-2">duração média por visita/contato</p>
                    </div>
                )}

                <div className="bg-neutral-900 border border-white/5 p-5 rounded-2xl relative overflow-hidden group hover:border-white/10 transition-all">
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
                                Histórico de Atividades
                            </h3>
                            <span className="text-xs text-neutral-500 font-bold">Últimas 50 visitas</span>
                        </div>
                        <div className="divide-y divide-white/5">
                            {recentActivity.map((visit, i) => {
                                const event = events.find(e => e.id === visit.eventId);
                                const duration = calculateTrueVisitDuration(visit.startedAt, visit.finishedAt);

                                return (
                                    <div key={visit.id} className="p-4 hover:bg-white/[0.02] transition-colors group">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="text-white font-bold text-sm">
                                                    {academies.find(a => a.id === visit.academyId)?.name || 'Academia Desconhecida'}
                                                </p>
                                                <p className="text-xs text-neutral-400">{event?.name || 'Evento Desconhecido'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-neutral-300">
                                                    {visit.finishedAt ? new Date(visit.finishedAt).toLocaleDateString() : 'N/A'}
                                                </p>
                                                {!isCallCenter && (
                                                    <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold">
                                                        {duration ? formatTime(duration) : '-'}
                                                    </p>
                                                )}
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
                            <h3 className="text-sm font-black text-white uppercase tracking-wider">Materiais Entregues</h3>
                        </div>
                        <div className="bg-black/20 p-6 rounded-xl border border-white/5 text-center">
                            <p className="text-4xl font-black text-white mb-1">{bannersLeft}</p>
                            <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Banners</p>
                        </div>
                    </div>

                    {/* Active Events List */}
                    <div className="bg-neutral-900 border border-white/5 p-6 rounded-2xl">
                        <div className="flex items-center gap-2 mb-6">
                            <h3 className="text-sm font-black text-white uppercase tracking-wider">Eventos Ativos</h3>
                            <span className="text-xs bg-white/10 text-white px-2 py-0.5 rounded-full font-bold">
                                {vendorEvents.length}
                            </span>
                        </div>
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {vendorEvents.map(event => (
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
