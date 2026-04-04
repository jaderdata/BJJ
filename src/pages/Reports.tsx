import React, { useState, useMemo, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area,
    PieChart, Pie, Cell, CartesianGrid, Legend
} from 'recharts';
import { User, Academy, Event, Visit, VisitStatus, Voucher, FinanceRecord, AcademyTemperature, FinanceStatus, FollowUp, FollowUpStatus, ContactChannel } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useLoading } from '../contexts/LoadingContext';
import { calculateTrueVisitDuration } from '../lib/business-utils';
import { DatabaseService } from '../lib/supabase';

type ReportTab = 'overview' | 'academies' | 'events' | 'sellers' | 'financial' | 'vouchers' | 'followup';

interface ReportsProps {
    events: Event[];
    academies: Academy[];
    visits: Visit[];
    vouchers: Voucher[];
    vendedores: User[];
    finance: FinanceRecord[];
}

const TABS: { key: ReportTab; label: string }[] = [
    { key: 'overview', label: 'Visão Geral' },
    { key: 'academies', label: 'Academias' },
    { key: 'events', label: 'Eventos' },
    { key: 'sellers', label: 'Vendedores' },
    { key: 'financial', label: 'Financeiro' },
    { key: 'vouchers', label: 'Vouchers' },
    { key: 'followup', label: 'Follow-Up' },
];

const FU_STATUS_META: Record<FollowUpStatus, { label: string; color: string; bg: string; chartColor: string }> = {
    [FollowUpStatus.WAITING]:     { label: 'Aguardando',     color: 'text-neutral-400', bg: 'bg-neutral-500/10',  chartColor: '#71717a' },
    [FollowUpStatus.HIGH]:        { label: 'Int. Alto',       color: 'text-amber-400', bg: 'bg-amber-500/10', chartColor: '#10b981' },
    [FollowUpStatus.MEDIUM]:      { label: 'Int. Médio',      color: 'text-yellow-400',  bg: 'bg-yellow-500/10',  chartColor: '#eab308' },
    [FollowUpStatus.LOW]:         { label: 'Int. Baixo',      color: 'text-orange-400',  bg: 'bg-orange-500/10',  chartColor: '#f97316' },
    [FollowUpStatus.NO_INTEREST]: { label: 'Sem Interesse',   color: 'text-red-400',     bg: 'bg-red-500/10',     chartColor: '#ef4444' },
    [FollowUpStatus.CLOSED]:      { label: 'Fechado',         color: 'text-blue-400',    bg: 'bg-blue-500/10',    chartColor: '#3b82f6' },
};

const FU_CHANNEL_META: Record<ContactChannel, { label: string; chartColor: string }> = {
    [ContactChannel.CALL]:       { label: 'Ligação',    chartColor: '#8b5cf6' },
    [ContactChannel.WHATSAPP]:   { label: 'WhatsApp',   chartColor: '#10b981' },
    [ContactChannel.PRESENCIAL]: { label: 'Presencial', chartColor: '#0ea5e9' },
};

const CHART_COLORS = ['#10b981', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export const Reports: React.FC<ReportsProps> = ({ events, academies, visits, vouchers, vendedores, finance = [] }) => {
    const { withLoading } = useLoading();
    const [activeTab, setActiveTab] = useState<ReportTab>('overview');
    const [followUps, setFollowUps] = useState<FollowUp[]>([]);
    const [followUpsLoading, setFollowUpsLoading] = useState(false);
    const [followUpsError, setFollowUpsError] = useState(false);

    useEffect(() => {
        if (activeTab === 'followup' && followUps.length === 0 && !followUpsLoading) {
            setFollowUpsLoading(true);
            setFollowUpsError(false);
            DatabaseService.getFollowUps()
                .then(data => setFollowUps(data))
                .catch(() => setFollowUpsError(true))
                .finally(() => setFollowUpsLoading(false));
        }
    }, [activeTab]);
    const [searchInput, setSearchInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [eventFilter, setEventFilter] = useState('');
    const [salesFilter, setSalesFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [sortBy, setSortBy] = useState<string>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    useEffect(() => { const t = setTimeout(() => setSearchTerm(searchInput), 300); return () => clearTimeout(t); }, [searchInput]);
    useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); } }, [toast]);

    const nonTestEvents = useMemo(() => events.filter(e => {
        if (e.isTest) return false;
        if (e.name.trim().toUpperCase().includes('TESTE')) return false;
        return true;
    }), [events]);

    const activeFiltersCount = [searchTerm, eventFilter, salesFilter, dateFrom, dateTo].filter(Boolean).length;
    const clearAllFilters = () => { setSearchInput(''); setSearchTerm(''); setEventFilter(''); setSalesFilter(''); setDateFrom(''); setDateTo(''); };

    const inDateRange = (dateStr?: string) => {
        if (!dateStr) return true;
        const d = new Date(dateStr);
        if (dateFrom && d < new Date(dateFrom)) return false;
        if (dateTo) { const to = new Date(dateTo); to.setHours(23, 59, 59); if (d > to) return false; }
        return true;
    };

    const filteredVisits = useMemo(() => {
        const uniqueKeys = new Set<string>();

        return visits.filter(v => {
            const event = events.find(e => e.id === v.eventId);
            if (event?.isTest) return false;
            if (eventFilter && v.eventId !== eventFilter) return false;
            if (salesFilter && v.salespersonId !== salesFilter) return false;
            if (!inDateRange(v.finishedAt || v.startedAt)) return false;
            if (v.status !== VisitStatus.VISITED) return false;

            const academy = academies.find(a => a.id === v.academyId);
            const academyName = (academy?.name || '').trim().toLowerCase();

            if (searchTerm) {
                if (!academyName.includes(searchTerm.toLowerCase())) return false;
            }

            // Deduplicate by eventId + academyId — one visit per academy per event
            // (voucher renewals must not be counted as new visits)
            const key = `${v.eventId}-${v.academyId}`;
            if (uniqueKeys.has(key)) return false;
            uniqueKeys.add(key);

            return true;
        });
    }, [visits, eventFilter, salesFilter, dateFrom, dateTo, events, academies, searchTerm]);

    const filteredVouchers = useMemo(() => vouchers.filter(v => {
        const event = events.find(e => e.id === v.eventId);
        if (event?.isTest) return false;
        const academy = academies.find(a => a.id === v.academyId);
        const visit = visits.find(vis => vis.id === v.visitId);

        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            if (!v.code.toLowerCase().includes(s) && !(academy?.name || '').toLowerCase().includes(s)) return false;
        }
        if (eventFilter && v.eventId !== eventFilter) return false;
        if (salesFilter && visit?.salespersonId !== salesFilter) return false;
        if (!inDateRange(v.createdAt)) return false;
        return true;
    }), [vouchers, searchTerm, eventFilter, salesFilter, dateFrom, dateTo, visits, academies, events]);

    // For overview: one voucher per academy+event (latest), so renewed vouchers don't appear as extra rows
    const overviewVouchers = useMemo(() => {
        const latestByKey = new Map<string, typeof filteredVouchers[0]>();
        filteredVouchers.forEach(v => {
            const key = `${v.eventId}-${v.academyId}`;
            const existing = latestByKey.get(key);
            if (!existing || new Date(v.createdAt) > new Date(existing.createdAt)) {
                latestByKey.set(key, v);
            }
        });
        return Array.from(latestByKey.values());
    }, [filteredVouchers]);

    const filteredFinance = useMemo(() => finance.filter(f => {
        if (eventFilter && f.eventId !== eventFilter) return false;
        if (salesFilter && f.salespersonId !== salesFilter) return false;
        return true;
    }), [finance, eventFilter, salesFilter]);

    // === COMPUTED DATA ===
    const efficiencyMetrics = useMemo(() => {
        const withDur = filteredVisits.filter(v => v.startedAt && v.finishedAt);
        const durations = withDur.map(v => calculateTrueVisitDuration(v.startedAt, v.finishedAt)).filter((d): d is number => d !== null);
        const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
        return { avgDuration };
    }, [filteredVisits, filteredVouchers]);

    const uniqueAcademies = new Set(overviewVouchers.map(v => v.academyId)).size;
    const financialSummary = useMemo(() => {
        const received = filteredFinance.filter(f => f.status === 'Recebido').reduce((a, f) => a + f.amount, 0);
        const paid = filteredFinance.filter(f => f.status === 'Pago').reduce((a, f) => a + f.amount, 0);
        const pending = filteredFinance.filter(f => f.status === 'Pendente').reduce((a, f) => a + f.amount, 0);
        return { received, paid, pending, total: received + paid + pending, balance: received - paid };
    }, [filteredFinance]);

    const timelineData = useMemo(() => {
        const days: Record<string, { date: string; visits: number; vouchers: number }> = {};
        filteredVisits.forEach(v => { if (v.finishedAt) { const d = new Date(v.finishedAt).toLocaleDateString('pt-BR'); if (!days[d]) days[d] = { date: d, visits: 0, vouchers: 0 }; days[d].visits++; } });
        overviewVouchers.forEach(v => { const d = new Date(v.createdAt).toLocaleDateString('pt-BR'); if (!days[d]) days[d] = { date: d, visits: 0, vouchers: 0 }; days[d].vouchers++; });
        return Object.values(days).sort((a, b) => { const [da, ma, ya] = a.date.split('/').map(Number); const [db, mb, yb] = b.date.split('/').map(Number); return new Date(ya, ma - 1, da).getTime() - new Date(yb, mb - 1, db).getTime(); }).slice(-20);
    }, [filteredVisits, overviewVouchers]);

    const temperatureData = useMemo(() => {
        const c = { [AcademyTemperature.COLD]: 0, [AcademyTemperature.WARM]: 0, [AcademyTemperature.HOT]: 0 };
        filteredVisits.forEach(v => { if (v.temperature) c[v.temperature]++; });
        return [{ name: 'Frio', value: c[AcademyTemperature.COLD], color: '#3b82f6' }, { name: 'Morno', value: c[AcademyTemperature.WARM], color: '#eab308' }, { name: 'Quente', value: c[AcademyTemperature.HOT], color: '#ef4444' }];
    }, [filteredVisits]);

    const academyRanking = useMemo(() => {
        const map: Record<string, { name: string; city: string; visits: number; vouchers: number; temps: string[] }> = {};
        filteredVisits.forEach(v => {
            const a = academies.find(ac => ac.id === v.academyId);
            if (!a) return;
            if (!map[v.academyId]) map[v.academyId] = { name: a.name, city: a.city || '', visits: 0, vouchers: 0, temps: [] };
            map[v.academyId].visits++;
            if (v.temperature) map[v.academyId].temps.push(v.temperature);
        });
        filteredVouchers.forEach(v => { if (map[v.academyId]) map[v.academyId].vouchers++; });
        return Object.entries(map).map(([id, d]) => ({ id, ...d })).sort((a, b) => b.vouchers - a.vouchers);
    }, [filteredVisits, filteredVouchers, academies]);

    const eventRanking = useMemo(() => {
        const map: Record<string, { name: string; visits: number; vouchers: number; durations: number[] }> = {};
        nonTestEvents.forEach(e => { map[e.id] = { name: e.name, visits: 0, vouchers: 0, durations: [] }; });
        filteredVisits.forEach(v => { if (map[v.eventId]) { map[v.eventId].visits++; if (v.startedAt && v.finishedAt) { const d = calculateTrueVisitDuration(v.startedAt, v.finishedAt); if (d) map[v.eventId].durations.push(d); } } });
        filteredVouchers.forEach(v => { if (map[v.eventId]) map[v.eventId].vouchers++; });
        return Object.entries(map).map(([id, d]) => ({ id, ...d, avgDuration: d.durations.length > 0 ? Math.round(d.durations.reduce((a, b) => a + b, 0) / d.durations.length) : 0 })).filter(e => e.visits > 0).sort((a, b) => b.vouchers - a.vouchers);
    }, [nonTestEvents, filteredVisits, filteredVouchers]);

    const sellerRanking = useMemo(() => {
        const map: Record<string, { name: string; visits: number; vouchers: number; durations: number[] }> = {};
        vendedores.forEach(v => { map[v.id] = { name: v.name, visits: 0, vouchers: 0, durations: [] }; });
        filteredVisits.forEach(v => { if (map[v.salespersonId]) { map[v.salespersonId].visits++; if (v.startedAt && v.finishedAt) { const d = calculateTrueVisitDuration(v.startedAt, v.finishedAt); if (d) map[v.salespersonId].durations.push(d); } } });
        filteredVouchers.forEach(v => { const vis = visits.find(x => x.id === v.visitId); if (vis && map[vis.salespersonId]) map[vis.salespersonId].vouchers++; });
        return Object.entries(map).map(([id, d]) => ({ id, ...d, avgDuration: d.durations.length > 0 ? Math.round(d.durations.reduce((a, b) => a + b, 0) / d.durations.length) : 0 })).filter(s => s.visits > 0).sort((a, b) => b.vouchers - a.vouchers);
    }, [vendedores, filteredVisits, filteredVouchers, visits]);

    const financeByVendor = useMemo(() => {
        const map: Record<string, { name: string; total: number; paid: number; pending: number; received: number; records: (FinanceRecord & { eventName: string })[] }> = {};
        filteredFinance.forEach(f => {
            const v = vendedores.find(x => x.id === f.salespersonId);
            const key = f.salespersonId;
            if (!map[key]) map[key] = { name: v?.name || 'N/A', total: 0, paid: 0, pending: 0, received: 0, records: [] };
            map[key].total += f.amount;
            if (f.status === FinanceStatus.PAID) map[key].paid += f.amount;
            else if (f.status === FinanceStatus.PENDING) map[key].pending += f.amount;
            else if (f.status === FinanceStatus.RECEIVED) map[key].received += f.amount;
            map[key].records.push({ ...f, eventName: events.find(e => e.id === f.eventId)?.name || 'N/A' });
        });
        return Object.values(map).sort((a, b) => b.total - a.total);
    }, [filteredFinance, vendedores, events]);

    // === FOLLOW-UP DATA ===
    const filteredFollowUps = useMemo(() => followUps.filter(f => {
        if (salesFilter && f.createdBy !== salesFilter) return false;
        if (!inDateRange(f.createdAt)) return false;
        return true;
    }), [followUps, salesFilter, dateFrom, dateTo]);

    const followUpByStatus = useMemo(() => {
        const map: Record<string, number> = {};
        Object.values(FollowUpStatus).forEach(s => { map[s] = 0; });
        filteredFollowUps.forEach(f => { map[f.status] = (map[f.status] || 0) + 1; });
        return map;
    }, [filteredFollowUps]);

    const followUpStatusChartData = useMemo(() =>
        Object.values(FollowUpStatus).map(s => ({
            name: FU_STATUS_META[s].label,
            value: followUpByStatus[s] || 0,
            color: FU_STATUS_META[s].chartColor,
        })).filter(d => d.value > 0),
    [followUpByStatus]);

    const followUpChannelChartData = useMemo(() =>
        Object.values(ContactChannel).map(c => ({
            name: FU_CHANNEL_META[c].label,
            value: filteredFollowUps.filter(f => f.contactChannel === c).length,
            color: FU_CHANNEL_META[c].chartColor,
        })).filter(d => d.value > 0),
    [filteredFollowUps]);

    const followUpByCreator = useMemo(() =>
        vendedores
            .map(v => ({
                name: v.name.split(' ')[0],
                fullName: v.name,
                total: filteredFollowUps.filter(f => f.createdBy === v.id).length,
                closed: filteredFollowUps.filter(f => f.createdBy === v.id && f.status === FollowUpStatus.CLOSED).length,
                high: filteredFollowUps.filter(f => f.createdBy === v.id && f.status === FollowUpStatus.HIGH).length,
            }))
            .filter(v => v.total > 0)
            .sort((a, b) => b.total - a.total),
    [filteredFollowUps, vendedores]);

    const followUpTimeline = useMemo(() => {
        const months: Record<string, { date: string; created: number; closed: number }> = {};
        filteredFollowUps.forEach(f => {
            const key = new Date(f.createdAt).toLocaleDateString('pt-BR', { month: '2-digit', year: '2-digit' });
            if (!months[key]) months[key] = { date: key, created: 0, closed: 0 };
            months[key].created++;
            if (f.status === FollowUpStatus.CLOSED) months[key].closed++;
        });
        return Object.values(months).sort((a, b) => {
            const [ma, ya] = a.date.split('/').map(Number);
            const [mb, yb] = b.date.split('/').map(Number);
            return new Date(ya, ma - 1, 1).getTime() - new Date(yb, mb - 1, 1).getTime();
        });
    }, [filteredFollowUps]);

    const followUpKPIs = useMemo(() => {
        const total = filteredFollowUps.length;
        const overdue = filteredFollowUps.filter(f => {
            if (!f.nextContactAt) return false;
            if (f.status === FollowUpStatus.CLOSED || f.status === FollowUpStatus.NO_INTEREST) return false;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const contactDate = new Date(f.nextContactAt);
            contactDate.setHours(0, 0, 0, 0);
            return contactDate < today;
        }).length;
        const closed = filteredFollowUps.filter(f => f.status === FollowUpStatus.CLOSED).length;
        const highInterest = filteredFollowUps.filter(f => f.status === FollowUpStatus.HIGH).length;
        const closingRate = total > 0 ? Math.round((closed / total) * 100) : 0;
        return { total, overdue, closed, highInterest, closingRate };
    }, [filteredFollowUps]);

    // === EXPORT FUNCTIONS ===
    const getTabTitle = () => TABS.find(t => t.key === activeTab)?.label || 'Relatório';

    const exportCSV = async () => {
        await withLoading(async () => {
            try {
                let headers: string[] = [];
                let rows: string[][] = [];
                const title = getTabTitle();

                if (activeTab === 'overview') {
                    headers = ['Academia', 'Cidade', 'Evento', 'Vendedor', 'Data Visita', 'Temperatura', 'Duração (min)', 'Resumo da Atividade'];
                    rows = filteredVisits.map(v => {
                        const ac = academies.find(a => a.id === v.academyId);
                        const ev = events.find(e => e.id === v.eventId);
                        const se = vendedores.find(u => u.id === v.salespersonId);
                        const dur = v.startedAt && v.finishedAt ? calculateTrueVisitDuration(v.startedAt, v.finishedAt) : null;
                        const date = v.finishedAt || v.startedAt;
                        return [ac?.name || '---', ac?.city || '---', ev?.name || '---', se?.name || 'N/A', date ? new Date(date).toLocaleDateString('pt-BR') : '---', v.temperature || '---', dur ? String(dur) : '---', v.summary || ''];
                    });
                } else if (activeTab === 'vouchers') {
                    headers = ['Código', 'Data', 'Academia', 'Evento', 'Vendedor', 'Duração (min)'];
                    rows = filteredVouchers.map(v => {
                        const visit = visits.find(vis => vis.id === v.visitId);
                        const academy = academies.find(a => a.id === v.academyId);
                        const event = events.find(e => e.id === v.eventId);
                        const seller = vendedores.find(u => u.id === visit?.salespersonId);
                        const dur = visit?.startedAt && visit?.finishedAt ? calculateTrueVisitDuration(visit.startedAt, visit.finishedAt) : null;
                        return [v.code, new Date(v.createdAt).toLocaleDateString('pt-BR'), academy?.name || '---', event?.name || '---', seller?.name || 'N/A', dur ? String(dur) : '---'];
                    });
                } else if (activeTab === 'academies') {
                    headers = ['Academia', 'Cidade', 'Visitas', 'Vouchers'];
                    rows = academyRanking.map(a => [a.name, a.city, String(a.visits), String(a.vouchers)]);
                } else if (activeTab === 'events') {
                    headers = ['Evento', 'Visitas', 'Vouchers', 'Duração Média (min)'];
                    rows = eventRanking.map(e => [e.name, String(e.visits), String(e.vouchers), String(e.avgDuration)]);
                } else if (activeTab === 'sellers') {
                    headers = ['Vendedor', 'Visitas', 'Vouchers', 'Duração Média (min)'];
                    rows = sellerRanking.map(s => [s.name, String(s.visits), String(s.vouchers), String(s.avgDuration)]);
                } else if (activeTab === 'financial') {
                    headers = ['Vendedor', 'Evento', 'Valor', 'Status', 'Data'];
                    rows = filteredFinance.map(f => {
                        const v = vendedores.find(x => x.id === f.salespersonId);
                        const e = events.find(x => x.id === f.eventId);
                        return [v?.name || 'N/A', e?.name || 'N/A', f.amount.toFixed(2), f.status, new Date(f.updatedAt).toLocaleDateString('pt-BR')];
                    });
                } else if (activeTab === 'followup') {
                    headers = ['Academia', 'Status', 'Canal', 'Contato', 'Próx. Contato', 'Notas', 'Criado por', 'Data'];
                    rows = filteredFollowUps.map(f => {
                        const ac = academies.find(a => a.id === f.academyId);
                        const cr = vendedores.find(v => v.id === f.createdBy);
                        return [
                            ac?.name || 'N/A',
                            FU_STATUS_META[f.status]?.label || f.status,
                            FU_CHANNEL_META[f.contactChannel]?.label || f.contactChannel,
                            f.contactPerson || '',
                            f.nextContactAt ? new Date(f.nextContactAt).toLocaleDateString('pt-BR') : '',
                            f.notes || '',
                            cr?.name || 'N/A',
                            new Date(f.createdAt).toLocaleDateString('pt-BR'),
                        ];
                    });
                }

                const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `relatorio-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`;
                link.click();
                setToast({ message: `CSV "${title}" gerado!`, type: 'success' });
            } catch { setToast({ message: 'Erro ao gerar CSV', type: 'error' }); }
        });
    };

    const exportPDF = async () => {
        await withLoading(async () => {
            try {
                const doc = new jsPDF();
                const title = getTabTitle();
                doc.setFontSize(18); doc.setTextColor(16, 185, 129); doc.text(`Relatório: ${title}`, 14, 20);
                doc.setFontSize(9); doc.setTextColor(100, 100, 100); doc.text(`BJJ Visits | Gerado em ${new Date().toLocaleString('pt-BR')}`, 14, 27);

                let yPos = 35;
                doc.setFontSize(9); doc.setTextColor(80, 80, 80);
                if (eventFilter) { doc.text(`Evento: ${events.find(e => e.id === eventFilter)?.name}`, 14, yPos); yPos += 5; }
                if (salesFilter) { doc.text(`Vendedor: ${vendedores.find(v => v.id === salesFilter)?.name}`, 14, yPos); yPos += 5; }
                if (dateFrom || dateTo) { doc.text(`Período: ${dateFrom || '---'} a ${dateTo || '---'}`, 14, yPos); yPos += 5; }
                yPos += 5;

                let head: string[][] = [];
                let body: string[][] = [];
                const hStyle = { fillColor: [16, 185, 129] as [number, number, number], textColor: 255 as number, fontStyle: 'bold' as const, fontSize: 8 };

                if (activeTab === 'overview') {
                    head = [['Academia', 'Cidade', 'Evento', 'Vendedor', 'Data Visita', 'Temperatura', 'Duração (min)']];
                    body = filteredVisits.slice(0, 500).map(v => {
                        const ac = academies.find(a => a.id === v.academyId);
                        const ev = events.find(e => e.id === v.eventId);
                        const se = vendedores.find(u => u.id === v.salespersonId);
                        const dur = v.startedAt && v.finishedAt ? calculateTrueVisitDuration(v.startedAt, v.finishedAt) : null;
                        const date = v.finishedAt || v.startedAt;
                        return [ac?.name || '---', ac?.city || '---', ev?.name || '---', se?.name || 'N/A', date ? new Date(date).toLocaleDateString('pt-BR') : '---', v.temperature || '---', dur ? String(dur) : '---'];
                    });
                } else if (activeTab === 'vouchers') {
                    head = [['Código', 'Data', 'Academia', 'Evento', 'Vendedor']];
                    body = filteredVouchers.slice(0, 500).map(v => {
                        const vis = visits.find(x => x.id === v.visitId); const ac = academies.find(a => a.id === v.academyId);
                        const ev = events.find(e => e.id === v.eventId); const se = vendedores.find(u => u.id === vis?.salespersonId);
                        return [v.code, new Date(v.createdAt).toLocaleDateString('pt-BR'), ac?.name || '---', ev?.name || '---', se?.name || 'N/A'];
                    });
                } else if (activeTab === 'academies') {
                    head = [['Academia', 'Cidade', 'Visitas', 'Vouchers']];
                    body = academyRanking.map(a => [a.name, a.city, String(a.visits), String(a.vouchers)]);
                } else if (activeTab === 'events') {
                    head = [['Evento', 'Visitas', 'Vouchers', 'Duração Média']];
                    body = eventRanking.map(e => [e.name, String(e.visits), String(e.vouchers), `${e.avgDuration} min`]);
                } else if (activeTab === 'sellers') {
                    head = [['Vendedor', 'Visitas', 'Vouchers', 'Duração Média']];
                    body = sellerRanking.map(s => [s.name, String(s.visits), String(s.vouchers), `${s.avgDuration} min`]);
                } else if (activeTab === 'financial') {
                    head = [['Vendedor', 'Evento', 'Valor', 'Status']];
                    body = filteredFinance.map(f => [vendedores.find(x => x.id === f.salespersonId)?.name || 'N/A', events.find(x => x.id === f.eventId)?.name || 'N/A', `$ ${f.amount.toFixed(2)}`, f.status]);
                } else if (activeTab === 'followup') {
                    head = [['Academia', 'Status', 'Canal', 'Contato', 'Próx. Contato', 'Criado por']];
                    body = filteredFollowUps.map(f => {
                        const ac = academies.find(a => a.id === f.academyId);
                        const cr = vendedores.find(v => v.id === f.createdBy);
                        return [
                            ac?.name || 'N/A',
                            FU_STATUS_META[f.status]?.label || f.status,
                            FU_CHANNEL_META[f.contactChannel]?.label || f.contactChannel,
                            f.contactPerson || '---',
                            f.nextContactAt ? new Date(f.nextContactAt).toLocaleDateString('pt-BR') : '---',
                            cr?.name || 'N/A',
                        ];
                    });
                }

                autoTable(doc, { startY: yPos, head, body, theme: 'striped', headStyles: hStyle, bodyStyles: { fontSize: 7 }, margin: { left: 14, right: 14 } });
                doc.save(`relatorio-${activeTab}-${new Date().toISOString().split('T')[0]}.pdf`);
                setToast({ message: `PDF "${title}" gerado!`, type: 'success' });
            } catch { setToast({ message: 'Erro ao gerar PDF', type: 'error' }); }
        });
    };


    // === RENDER HELPERS ===
    const KPICard = ({ label, value, sub, color = 'amber' }: { label: string; value: string | number; sub?: string; color?: string }) => (
        <div className="group relative overflow-hidden bg-white/[0.04] border border-white/[0.08] rounded-md p-4 hover:border-white/20 transition-all duration-300 hover:-translate-y-0.5">
            <h3 className="text-3xl font-heading font-black text-white tracking-tight">{value}</h3>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">{label}</p>
            {sub && <p className="text-[10px] text-white/25 mt-1">{sub}</p>}
        </div>
    );

    const SortableHeader = ({ field, label }: { field: string; label: string }) => (
        <th className="px-4 py-3 text-[10px] font-black text-white/50 uppercase tracking-wider cursor-pointer hover:text-white/70 transition-colors select-none" onClick={() => { if (sortBy === field) setSortOrder(o => o === 'asc' ? 'desc' : 'asc'); else { setSortBy(field); setSortOrder('asc'); } }}>
            <span>{label}</span>{sortBy === field ? (sortOrder === 'asc' ? ' ↑' : ' ↓') : ''}
        </th>
    );

    const ChartCard = ({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) => (
        <div className={`bg-white/[0.03] border border-white/[0.08] rounded-md p-5 ${className}`}>
            <h3 className="text-[11px] font-black text-white/50 uppercase tracking-widest mb-4">{title}</h3>
            {children}
        </div>
    );

    const tooltipStyle = { backgroundColor: 'rgba(10, 10, 10, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontSize: '11px' };

    return (
        <div className="space-y-5 p-4">
            {toast && (
                <div className="fixed top-20 right-8 z-[200] bg-neutral-900 border border-white/20 text-white px-5 py-3 rounded-sm shadow-2xl flex items-center justify-between min-w-[200px] animate-in slide-in-from-right">
                    <span className={`font-bold text-sm ${toast.type === 'success' ? 'text-amber-400' : 'text-red-400'}`}>{toast.message}</span>
                    <button onClick={() => setToast(null)} className="ml-2 p-1 hover:bg-white/10 rounded-sm text-white/50 hover:text-white font-black text-xs">X</button>
                </div>
            )}

            {/* HEADER */}
            <div className="bg-neutral-900 border border-white/[0.08] p-5 rounded-md">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-black text-white tracking-tight">Central de Relatórios</h1>
                            {activeFiltersCount > 0 && <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded-full text-[10px] font-black text-amber-400">{activeFiltersCount} filtros</span>}
                        </div>
                        <p className="text-white/40 text-xs mt-0.5">Análise completa do sistema BJJ Visits</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button onClick={exportCSV} className="bg-white/[0.06] border border-white/[0.12] text-white px-3 py-2 rounded-sm font-bold hover:bg-white/10 transition-all text-xs">CSV</button>
                        <button onClick={exportPDF} className="bg-white/[0.06] border border-white/[0.12] text-white px-3 py-2 rounded-sm font-bold hover:bg-white/10 transition-all text-xs">PDF</button>
                    </div>
                </div>
            </div>

            {/* TAB BAR */}
            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
                {TABS.map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-4 py-2.5 rounded-sm text-xs font-bold whitespace-nowrap transition-all ${activeTab === tab.key ? 'bg-white text-neutral-900' : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white/70'}`}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* FILTERS */}
            <div className="grid grid-cols-2 md:grid-cols-12 gap-3">
                <div className="col-span-2 md:col-span-3">
                    <input type="text" placeholder="Buscar..." className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 text-xs" value={searchInput} onChange={e => setSearchInput(e.target.value)} />
                </div>
                <input type="date" className="col-span-1 md:col-span-2 bg-white/[0.04] border border-white/[0.08] rounded-sm text-white px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-white/20" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                <input type="date" className="col-span-1 md:col-span-2 bg-white/[0.04] border border-white/[0.08] rounded-sm text-white px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-white/20" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                <select className="col-span-1 md:col-span-2 bg-white/[0.04] border border-white/[0.08] rounded-sm text-white px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-white/20" value={eventFilter} onChange={e => setEventFilter(e.target.value)}>
                    <option value="" className="bg-neutral-900">Todos Eventos</option>
                    {nonTestEvents.map(e => <option key={e.id} value={e.id} className="bg-neutral-900">{e.name}</option>)}
                </select>
                <select className="col-span-1 md:col-span-2 bg-white/[0.04] border border-white/[0.08] rounded-sm text-white px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-white/20" value={salesFilter} onChange={e => setSalesFilter(e.target.value)}>
                    <option value="" className="bg-neutral-900">Todos Vendedores</option>
                    {vendedores.map(v => <option key={v.id} value={v.id} className="bg-neutral-900">{v.name}</option>)}
                </select>
                <button onClick={clearAllFilters} disabled={activeFiltersCount === 0} className="col-span-2 md:col-span-1 bg-white/[0.04] border border-white/[0.08] rounded-sm text-white/50 px-3 py-2 hover:bg-white/[0.08] transition-all disabled:opacity-30 text-xs font-bold">Limpar</button>
            </div>

            {/* TAB CONTENT */}
            {activeTab === 'overview' && (
                <div className="space-y-5">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <KPICard label="Vouchers" value={filteredVouchers.length} />
                        <KPICard label="Visitas" value={filteredVisits.length} />
                        <KPICard label="Duração Média" value={`${efficiencyMetrics.avgDuration} min`} />
                        <KPICard label="Academias" value={uniqueAcademies} sub="Com voucher gerado" />
                        <KPICard label="Saldo Financeiro" value={`$ ${financialSummary.balance.toFixed(0)}`} sub={`Recebido - Pago`} />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        <ChartCard title="Evolução Temporal" className="lg:col-span-2">
                            <div className="h-[280px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={timelineData}>
                                        <defs>
                                            <linearGradient id="gV" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                                            <linearGradient id="gU" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} /><stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} /></linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                        <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={9} tickLine={false} axisLine={false} />
                                        <YAxis stroke="rgba(255,255,255,0.2)" fontSize={9} tickLine={false} axisLine={false} />
                                        <Tooltip contentStyle={tooltipStyle} />
                                        <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                                        <Area name="Visitas" type="monotone" dataKey="visits" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#gV)" />
                                        <Area name="Vouchers" type="monotone" dataKey="vouchers" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#gU)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </ChartCard>
                        <ChartCard title="Sentimento de Mercado">
                            <div className="h-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={temperatureData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={6} dataKey="value">{temperatureData.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie>
                                        <Tooltip contentStyle={tooltipStyle} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-2 space-y-1.5">{temperatureData.map((item, i) => (<div key={i} className="flex items-center justify-between text-[10px]"><div className="flex items-center space-x-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div><span className="text-white/50">{item.name}</span></div><span className="text-white font-black">{item.value}</span></div>))}</div>
                        </ChartCard>
                    </div>

                </div>
            )}

            {activeTab === 'academies' && (
                <div className="space-y-5">

                    <div className="bg-white/[0.03] border border-white/[0.08] rounded-md overflow-hidden">
                        <div className="p-4 border-b border-white/[0.06]"><h3 className="text-sm font-black text-white">Todas as Academias ({academyRanking.length})</h3></div>
                        <div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-white/[0.03] border-b border-white/[0.06]"><tr><th className="px-4 py-3 text-[10px] font-black text-white/50 uppercase tracking-wider">Academia</th><th className="px-4 py-3 text-[10px] font-black text-white/50 uppercase tracking-wider">Cidade</th><th className="px-4 py-3 text-[10px] font-black text-white/50 uppercase tracking-wider">Visitas</th><th className="px-4 py-3 text-[10px] font-black text-white/50 uppercase tracking-wider">Vouchers</th><th className="px-4 py-3 text-[10px] font-black text-white/50 uppercase tracking-wider">Temperatura</th></tr></thead><tbody className="divide-y divide-white/[0.04]">{academyRanking.map((a, i) => (<tr key={a.id} className="hover:bg-white/[0.03] transition-colors"><td className="px-4 py-3"><div className="flex items-center space-x-2"><span className="text-[10px] font-mono font-bold text-white/30 w-5">{i + 1}</span><span className="text-sm font-bold text-white">{a.name}</span></div></td><td className="px-4 py-3 text-xs text-white/50">{a.city}</td><td className="px-4 py-3 text-sm font-bold text-white">{a.visits}</td><td className="px-4 py-3 text-sm font-black text-amber-400">{a.vouchers}</td><td className="px-4 py-3"><div className="flex gap-1">{a.temps.length > 0 ? (() => { const hot = a.temps.filter(t => t === AcademyTemperature.HOT).length; const warm = a.temps.filter(t => t === AcademyTemperature.WARM).length; const cold = a.temps.filter(t => t === AcademyTemperature.COLD).length; const dominant = hot >= warm && hot >= cold ? 'Quente' : warm >= cold ? 'Morno' : 'Frio'; const color = dominant === 'Quente' ? 'text-red-400 bg-red-500/10' : dominant === 'Morno' ? 'text-amber-400 bg-amber-500/10' : 'text-blue-400 bg-blue-500/10'; return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${color}`}>{dominant}</span>; })() : <span className="text-[10px] text-white/20">---</span>}</div></td></tr>))}</tbody></table></div>
                    </div>
                </div>
            )}

            {activeTab === 'events' && (
                <div className="space-y-5">
                    <ChartCard title="Performance por Evento">
                        <div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={eventRanking.slice(0, 10)}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} /><XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={9} tickLine={false} angle={-15} textAnchor="end" height={60} /><YAxis stroke="rgba(255,255,255,0.2)" fontSize={9} tickLine={false} /><Tooltip contentStyle={tooltipStyle} /><Legend wrapperStyle={{ fontSize: '10px' }} /><Bar dataKey="visits" fill="#0ea5e9" name="Visitas" radius={[4, 4, 0, 0]} /><Bar dataKey="vouchers" fill="#10b981" name="Vouchers" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
                    </ChartCard>
                    <div className="bg-white/[0.03] border border-white/[0.08] rounded-md overflow-hidden">
                        <div className="p-4 border-b border-white/[0.06]"><h3 className="text-sm font-black text-white">Detalhamento por Evento ({eventRanking.length})</h3></div>
                        <div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-white/[0.03] border-b border-white/[0.06]"><tr><th className="px-4 py-3 text-[10px] font-black text-white/50 uppercase tracking-wider">Evento</th><th className="px-4 py-3 text-[10px] font-black text-white/50 uppercase tracking-wider">Visitas</th><th className="px-4 py-3 text-[10px] font-black text-white/50 uppercase tracking-wider">Vouchers</th><th className="px-4 py-3 text-[10px] font-black text-white/50 uppercase tracking-wider">Duração Média</th></tr></thead><tbody className="divide-y divide-white/[0.04]">{eventRanking.map(e => (<tr key={e.id} className="hover:bg-white/[0.03] transition-colors"><td className="px-4 py-3 text-sm font-bold text-white">{e.name}</td><td className="px-4 py-3 text-sm text-white/70">{e.visits}</td><td className="px-4 py-3 text-sm font-black text-amber-400">{e.vouchers}</td><td className="px-4 py-3 text-sm text-white/50">{e.avgDuration} min</td></tr>))}</tbody></table></div>
                    </div>
                </div>
            )}

            {activeTab === 'sellers' && (
                <div className="space-y-5">
                    <ChartCard title="Ranking de Vendedores">
                        <div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={sellerRanking} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} /><XAxis type="number" stroke="rgba(255,255,255,0.2)" fontSize={9} /><YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} width={100} /><Tooltip contentStyle={tooltipStyle} /><Legend wrapperStyle={{ fontSize: '10px' }} /><Bar dataKey="vouchers" fill="#10b981" name="Vouchers" radius={[0, 6, 6, 0]} /><Bar dataKey="visits" fill="#0ea5e9" name="Visitas" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer></div>
                    </ChartCard>
                    <div className="bg-white/[0.03] border border-white/[0.08] rounded-md overflow-hidden">
                        <div className="p-4 border-b border-white/[0.06]"><h3 className="text-sm font-black text-white">Detalhamento por Vendedor ({sellerRanking.length})</h3></div>
                        <div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-white/[0.03] border-b border-white/[0.06]"><tr><th className="px-4 py-3 text-[10px] font-black text-white/50 uppercase tracking-wider">Vendedor</th><th className="px-4 py-3 text-[10px] font-black text-white/50 uppercase tracking-wider">Visitas</th><th className="px-4 py-3 text-[10px] font-black text-white/50 uppercase tracking-wider">Vouchers</th><th className="px-4 py-3 text-[10px] font-black text-white/50 uppercase tracking-wider">Duração Média</th></tr></thead><tbody className="divide-y divide-white/[0.04]">{sellerRanking.map((s, i) => (<tr key={s.id} className="hover:bg-white/[0.03] transition-colors"><td className="px-4 py-3"><div className="flex items-center space-x-2"><div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black text-white/50">{s.name.charAt(0)}</div><span className="text-sm font-bold text-white">{s.name}</span></div></td><td className="px-4 py-3 text-sm text-white/70">{s.visits}</td><td className="px-4 py-3 text-sm font-black text-amber-400">{s.vouchers}</td><td className="px-4 py-3 text-sm text-white/50">{s.avgDuration} min</td></tr>))}</tbody></table></div>
                    </div>
                </div>
            )}

            {activeTab === 'financial' && (
                <div className="space-y-5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <KPICard label="Total Lançado" value={`$ ${financialSummary.total.toFixed(2)}`} />
                        <KPICard label="Pago" value={`$ ${financialSummary.paid.toFixed(2)}`} color="blue" />
                        <KPICard label="Pendente" value={`$ ${financialSummary.pending.toFixed(2)}`} color="amber" />
                        <KPICard label="Recebido" value={`$ ${financialSummary.received.toFixed(2)}`} color="amber" />
                    </div>
                    {financeByVendor.map(vendor => (
                        <div key={vendor.name} className="bg-white/[0.03] border border-white/[0.08] rounded-md overflow-hidden">
                            <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
                                <div className="flex items-center space-x-2"><div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black text-white/50">{vendor.name.charAt(0)}</div><span className="text-sm font-black text-white">{vendor.name}</span></div>
                                <span className="text-xs font-black text-amber-400">$ {vendor.total.toFixed(2)}</span>
                            </div>
                            <div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-white/[0.02]"><tr><th className="px-4 py-2 text-[10px] font-black text-white/40 uppercase">Evento</th><th className="px-4 py-2 text-[10px] font-black text-white/40 uppercase">Valor</th><th className="px-4 py-2 text-[10px] font-black text-white/40 uppercase">Status</th><th className="px-4 py-2 text-[10px] font-black text-white/40 uppercase">Data</th></tr></thead><tbody className="divide-y divide-white/[0.03]">{vendor.records.map(r => (<tr key={r.id} className="hover:bg-white/[0.02]"><td className="px-4 py-2.5 text-xs text-white/70">{r.eventName}</td><td className="px-4 py-2.5 text-xs font-bold text-white">$ {r.amount.toFixed(2)}</td><td className="px-4 py-2.5"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.status === FinanceStatus.PAID ? 'bg-blue-500/10 text-blue-400' : r.status === FinanceStatus.RECEIVED ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-500/10 text-amber-400'}`}>{r.status}</span></td><td className="px-4 py-2.5 text-xs text-white/40">{new Date(r.updatedAt).toLocaleDateString('pt-BR')}</td></tr>))}</tbody></table></div>
                        </div>
                    ))}
                    {financeByVendor.length === 0 && <div className="text-center py-16 text-white/30 text-sm">Nenhum registro financeiro encontrado.</div>}
                </div>
            )}

            {activeTab === 'followup' && (
                <div className="space-y-5">
                    {/* Loading state */}
                    {followUpsLoading && (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-8 h-8 border-2 border-amber-500/50 border-t-amber-500 rounded-full animate-spin" />
                        </div>
                    )}

                    {/* Error state */}
                    {!followUpsLoading && followUpsError && (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <div className="w-12 h-12 rounded-md bg-red-500/10 flex items-center justify-center text-red-400 text-xl">✕</div>
                            <p className="text-sm font-bold text-white/60">Falha ao carregar dados de Follow-Up</p>
                            <p className="text-xs text-white/30">Verifique sua conexão ou as permissões da tabela.</p>
                            <button
                                onClick={() => { setFollowUpsError(false); setFollowUpsLoading(true); DatabaseService.getFollowUps().then(d => setFollowUps(d)).catch(() => setFollowUpsError(true)).finally(() => setFollowUpsLoading(false)); }}
                                className="mt-1 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-sm text-xs font-bold text-white/50 hover:text-white transition-all"
                            >
                                Tentar novamente
                            </button>
                        </div>
                    )}

                    {!followUpsLoading && !followUpsError && (
                        <>
                            {/* KPIs */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                <KPICard label="Total Follow-Ups" value={followUpKPIs.total} />
                                <KPICard label="Interesse Alto" value={followUpKPIs.highInterest} sub="Quentes no funil" />
                                <KPICard label="Fechados" value={followUpKPIs.closed} sub="Convertidos" />
                                <KPICard label="Taxa de Fechamento" value={`${followUpKPIs.closingRate}%`} sub="Fechados / Total" />
                                <KPICard label="Vencidos" value={followUpKPIs.overdue} sub="Próx. contato expirado" />
                            </div>

                            {/* Charts row 1: Status + Canal */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                <ChartCard title="Distribuição por Status">
                                    {followUpStatusChartData.length > 0 ? (
                                        <>
                                            <div className="h-[200px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie data={followUpStatusChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={5} dataKey="value">
                                                            {followUpStatusChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                                        </Pie>
                                                        <Tooltip contentStyle={tooltipStyle} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <div className="mt-3 space-y-1.5">
                                                {followUpStatusChartData.map((item, i) => (
                                                    <div key={i} className="flex items-center justify-between text-[10px]">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                                            <span className="text-white/50">{item.name}</span>
                                                        </div>
                                                        <span className="text-white font-black">{item.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="h-[200px] flex items-center justify-center text-white/20 text-sm">Sem dados</div>
                                    )}
                                </ChartCard>

                                <ChartCard title="Canal de Contato">
                                    {followUpChannelChartData.length > 0 ? (
                                        <>
                                            <div className="h-[200px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={followUpChannelChartData} layout="vertical">
                                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                                                        <XAxis type="number" stroke="rgba(255,255,255,0.2)" fontSize={9} tickLine={false} />
                                                        <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} width={80} />
                                                        <Tooltip contentStyle={tooltipStyle} />
                                                        <Bar dataKey="value" radius={[0, 6, 6, 0]} name="Follow-Ups">
                                                            {followUpChannelChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <div className="mt-3 space-y-1.5">
                                                {followUpChannelChartData.map((item, i) => (
                                                    <div key={i} className="flex items-center justify-between text-[10px]">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                                            <span className="text-white/50">{item.name}</span>
                                                        </div>
                                                        <span className="text-white font-black">{item.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="h-[200px] flex items-center justify-center text-white/20 text-sm">Sem dados</div>
                                    )}
                                </ChartCard>
                            </div>

                            {/* Charts row 2: Por criador + Timeline */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                <ChartCard title="Follow-Ups por Vendedor">
                                    {followUpByCreator.length > 0 ? (
                                        <div className="h-[260px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={followUpByCreator} layout="vertical">
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                                                    <XAxis type="number" stroke="rgba(255,255,255,0.2)" fontSize={9} tickLine={false} />
                                                    <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} width={80} />
                                                    <Tooltip contentStyle={tooltipStyle} formatter={(val, name) => [val, name === 'total' ? 'Total' : name === 'closed' ? 'Fechados' : 'Int. Alto']} />
                                                    <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                                                    <Bar dataKey="total" name="Total" fill="#6366f1" radius={[0, 4, 4, 0]} />
                                                    <Bar dataKey="closed" name="Fechados" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                                                    <Bar dataKey="high" name="Int. Alto" fill="#10b981" radius={[0, 4, 4, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    ) : (
                                        <div className="h-[260px] flex items-center justify-center text-white/20 text-sm">Sem dados</div>
                                    )}
                                </ChartCard>

                                <ChartCard title="Evolução Mensal">
                                    {followUpTimeline.length > 0 ? (
                                        <div className="h-[260px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={followUpTimeline}>
                                                    <defs>
                                                        <linearGradient id="gFuC" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} /></linearGradient>
                                                        <linearGradient id="gFuF" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={9} tickLine={false} axisLine={false} />
                                                    <YAxis stroke="rgba(255,255,255,0.2)" fontSize={9} tickLine={false} axisLine={false} />
                                                    <Tooltip contentStyle={tooltipStyle} />
                                                    <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                                                    <Area name="Criados" type="monotone" dataKey="created" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#gFuC)" />
                                                    <Area name="Fechados" type="monotone" dataKey="closed" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#gFuF)" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    ) : (
                                        <div className="h-[260px] flex items-center justify-center text-white/20 text-sm">Sem dados</div>
                                    )}
                                </ChartCard>
                            </div>

                            {/* Status breakdown cards */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                                {Object.values(FollowUpStatus).map(s => {
                                    const meta = FU_STATUS_META[s];
                                    const count = followUpByStatus[s] || 0;
                                    const pct = followUpKPIs.total > 0 ? Math.round((count / followUpKPIs.total) * 100) : 0;
                                    return (
                                        <div key={s} className={`${meta.bg} border border-white/5 rounded-md p-4 space-y-2`}>
                                            <div className={`text-2xl font-black ${meta.color}`}>{count}</div>
                                            <div className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-tight">{meta.label}</div>
                                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: meta.chartColor }} />
                                            </div>
                                            <div className="text-[10px] text-white/25">{pct}% do total</div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Detailed table */}
                            <div className="bg-white/[0.03] border border-white/[0.08] rounded-md overflow-hidden">
                                <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
                                    <h3 className="text-sm font-black text-white">Lista de Follow-Ups ({filteredFollowUps.length})</h3>
                                    {followUpKPIs.overdue > 0 && (
                                        <span className="text-[10px] font-black text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-sm">
                                            {followUpKPIs.overdue} vencidos
                                        </span>
                                    )}
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-white/[0.03] border-b border-white/[0.06]">
                                            <tr>
                                                <th className="px-4 py-3 text-[10px] font-black text-white/50 uppercase tracking-wider">Academia</th>
                                                <th className="px-4 py-3 text-[10px] font-black text-white/50 uppercase tracking-wider">Status</th>
                                                <th className="px-4 py-3 text-[10px] font-black text-white/50 uppercase tracking-wider">Canal</th>
                                                <th className="px-4 py-3 text-[10px] font-black text-white/50 uppercase tracking-wider">Contato</th>
                                                <th className="px-4 py-3 text-[10px] font-black text-white/50 uppercase tracking-wider">Próx. Contato</th>
                                                <th className="px-4 py-3 text-[10px] font-black text-white/50 uppercase tracking-wider">Criado por</th>
                                                <th className="px-4 py-3 text-[10px] font-black text-white/50 uppercase tracking-wider">Data</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/[0.04]">
                                            {filteredFollowUps.length === 0 ? (
                                                <tr><td colSpan={7} className="px-4 py-16 text-center text-white/30 text-sm italic">Nenhum follow-up encontrado.</td></tr>
                                            ) : filteredFollowUps.map(f => {
                                                const ac = academies.find(a => a.id === f.academyId);
                                                const cr = vendedores.find(v => v.id === f.createdBy);
                                                const meta = FU_STATUS_META[f.status];
                                                const chMeta = FU_CHANNEL_META[f.contactChannel];
                                                const overdue = f.nextContactAt && new Date(f.nextContactAt) < new Date();
                                                return (
                                                    <tr key={f.id} className="hover:bg-white/[0.03] transition-colors">
                                                        <td className="px-4 py-3">
                                                            <div className="text-sm font-bold text-white">{ac?.name || '---'}</div>
                                                            <div className="text-[10px] text-white/30">{ac?.city}, {ac?.state}</div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={`text-[10px] font-black px-2 py-1 rounded-sm ${meta?.bg} ${meta?.color}`}>
                                                                {meta?.label || f.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-xs text-white/50">{chMeta?.label || f.contactChannel}</td>
                                                        <td className="px-4 py-3 text-xs text-white/50">{f.contactPerson || '---'}</td>
                                                        <td className="px-4 py-3">
                                                            {f.nextContactAt ? (
                                                                <span className={`text-[10px] font-bold ${overdue ? 'text-red-400' : 'text-white/50'}`}>
                                                                    {overdue ? '⚠ ' : ''}{new Date(f.nextContactAt).toLocaleDateString('pt-BR')}
                                                                </span>
                                                            ) : <span className="text-[10px] text-white/20">---</span>}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-bold text-white/50">{cr?.name?.charAt(0) || '?'}</div>
                                                                <span className="text-xs text-white/50">{cr?.name || 'N/A'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-xs text-white/30">{new Date(f.createdAt).toLocaleDateString('pt-BR')}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {activeTab === 'vouchers' && (
                <div className="bg-white/[0.03] border border-white/[0.08] rounded-md overflow-hidden">
                    <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
                        <h3 className="text-sm font-black text-white">Explorador de Vouchers ({filteredVouchers.length})</h3>
                    </div>
                    <div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-white/[0.03] border-b border-white/[0.06]"><tr><SortableHeader field="code" label="Código" /><SortableHeader field="date" label="Data" /><SortableHeader field="academy" label="Academia" /><SortableHeader field="event" label="Evento" /><SortableHeader field="seller" label="Vendedor" /><th className="px-4 py-3 text-[10px] font-black text-white/50 uppercase tracking-wider">Duração</th></tr></thead>
                    <tbody className="divide-y divide-white/[0.04]">{filteredVouchers.length > 0 ? [...filteredVouchers].sort((a, b) => {
                        let cA: any, cB: any;
                        if (sortBy === 'code') { cA = a.code; cB = b.code; }
                        else if (sortBy === 'date') { cA = new Date(a.createdAt).getTime(); cB = new Date(b.createdAt).getTime(); }
                        else if (sortBy === 'academy') { cA = academies.find(ac => ac.id === a.academyId)?.name || ''; cB = academies.find(ac => ac.id === b.academyId)?.name || ''; }
                        else if (sortBy === 'event') { cA = events.find(e => e.id === a.eventId)?.name || ''; cB = events.find(e => e.id === b.eventId)?.name || ''; }
                        else if (sortBy === 'seller') { const vA = visits.find(v => v.id === a.visitId); const vB = visits.find(v => v.id === b.visitId); cA = vendedores.find(u => u.id === vA?.salespersonId)?.name || ''; cB = vendedores.find(u => u.id === vB?.salespersonId)?.name || ''; }
                        else { cA = new Date(a.createdAt).getTime(); cB = new Date(b.createdAt).getTime(); }
                        if (cA < cB) return sortOrder === 'asc' ? -1 : 1;
                        if (cA > cB) return sortOrder === 'asc' ? 1 : -1;
                        return 0;
                    }).map(v => {
                        const visit = visits.find(vis => vis.id === v.visitId);
                        const academy = academies.find(a => a.id === v.academyId);
                        const event = events.find(e => e.id === v.eventId);
                        const seller = vendedores.find(u => u.id === visit?.salespersonId);
                        return (
                            <tr key={v.code} className="hover:bg-white/[0.03] transition-colors group">
                                <td className="px-4 py-3"><span className="font-mono font-black text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-sm border border-amber-500/20">{v.code}</span></td>
                                <td className="px-4 py-3 text-xs text-white/50">{new Date(v.createdAt).toLocaleDateString('pt-BR')}</td>
                                <td className="px-4 py-3"><div className="text-sm font-bold text-white">{academy?.name || '---'}</div><div className="text-[10px] text-white/30">{academy?.city}</div></td>
                                <td className="px-4 py-3 text-xs text-white/60">{event?.name || '---'}</td>
                                <td className="px-4 py-3"><div className="flex items-center space-x-1.5"><div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-bold text-white/50">{seller?.name?.charAt(0) || 'S'}</div><span className="text-xs text-white/60">{seller?.name || 'N/A'}</span></div></td>
                                <td className="px-4 py-3 text-xs text-white/40">{visit?.startedAt && visit?.finishedAt ? `${calculateTrueVisitDuration(visit.startedAt, visit.finishedAt) || '---'} min` : '---'}</td>
                            </tr>
                        );
                    }) : <tr><td colSpan={6} className="px-4 py-16 text-center text-white/30 text-sm italic">Nenhum voucher encontrado.</td></tr>}</tbody></table></div>
                </div>
            )}
        </div>
    );
};
