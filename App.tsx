
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BarChart3,
  Building2,
  CalendarDays,
  Users,
  Wallet,
  FileBarChart,
  ClipboardList,
  LogOut,
  Menu,
  X,
  CheckCircle2,
  Clock,
  MapPin,
  Plus,
  Minus,
  Download,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Ticket,
  Eye,
  Info,
  Bell,
  Search,
  Edit3,
  Trash2,
  Upload,
  Save,
  History,
  Phone,
  User as UserIcon,
  UserPlus,
  RefreshCw,
  Send,
  Filter,
  FileDown,
  Printer,
  FileSpreadsheet,
  Wallet as WalletIcon,
  UserCheck,
  QrCode,
  Copy,
  ExternalLink,
  Thermometer,
  Share2,
  TrendingUp
} from 'lucide-react';
import {
  User,
  UserRole,
  Academy,
  Event,
  EventStatus,
  Visit,
  VisitStatus,
  AcademyTemperature,
  FinanceRecord,
  FinanceStatus,
  Voucher,
  AcademyObservation
} from './types';
import {
  INITIAL_ACADEMIES, // Keeping for fallback if needed, or remove
  INITIAL_EVENTS,
  INITIAL_FINANCE,
  generateVoucherCode
} from './data';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import CustomAuth from './components/CustomAuth';
import { ProgressBar } from './components/ProgressBar';
import { AdminDashboard } from './components/AdminDashboard';
import { Reports } from './components/Reports';
import { EventsManager } from './components/EventsManager';
import { AcademiesManager } from './components/AcademiesManager';
import { UsersManager } from './components/UsersManager';
import { SalesFinance } from './components/SalesFinance';
import { supabase, DatabaseService, AuthService } from './lib/supabase';
import { designTokens, cn } from './lib/designTokens';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  Label
} from 'recharts';

interface Notification {
  id: string;
  userId: string;
  message: string;
  read: boolean;
  timestamp: string;
}

// --- COMPONENTE PÚBLICO DE LANDING PAGE DE VOUCHERS ---
const PublicVoucherLanding: React.FC<{ academyName: string, codes: string[], createdAt: number }> = ({ academyName, codes, createdAt }) => {
  const [copied, setCopied] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const now = Date.now();
  const expirationTime = 24 * 60 * 60 * 1000; // 24 hours
  const isExpired = createdAt > 0 && (now - createdAt > expirationTime);

  const contentToCopy = `Thank you for being part of the upcoming PBJJF event! 🥋\n\nYour academy (${academyName}) has received the following vouchers:\n👉 ${codes.join(', ')}\n\nTo redeem, please send a text message to (407) 633-9166 with the academy name and the voucher codes listed above.\n\nWe appreciate the partnership and wish you a great event!`;

  const handleCopy = () => {
    navigator.clipboard.writeText(contentToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isClosed) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-6 text-center animate-in fade-in duration-500">
        <div className="bg-neutral-800 border border-neutral-700 max-w-md w-full p-10 rounded-[2rem] space-y-4 shadow-2xl">
          <div className="text-emerald-500 font-black text-4xl mb-4 animate-bounce">OSS!</div>
          <h1 className="text-2xl font-black text-white">Vouchers Saved!</h1>
          <p className="text-neutral-400">You can now close this screen.</p>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-6 text-center animate-in fade-in duration-500">
        <div className="bg-neutral-800 border border-neutral-700 max-w-md w-full p-10 rounded-[2rem] space-y-4 shadow-2xl">
          <div className="bg-red-500/20 text-red-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto"><Clock size={32} /></div>
          <h1 className="text-2xl font-black text-white">Expired Link</h1>
          <p className="text-neutral-400">This voucher link expired after 24 hours for security reasons. Please request a new code from your representative.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-neutral-900 border border-neutral-800 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col items-center">
        {/* Header */}
        <div className="pt-12 pb-8 flex flex-col items-center space-y-4 px-6 text-center w-full">
          <div className="w-48 h-20 flex items-center justify-center mb-2">
            <img src="/PBJJF_logo.jpeg" alt="PBJJF" className="h-full w-auto opacity-90" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">PBJJF Vouchers</h1>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] leading-relaxed max-w-xs">{academyName}</p>
        </div>

        <div className="w-full h-px bg-white/5 mx-auto max-w-xs"></div>

        <div className="p-8 md:p-10 w-full space-y-10">
          <div className="space-y-8 text-center">
            <h2 className="text-xl font-bold text-white leading-snug px-4">
              Thank you for being part of the upcoming PBJJF event! 🥋
            </h2>

            {/* Voucher Box */}
            <div className="bg-white/[0.03] border border-white/5 rounded-[2rem] p-8 space-y-6">
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Your Vouchers</p>
              <div className="flex flex-wrap gap-4 justify-center">
                {codes.map((c, i) => (
                  <div key={i} className="bg-black/40 border border-white/10 text-white px-8 py-4 rounded-2xl font-mono font-black text-xl md:text-2xl shadow-inner uppercase">
                    {c}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-neutral-800/40 p-6 rounded-2xl border border-neutral-700/50 text-xs md:text-sm text-neutral-400 leading-relaxed text-center">
              To redeem, please send a text message to <span className="text-white font-bold">(407) 633-9166</span> with the academy name and the voucher codes listed above.
            </div>
            <p className="text-center text-[10px] font-bold text-neutral-500 italic">We appreciate the partnership and wish you a great event!</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleCopy}
              className={`w-full flex items-center justify-center space-x-2 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl ${copied ? 'bg-emerald-600 text-white' : 'bg-white text-neutral-900 hover:bg-neutral-200'
                }`}
            >
              {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
              <span>{copied ? 'Link Copied!' : 'Copy Instructions & Codes'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="w-full bg-black/30 p-8 border-t border-white/5 space-y-6">
          <div className="flex justify-center items-center space-x-2 text-[8px] md:text-[10px] text-white/20 font-black uppercase tracking-[0.2em]">
            <span>Expires in 24 hours</span>
            <span className="text-white/10">•</span>
            <span>Secure BJJVisits Token</span>
          </div>

          <button
            onClick={() => setIsClosed(true)}
            className="w-full flex items-center justify-center space-x-2 text-white/40 hover:text-white transition-colors text-[10px] font-black uppercase tracking-[0.2em]"
          >
            <X size={14} />
            <span>Close Screen</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/* OLD ADMIN DASHBOARD - REPLACED WITH NEW MODERN DESIGN
const AdminDashboard: React.FC<{ events: Event[], academies: Academy[], visits: Visit[], vouchers: Voucher[], finance: FinanceRecord[], vendedores: User[] }> = ({ events, academies, visits, vouchers, finance = [], vendedores = [] }) => {
  // Years based ONLY on events as requested
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    events.forEach(e => { if (e.startDate) yearsSet.add(new Date(e.startDate).getFullYear().toString()); });
    vouchers.forEach(v => { if (v.createdAt) yearsSet.add(new Date(v.createdAt).getFullYear().toString()); });
    visits.forEach(v => { if (v.finishedAt) yearsSet.add(new Date(v.finishedAt).getFullYear().toString()); });

    // Fallback to current year if no data
    if (yearsSet.size === 0) yearsSet.add(new Date().getFullYear().toString());

    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [events, vouchers, visits]);

  const [selectedYear, setSelectedYear] = useState<string>(availableYears[0] || new Date().getFullYear().toString());
  const [syncingSheet, setSyncingSheet] = useState(false);

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

  // All visits that BELONG to events in the selected year
  const visitsInYear = useMemo(() => {
    const eventIds = new Set(filteredEvents.map(e => e.id));
    return visits.filter(v => eventIds.has(v.eventId));
  }, [visits, filteredEvents]);

  const filteredVisits = useMemo(() => {
    const map = new Map<string, Visit>();
    visitsInYear.forEach(v => {
      if (v.status === VisitStatus.VISITED) {
        const event = filteredEvents.find(e => e.id === v.eventId);
        if (event?.academiesIds.includes(v.academyId)) {
          const key = `${v.eventId}-${v.academyId}`;
          if (!map.has(key) || (v.finishedAt && map.get(key)?.finishedAt && v.finishedAt > (map.get(key)?.finishedAt || ''))) {
            map.set(key, v);
          }
        }
      }
    });
    return Array.from(map.values());
  }, [visitsInYear, filteredEvents]);

  const filteredPendingVisits = useMemo(() => {
    // Total assignments in filtered events
    const totalAssignments = filteredEvents.reduce((acc, e) => acc + (e.academiesIds?.length || 0), 0);
    const completedCount = filteredVisits.length;
    return { length: Math.max(0, totalAssignments - completedCount) };
  }, [filteredEvents, filteredVisits]);
  const filteredVouchers = useMemo(() => vouchers.filter(v => new Date(v.createdAt).getFullYear().toString() === selectedYear), [vouchers, selectedYear]);

  // KPIs
  const pendingVisitsCount = filteredPendingVisits.length;
  const activeEventsCount = filteredEvents.filter(e => e.status === EventStatus.IN_PROGRESS || e.status === EventStatus.UPCOMING).length;

  const activePerformance = useMemo(() => {
    const activeEvents = events.filter(e => e.status === EventStatus.IN_PROGRESS || e.status === EventStatus.UPCOMING);
    const activeEventIds = new Set(activeEvents.map(e => e.id));

    // Sum of all academies expected to be visited in active events
    let totalAssignments = 0;
    activeEvents.forEach(e => {
      totalAssignments += (e.academiesIds?.length || 0);
    });

    const activeVs = visits.filter(v => activeEventIds.has(v.eventId));
    
    // Correct calculation of unique visited assignments and their data (like temperature)
    const uniqueActiveVisits = activeEvents.flatMap(e => {
      const inEvent = activeVs.filter(v => v.eventId === e.id && v.status === VisitStatus.VISITED);
      const map = new Map<string, Visit>();
      inEvent.forEach(v => {
        if (e.academiesIds.includes(v.academyId)) {
          if (!map.has(v.academyId) || (v.finishedAt && map.get(v.academyId)?.finishedAt && v.finishedAt > (map.get(v.academyId)?.finishedAt || ''))) {
            map.set(v.academyId, v);
          }
        }
      });
      return Array.from(map.values());
    });

    const visitedCount = uniqueActiveVisits.length;

    const counts = { [AcademyTemperature.HOT]: 0, [AcademyTemperature.WARM]: 0, [AcademyTemperature.COLD]: 0 };
    uniqueActiveVisits.forEach(v => {
      if (v.temperature) counts[v.temperature]++;
    });

    const percent = totalAssignments > 0 ? Math.round((visitedCount / totalAssignments) * 100) : 0;

    return {
      completed: visitedCount,
      pending: Math.max(0, totalAssignments - visitedCount),
      total: totalAssignments,
      percent,
      temperatureData: Object.entries(counts).map(([name, value]) => ({ name, value })),
      chartData: [
        { name: 'Concluídas', value: visitedCount, color: '#10b981' },
        { name: 'Pendentes', value: Math.max(0, totalAssignments - visitedCount), color: '#ef4444' }
      ]
    };
  }, [events, visits]);

  // Chart Data: Academy Temperature
  const temperatureData = useMemo(() => {
    const counts = { [AcademyTemperature.HOT]: 0, [AcademyTemperature.WARM]: 0, [AcademyTemperature.COLD]: 0 };
    filteredVisits.forEach(v => {
      if (v.temperature) counts[v.temperature]++;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredVisits]);

  // Chart Data: Visit Status
  const visitStatusData = useMemo(() => {
    const visited = filteredVisits.length;
    const pending = filteredPendingVisits.length;
    return [
      { name: 'Realizadas', value: visited, color: '#10b981' },
      { name: 'Pendentes', value: pending, color: '#64748b' }
    ];
  }, [filteredVisits, filteredPendingVisits]);

  // Seller Leaderboard (Sorted by VISITS, Revenue removed)
  const sellerLeaderboard = useMemo(() => {
    const stats: Record<string, { name: string, visits: number }> = {};
    vendedores.forEach(v => stats[v.id] = { name: v.name, visits: 0 });

    // Revenue calc removed as per request

    filteredVisits.forEach(v => {
      if (v.salespersonId && stats[v.salespersonId]) {
        stats[v.salespersonId].visits += 1;
      }
    });

    return Object.values(stats).sort((a, b) => b.visits - a.visits).slice(0, 5);
  }, [vendedores, filteredVisits]);

  return (
    <div className="space-y-6">
      {/* Header & Year Filter *\/}
      <div className="flex justify-between items-center bg-neutral-800 p-6 rounded-3xl border border-neutral-700 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-white">Dashboard</h2>
          <p className="text-neutral-400">Visão geral de performance e métricas</p>
        </div>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="bg-neutral-900 border border-neutral-700 text-white text-sm font-bold rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-white"
        >
          {availableYears.map(yr => (
            <option key={yr} value={yr}>{yr}</option>
          ))}
        </select>
      </div>

      {/* KPI Cards *\/}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Eventos Ativos', value: activeEventsCount, icon: CalendarDays, color: 'neutral', sub: 'Eventos em andamento', tag: 'Eventos' },
          { label: 'Visitas Realizadas', value: filteredVisits.length, icon: CheckCircle2, color: 'emerald', sub: `Total acumulado ${selectedYear}`, tag: 'Sucesso' },
          { label: 'Visitas Pendentes', value: pendingVisitsCount, icon: Clock, color: 'neutral', sub: 'Aguardando atendimento', tag: 'Planejadas' },
          { label: 'Vouchers Gerados', value: filteredVouchers.length, icon: Ticket, color: 'amber', tag: 'Vouchers', sync: true, noIcon: true }
        ].map((kpi, i) => (
          <div key={i} className="bg-neutral-800 p-6 rounded-3xl border border-neutral-700 shadow-sm relative overflow-hidden group flex flex-col items-center text-center justify-between">
            <div className="w-full flex flex-col items-center">
              <div className="flex justify-between items-start mb-2 w-full">
                <div className="w-8" /> {/* Placeholder for balance *\/}
                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${kpi.color === 'emerald' ? 'bg-emerald-900/20 text-emerald-500/50' : kpi.color === 'amber' ? 'bg-amber-900/20 text-amber-500/50' : 'bg-neutral-900/50 text-neutral-500'}`}>
                    {kpi.tag}
                  </span>
                </div>
                <div className="w-8 flex justify-end">
                  {kpi.sync && !kpi.noIcon && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSyncSheet(); }}
                      disabled={syncingSheet}
                      className="p-1.5 bg-neutral-900/50 rounded-lg hover:bg-neutral-900 transition-colors text-amber-500"
                    >
                      <RefreshCw size={14} strokeWidth={2} className={syncingSheet ? 'animate-spin' : ''} />
                    </button>
                  )}
                </div>
              </div>

              {!kpi.noIcon && (
                <div className={`p-3 rounded-2xl mb-4 ${kpi.color === 'emerald' ? 'bg-emerald-900/30 text-emerald-400' : kpi.color === 'amber' ? 'bg-amber-900/30 text-amber-400' : 'bg-neutral-900/30 text-neutral-400'}`}>
                  <kpi.icon size={24} strokeWidth={1.5} />
                </div>
              )}

              <div className="mt-2 text-center">
                <h3 className="text-4xl font-black text-white">{kpi.value}</h3>
                <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest mt-1">{kpi.label}</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-700/50 w-full flex flex-col items-center">
              {kpi.sync && kpi.noIcon ? (
                <button
                  onClick={(e) => { e.stopPropagation(); handleSyncSheet(); }}
                  disabled={syncingSheet}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/20"
                >
                  <RefreshCw size={14} strokeWidth={2} className={syncingSheet ? 'animate-spin' : ''} />
                  <span>{syncingSheet ? 'Sincronizando...' : 'Atualizar Planilha'}</span>
                </button>
              ) : (
                <p className="text-[10px] text-neutral-500 font-medium">{kpi.sub || 'Período atual'}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Performance & Temperature Row *\/}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-neutral-800 p-8 rounded-[2.5rem] border border-neutral-700 shadow-xl relative overflow-hidden">
          {/* Background Decoration *\/}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] -mr-32 -mt-32 rounded-full"></div>

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="flex-1 space-y-6">
                <div>
                  <h3 className="text-sm font-black text-neutral-400 uppercase tracking-[0.2em] mb-1">Performance de Visitas</h3>
                  <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Acompanhamento de eventos ativos</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-neutral-900/60 backdrop-blur-md p-6 rounded-3xl border border-neutral-700/50 flex flex-col justify-between group hover:border-emerald-500/30 transition-all">
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4">Concluídas</span>
                    <div>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-5xl font-black text-white">{activePerformance.completed}</span>
                        <span className="text-sm font-bold text-neutral-500"></span>
                      </div>
                      <p className="text-[10px] text-neutral-500 font-medium mt-2">Visitas registradas com sucesso</p>
                    </div>
                  </div>

                  <div className="bg-neutral-900/60 backdrop-blur-md p-6 rounded-3xl border border-neutral-700/50 flex flex-col justify-between group hover:border-amber-500/30 transition-all">
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-4">Pendentes</span>
                    <div>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-5xl font-black text-white/50 group-hover:text-white transition-colors">{activePerformance.pending}</span>
                        <span className="text-sm font-bold text-neutral-500"></span>
                      </div>
                      <p className="text-[10px] text-neutral-500 font-medium mt-2">Aguardando atendimento oficial</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Progresso Total das Visitas</span>
                    <span className="text-xs font-black text-white">{activePerformance.percent}%</span>
                  </div>
                  <div className="h-2 bg-neutral-900 rounded-full overflow-hidden border border-neutral-700/50 p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-1000"
                      style={{ width: `${activePerformance.percent}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Visual Performance Horizontal Bar Chart *\/}
              <div className="flex-1 min-w-[300px] space-y-4">
                <div className="w-full h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={activePerformance.chartData}
                      layout="vertical"
                      margin={{ top: 0, right: 30, left: 80, bottom: 0 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="name"
                        type="category"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#737373', fontSize: 10, fontWeight: 'bold' }}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-neutral-900 border border-neutral-700 p-2 rounded-xl shadow-2xl animate-in fade-in zoom-in-95">
                                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">{payload[0].payload.name}</p>
                                <p className="text-lg font-black text-white">{payload[0].value} <span className="text-[10px] text-neutral-500 font-bold">academias</span></p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar
                        dataKey="value"
                        radius={[0, 8, 8, 0]}
                        barSize={24}
                      >
                        {activePerformance.chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-between items-center px-4">
                  <div className="flex items-center space-x-6">
                    <div className="text-left">
                      <p className="text-[8px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-1">CONCLUÍDO</p>
                      <p className="text-xl font-black text-emerald-500 leading-none">{activePerformance.percent}%</p>
                    </div>
                    <div className="text-left">
                      <p className="text-[8px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-1">PENDENTE</p>
                      <p className="text-xl font-black text-red-500 leading-none">{100 - activePerformance.percent}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 border-t border-neutral-700/50 pt-8">
              <h3 className="text-sm font-black text-neutral-400 uppercase tracking-[0.2em] mb-6">Indicador de Interesse</h3>
              <div className="grid grid-cols-3 gap-8">
                {[
                  { label: 'Quente', key: AcademyTemperature.HOT, color: 'text-red-500', bg: 'bg-red-500' },
                  { label: 'Morno', key: AcademyTemperature.WARM, color: 'text-blue-500', bg: 'bg-blue-500' },
                  { label: 'Frio', key: AcademyTemperature.COLD, color: 'text-neutral-400', bg: 'bg-neutral-600' }
                ].map((temp) => {
                  const count = activePerformance.temperatureData.find(t => t.name === temp.key)?.value || 0;
                  const totalCount = Math.max(activePerformance.completed, 1);
                  const percent = Math.round((count / totalCount) * 100);
                  return (
                    <div key={temp.key} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${temp.bg}`}></div>
                          <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{temp.label}</span>
                        </div>
                        <span className="text-[10px] font-black text-neutral-300">{count}</span>
                      </div>
                      <div className="h-1 bg-neutral-900 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${temp.bg} opacity-80 rounded-full transition-all duration-1000`}
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                      <p className={`text-xl font-black ${temp.color}`}>{count > 0 ? `${percent}%` : '0%'}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard & Latest Activity *\/}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-neutral-800 p-6 rounded-3xl border border-neutral-700 shadow-sm">
          <h3 className="text-lg font-bold text-white mb-4">Top Vendedores</h3>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-neutral-700 text-xs text-neutral-500 uppercase font-black">
                <th className="pb-3">Vendedor</th>
                <th className="pb-3 text-right">Visitas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-700/50">
              {sellerLeaderboard.map((seller, idx) => (
                <tr key={idx} className="hover:bg-neutral-700/30">
                  <td className="py-3 text-sm font-bold text-white flex items-center">
                    <span className="w-6 h-6 rounded-lg bg-neutral-700 flex items-center justify-center mr-3 text-xs">{idx + 1}</span>
                    {seller.name}
                  </td>
                  <td className="py-3 text-sm text-neutral-400 text-right">{seller.visits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-neutral-800 p-6 rounded-3xl border border-neutral-700 shadow-sm">
          <h3 className="text-lg font-bold text-white mb-4">Últimos Lançamentos</h3>
          <div className="space-y-4">
            {[...finance]
              .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
              .slice(0, 5)
              .map(f => (
                <div key={f.id} className="flex items-center justify-between p-3 bg-neutral-900/50 rounded-2xl border border-neutral-800">
                  <div className="flex items-center space-x-3">
                    <div className="bg-emerald-900/30 text-emerald-500 p-2 rounded-lg"><Wallet size={16} strokeWidth={1.5} /></div>
                    <div>
                      <p className="text-sm font-bold text-white tracking-tight">{events.find(e => e.id === f.eventId)?.name || 'Evento'}</p>
                      <p className="text-[10px] text-neutral-500">{new Date(f.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-white">${f.amount.toFixed(2)}</p>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase ${f.status === FinanceStatus.PENDING ? 'bg-amber-900/20 text-amber-500' :
                      f.status === FinanceStatus.PAID ? 'bg-neutral-900/40 text-neutral-500' :
                        'bg-emerald-900/20 text-emerald-500'
                      }`}>
                      {f.status}
                    </span>
                  </div>
                </div>
              ))}
            {finance.length === 0 && <p className="text-neutral-500 text-sm text-center py-4">Nenhum lançamento recente.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
END OF OLD ADMIN DASHBOARD */


/* OLD ACADEMIES MANAGER - REPLACED WITH NEW MODERN DESIGN
const AcademiesManager: React.FC<{ academies: Academy[], setAcademies: React.Dispatch<React.SetStateAction<Academy[]>>, currentUser: User, notifyUser: (uid: string, msg: string) => void }> = ({ academies, setAcademies, currentUser, notifyUser }) => {
  // ... (código antigo comentado)
  return null;
};
END OF OLD ACADEMIES MANAGER */


/* OLD EVENTS MANAGER - REPLACED WITH NEW MODERN DESIGN
const EventsManager: React.FC<{ events: Event[], visits: Visit[], setEvents: any, academies: Academy[], vendedores: User[], onSelectEvent: any, notifyUser: (uid: string, msg: string) => void }> = ({ events, visits, setEvents, academies, vendedores, onSelectEvent, notifyUser }) => {
  // ... (código antigo comentado)
  return null;
};
END OF OLD EVENTS MANAGER */


const EventDetailAdmin: React.FC<{ event: Event, academies: Academy[], visits: Visit[], vendedores: User[], onBack: any, onUpdateEvent: any, notifyUser: (uid: string, msg: string) => void }> = ({ event, academies, visits, vendedores, onBack, onUpdateEvent, notifyUser }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Event>>({ ...event });

  const eventAcademies = academies.filter(a => event.academiesIds.includes(a.id));

  const finishedIds = visits.filter(v => v.eventId === event.id).map(v => v.academyId);
  const pendingAcademies = eventAcademies.filter(a => !finishedIds.includes(a.id));
  const finishedAcademies = eventAcademies.filter(a => finishedIds.includes(a.id));

  // Available = not in event AND matches search AND matches filters
  const availableAcademies = useMemo(() => {
    return academies.filter(a => {
      const isLinked = event.academiesIds.includes(a.id);
      if (isLinked) return false;

      const matchesSearch = !searchTerm ||
        (a.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (a.responsible?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (a.phone || '').includes(searchTerm);

      const matchesCity = !cityFilter || a.city === cityFilter;
      const matchesState = !stateFilter || a.state === stateFilter;

      return matchesSearch && matchesCity && matchesState;
    });
  }, [academies, event.academiesIds, searchTerm, cityFilter, stateFilter]);

  // Unique filters for the modal
  const modalCities = useMemo(() => Array.from(new Set(academies.filter(a => !event.academiesIds.includes(a.id)).map(a => a.city).filter(Boolean))).sort(), [academies, event.academiesIds]);
  const modalStates = useMemo(() => Array.from(new Set(academies.filter(a => !event.academiesIds.includes(a.id)).map(a => a.state).filter(Boolean))).sort(), [academies, event.academiesIds]);

  const handleBulkLink = () => {
    if (selectedIds.length === 0) return;
    onUpdateEvent({ ...event, academiesIds: [...event.academiesIds, ...selectedIds] });
    setSelectedIds([]);
    setShowAddModal(false);
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleRemoveAcademy = (academyId: string) => {
    if (window.confirm('Deseja remover esta academia deste evento?')) {
      onUpdateEvent({ ...event, academiesIds: event.academiesIds.filter(id => id !== academyId) });
    }
  };

  const handleSalespersonChange = (newSalespersonId: string) => {
    const oldSalespersonId = event.salespersonId;
    onUpdateEvent({ ...event, salespersonId: newSalespersonId || undefined });

    if (newSalespersonId && newSalespersonId !== oldSalespersonId) {
      notifyUser(newSalespersonId, `Você foi atribuído ao evento "${event.name}".`);
    }
    if (oldSalespersonId && oldSalespersonId !== newSalespersonId) {
      notifyUser(oldSalespersonId, `Você não é mais o responsável pelo evento "${event.name}".`);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name || !editForm.city || !editForm.state || !editForm.startDate || !editForm.endDate) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }
    await onUpdateEvent(editForm);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-2">
        <button onClick={onBack} className="flex items-center text-neutral-500 font-bold hover:underline transition-all hover:text-neutral-400">
          <ChevronLeft size={18} strokeWidth={1.5} className="mr-1" /> Voltar para Eventos
        </button>
        {!isEditing && (
          <button
            onClick={() => { setEditForm({ ...event }); setIsEditing(true); }}
            className="flex items-center space-x-2 bg-neutral-700 hover:bg-neutral-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all"
          >
            <Edit3 size={16} strokeWidth={1.5} />
            <span>Editar Informações</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-neutral-800 p-8 rounded-3xl border border-neutral-700 shadow-sm">
            {isEditing ? (
              <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase ml-1">Nome do Evento</label>
                  <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full bg-neutral-900 border border-neutral-700 p-3 rounded-xl text-white outline-none focus:border-white" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-neutral-500 uppercase ml-1">Cidade</label>
                  <input type="text" value={editForm.city} onChange={e => setEditForm({ ...editForm, city: e.target.value })} className="w-full bg-neutral-900 border border-neutral-700 p-3 rounded-xl text-white outline-none focus:border-white" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-neutral-500 uppercase ml-1">UF</label>
                  <input type="text" maxLength={2} value={editForm.state} onChange={e => setEditForm({ ...editForm, state: e.target.value.toUpperCase() })} className="w-full bg-neutral-900 border border-neutral-700 p-3 rounded-xl text-white outline-none focus:border-white" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-neutral-500 uppercase ml-1">Data Início</label>
                  <input type="date" value={editForm.startDate} onChange={e => setEditForm({ ...editForm, startDate: e.target.value })} className="w-full bg-neutral-900 border border-neutral-700 p-3 rounded-xl text-white outline-none focus:border-white" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-neutral-500 uppercase ml-1">Data Fim</label>
                  <input type="date" value={editForm.endDate} onChange={e => setEditForm({ ...editForm, endDate: e.target.value })} className="w-full bg-neutral-900 border border-neutral-700 p-3 rounded-xl text-white outline-none focus:border-white" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase ml-1">Status</label>
                  <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value as EventStatus })} className="w-full bg-neutral-900 border border-neutral-700 p-3 rounded-xl text-white outline-none focus:border-white">
                    {Object.values(EventStatus).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2 flex space-x-3 pt-4">
                  <button type="submit" className="flex-1 bg-white hover:bg-neutral-200 text-neutral-900 py-3 rounded-xl font-bold transition-all">Salvar Alterações</button>
                  <button type="button" onClick={() => setIsEditing(false)} className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white py-3 rounded-xl font-bold transition-all">Cancelar</button>
                </div>
              </form>
            ) : (
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 bg-neutral-900/50 px-2 py-1 rounded-full">{event.status}</span>
                    <span className="text-[10px] font-bold text-neutral-500 uppercase flex items-center">
                      {event.startDate === event.endDate
                        ? new Date(event.startDate).toLocaleDateString('pt-BR')
                        : `${new Date(event.startDate).toLocaleDateString('pt-BR')} - ${new Date(event.endDate).toLocaleDateString('pt-BR')}`
                      }
                    </span>
                  </div>
                  <h3 className="text-3xl font-black text-white mt-2">{event.name}</h3>
                  <p className="text-neutral-400 flex items-center font-medium mt-1">
                    {event.city} - {event.state}
                  </p>
                </div>
                <div className="bg-neutral-900 p-4 rounded-2xl border border-neutral-800 text-center">
                  <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Academias</p>
                  <p className="text-2xl font-black text-white tabular-nums">{event.academiesIds.length}</p>
                </div>
              </div>
            )}

            <div className="border-t border-neutral-700 pt-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Academias Vinculadas</h4>
                <button
                  onClick={() => { setSelectedIds([]); setShowAddModal(true); }}
                  className="bg-white hover:bg-neutral-200 text-neutral-900 text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg flex items-center transition-all shadow-lg active:scale-95"
                >
                  <Plus size={14} strokeWidth={1.5} className="mr-1.5" /> Adicionar Academia
                </button>
              </div>
              <div className="space-y-6">
                {/* Academias Pendentes */}
                <div>
                  <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3 flex items-center">
                    Academias Pendentes ({pendingAcademies.length})
                  </h4>
                  <div className="bg-neutral-900 rounded-2xl border border-neutral-700 overflow-hidden">
                    <div className="divide-y divide-neutral-800">
                      {pendingAcademies.length > 0 ? pendingAcademies.map(a => (
                        <div
                          key={a.id}
                          className="p-4 flex justify-between items-center bg-neutral-800 hover:bg-neutral-700 transition-colors"
                        >
                          <div>
                            <p className="font-bold text-white text-sm">{a.name}</p>
                            <p className="text-[10px] text-neutral-400">{a.city} - Resp: {a.responsible}</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest">Pendente</span>
                            <button
                              onClick={() => handleRemoveAcademy(a.id)}
                              className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                              title="Remover Vinculo"
                            >
                              <Trash2 size={14} strokeWidth={1.5} />
                            </button>
                          </div>
                        </div>
                      )) : (
                        <div className="p-4 text-center text-neutral-500 text-xs italic">Nenhuma academia pendente.</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Academias Concluídas */}
                {finishedAcademies.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3 flex items-center">
                      Academias Concluídas ({finishedAcademies.length})
                    </h4>
                    <div className="bg-neutral-900 rounded-2xl border border-neutral-700 overflow-hidden">
                      <div className="divide-y divide-neutral-800">
                        {finishedAcademies.map(a => {
                          const visit = visits.find(v => v.academyId === a.id && v.eventId === event.id);
                          return (
                            <div
                              key={a.id}
                              onClick={() => visit && setSelectedVisit(visit)}
                              className="p-4 flex justify-between items-center bg-neutral-800 hover:bg-neutral-700 transition-colors cursor-pointer"
                            >
                              <div>
                                <p className="font-bold text-white text-sm">{a.name}</p>
                                <p className="text-[10px] text-neutral-400">{a.city} - Resp: {a.responsible}</p>
                              </div>
                              <div className="flex items-center space-x-3">
                                {visit && (
                                  <div className="flex items-center space-x-2">
                                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${visit.temperature === AcademyTemperature.HOT ? 'bg-red-900/30 text-red-400' : 'bg-neutral-900/30 text-neutral-400'}`}>{visit.temperature}</span>
                                    <span className="bg-emerald-900/30 text-emerald-400 p-1 rounded-full px-2 py-1 font-bold text-[10px]">OK</span>
                                  </div>
                                )}
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleRemoveAcademy(a.id); }}
                                  className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                                  title="Remover Vinculo"
                                >
                                  <Trash2 size={14} strokeWidth={1.5} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-neutral-800 p-6 rounded-3xl border border-neutral-700 shadow-sm space-y-6">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest flex items-center">
                Vendedor Responsável
              </h4>
              <p className="text-[10px] text-neutral-400 mb-3 italic">Defina quem executará as visitas</p>

              <select
                value={event.salespersonId || ''}
                onChange={(e) => handleSalespersonChange(e.target.value)}
                className="w-full border border-neutral-600 p-3 rounded-xl bg-neutral-900 focus:bg-neutral-800 outline-none focus:ring-2 focus:ring-white transition-all font-bold text-white"
              >
                <option value="">Nenhum Atribuído</option>
                {vendedores.map(v => (
                  <option key={v.id} value={v.id} className="bg-neutral-800">{v.name}</option>
                ))}
              </select>

              <div className="mt-4 p-3 bg-neutral-900/30 border border-neutral-800/50 rounded-xl">
                <div className="flex items-start space-x-2">
                  <Info size={14} strokeWidth={1.5} className="text-neutral-400 mt-0.5" />
                  <p className="text-[10px] text-neutral-300 leading-relaxed font-medium">
                    Ao alterar o vendedor, ele receberá uma notificação instantânea e o evento passará a aparecer em seu dashboard exclusivo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[110]">
          <div className="bg-neutral-800 rounded-3xl w-full max-w-2xl shadow-2xl border border-neutral-700 overflow-hidden flex flex-col h-[85vh]">
            <div className="p-6 border-b border-neutral-700 flex justify-between items-center bg-neutral-800/50">
              <div>
                <h3 className="text-xl font-bold text-white">Vincular Academias</h3>
                <p className="text-xs text-neutral-400 mt-1 flex items-center">
                  <Info size={14} strokeWidth={1.5} className="mr-1" /> Selecione as academias e clique em Vincular Selecionadas.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded-xl transition-colors"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            {/* Modal Filters */}
            <div className="p-4 bg-neutral-900/40 border-b border-neutral-700 space-y-3">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-neutral-500 transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="Buscar por nome, responsável ou telefone..."
                  className="w-full pl-11 pr-4 py-3 bg-neutral-900 border border-neutral-700 rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all font-medium text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select
                  className="bg-neutral-900 border border-neutral-700 rounded-xl text-white px-3 py-2 outline-none focus:ring-2 focus:ring-white/50 text-xs font-semibold"
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                >
                  <option value="">Cidades</option>
                  {modalCities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select
                  className="bg-neutral-900 border border-neutral-700 rounded-xl text-white px-3 py-2 outline-none focus:ring-2 focus:ring-white/50 text-xs font-semibold"
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                >
                  <option value="">Estados</option>
                  {modalStates.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-neutral-900/20">
              {availableAcademies.length > 0 ? (
                availableAcademies.map(a => {
                  const isSelected = selectedIds.includes(a.id);
                  return (
                    <button
                      key={a.id}
                      onClick={() => toggleSelection(a.id)}
                      className={`w-full p-4 flex items-center bg-neutral-800/50 border transition-all rounded-2xl group text-left ${isSelected ? 'border-white bg-neutral-900/20 ring-1 ring-white' : 'border-neutral-700 hover:border-neutral-500'
                        }`}
                    >
                      <div className={`w-6 h-6 rounded-lg mr-4 flex items-center justify-center transition-all ${isSelected ? 'bg-white text-neutral-900' : 'bg-neutral-900 border border-neutral-600 text-transparent'
                        }`}>
                        <CheckCircle2 size={16} strokeWidth={1.5} />
                      </div>
                      <div className="flex-1">
                        <p className={`font-bold transition-colors ${isSelected ? 'text-neutral-400' : 'text-white'}`}>{a.name}</p>
                        <div className="flex items-center space-x-2 text-[10px] text-neutral-400 mt-0.5">
                          <span className="bg-neutral-900 px-1.5 py-0.5 rounded text-neutral-300 font-bold uppercase">{a.state}</span>
                          <span>{a.city}</span>
                          {a.responsible && <span>• Resp: {a.responsible}</span>}
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="py-20 text-center space-y-4">
                  <div className="bg-neutral-900/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-neutral-700 text-opacity-30 font-bold">
                    ?
                  </div>
                  <p className="text-neutral-500 font-medium">Nenhuma academia disponível com estes critérios.</p>
                </div>
              )}
            </div>

            <div className="p-6 bg-neutral-800/80 border-t border-neutral-700 flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                {selectedIds.length} selecionada{selectedIds.length !== 1 ? 's' : ''}
              </span>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-bold text-neutral-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  disabled={selectedIds.length === 0}
                  onClick={handleBulkLink}
                  className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg ${selectedIds.length > 0
                    ? 'bg-white text-neutral-900 hover:bg-neutral-200 active:scale-95'
                    : 'bg-neutral-700 text-neutral-500 cursor-not-allowed text-opacity-50'
                    }`}
                >
                  <Plus size={18} />
                  <span>Vincular Selecionadas</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {selectedVisit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[120]">
          <div className="bg-neutral-800 rounded-3xl w-full max-w-lg shadow-2xl border border-neutral-700 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-neutral-700 flex justify-between items-center bg-neutral-900/30">
              <div>
                <h3 className="text-xl font-bold text-white">Detalhes da Visita</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  {academies.find(a => a.id === selectedVisit.academyId)?.name}
                </p>
              </div>
              <button
                onClick={() => setSelectedVisit(null)}
                className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded-xl transition-colors"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-900/50 p-4 rounded-2xl border border-neutral-700/50">
                  <p className="text-[10px] font-bold text-neutral-500 uppercase mb-1">Status</p>
                  <span className="text-sm font-bold text-emerald-400 flex items-center">
                    {selectedVisit.status}
                  </span>
                </div>
                <div className="bg-neutral-900/50 p-4 rounded-2xl border border-neutral-700/50">
                  <p className="text-[10px] font-bold text-neutral-500 uppercase mb-1">Temperatura</p>
                  <span className={`text-sm font-bold flex items-center ${selectedVisit.temperature === AcademyTemperature.HOT ? 'text-red-400' : 'text-neutral-400'}`}>
                    {selectedVisit.temperature}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold text-neutral-500 uppercase ml-1">Observações do Vendedor</p>
                <div className="bg-neutral-900/50 p-4 rounded-2xl border border-neutral-700/50 text-sm text-neutral-300 leading-relaxed italic">
                  {selectedVisit.notes || 'Nenhuma observação registrada.'}
                </div>
              </div>

              {selectedVisit.vouchersGenerated && selectedVisit.vouchersGenerated.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-neutral-500 uppercase ml-1">Vouchers Gerados ({selectedVisit.vouchersGenerated.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedVisit.vouchersGenerated.map(code => (
                      <span key={code} className="bg-neutral-900/30 text-neutral-400 px-3 py-1.5 rounded-lg border border-neutral-800/50 font-mono font-bold text-xs uppercase shadow-sm">
                        {code}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-neutral-700 flex justify-between items-center">
                <div className="text-[10px] text-neutral-500 font-medium">
                  <p>Início: {selectedVisit.startedAt ? new Date(selectedVisit.startedAt).toLocaleString('pt-BR') : '---'}</p>
                  <p>Fim: {selectedVisit.finishedAt ? new Date(selectedVisit.finishedAt).toLocaleString('pt-BR') : '---'}</p>
                </div>
                <button
                  onClick={() => setSelectedVisit(null)}
                  className="bg-neutral-700 hover:bg-neutral-600 text-white px-6 py-2 rounded-xl font-bold transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminFinance: React.FC<{ finance: FinanceRecord[], setFinance: any, events: Event[], vendedores: User[], notifyUser: any }> = ({ finance, setFinance, events, vendedores, notifyUser }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<FinanceRecord | null>(null);
  const [formRecord, setFormRecord] = useState<Partial<FinanceRecord>>({ status: FinanceStatus.PENDING });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLaunchOrEdit = async () => {
    if (!formRecord.eventId || !formRecord.salespersonId || !formRecord.amount) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedRecord) {
        const updatedPayload = {
          ...selectedRecord,
          ...formRecord,
          amount: Number(formRecord.amount),
          updatedAt: new Date().toISOString()
        };
        const updated = await DatabaseService.updateFinance(updatedPayload.id, updatedPayload);
        setFinance((prev: FinanceRecord[]) => prev.map(f => f.id === updated.id ? updated : f));

        const eventName = events.find(e => e.id === updated.eventId)?.name;
        notifyUser(updated.salespersonId, `Lançamento financeiro do evento "${eventName}" foi atualizado.`);
      } else {
        const payload: Partial<FinanceRecord> = {
          eventId: formRecord.eventId!,
          salespersonId: formRecord.salespersonId!,
          amount: Number(formRecord.amount),
          status: FinanceStatus.PENDING,
          updatedAt: new Date().toISOString()
        };
        const created = await DatabaseService.createFinance(payload);
        setFinance((prev: FinanceRecord[]) => [created, ...prev]);

        const eventName = events.find(e => e.id === payload.eventId)?.name;
        notifyUser(payload.salespersonId!, `Novo lançamento financeiro no valor de $ ${payload.amount?.toFixed(2)} referente ao evento "${eventName}".`);
      }

      setShowModal(false);
      setSelectedRecord(null);
    } catch (error) {
      console.error("Error saving finance record:", error);
      alert("Erro ao salvar lançamento financeiro.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRecord || !window.confirm("Tem certeza que deseja excluir este lançamento?")) return;

    setIsSubmitting(true);
    try {
      await DatabaseService.deleteFinance(selectedRecord.id);
      setFinance((prev: FinanceRecord[]) => prev.filter(f => f.id !== selectedRecord.id));
      setShowModal(false);
      setSelectedRecord(null);
    } catch (error: any) {
      console.error("Error deleting finance record:", error);
      alert("Erro ao excluir lançamento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAsPaid = async (e: React.MouseEvent, record: FinanceRecord) => {
    e.stopPropagation();
    if (!window.confirm("Confirmar que este pagamento foi efetuado?")) return;

    try {
      const updated = await DatabaseService.updateFinance(record.id, { ...record, status: FinanceStatus.PAID, updatedAt: new Date().toISOString() });
      setFinance((prev: FinanceRecord[]) => prev.map(f => f.id === record.id ? updated : f));

      const eventName = events.find(e => e.id === record.eventId)?.name;
      notifyUser(record.salespersonId, `Seu pagamento de $ ${record.amount.toFixed(2)} referente ao evento "${eventName}" foi realizado.`);
    } catch (error) {
      console.error("Error marking as paid:", error);
      alert("Erro ao atualizar status de pagamento.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-neutral-400">Controle de comissões.</p>
        <button onClick={() => { setSelectedRecord(null); setFormRecord({ status: FinanceStatus.PENDING }); setShowModal(true); }} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center space-x-2 shadow-lg hover:bg-emerald-700 transition-colors">
          <Plus size={18} strokeWidth={1.5} />
          <span>Lançar Pagamento</span>
        </button>
      </div>

      <div className="bg-neutral-800 rounded-2xl border border-neutral-700 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-neutral-900 border-b border-neutral-700">
            <tr>
              <th className="px-6 py-4 text-xs font-bold uppercase text-neutral-400">Evento</th>
              <th className="px-6 py-4 text-xs font-bold uppercase text-neutral-400">Vendedor</th>
              <th className="px-6 py-4 text-xs font-bold uppercase text-neutral-400">Valor</th>
              <th className="px-6 py-4 text-xs font-bold uppercase text-neutral-400">Status</th>
              <th className="px-6 py-4 text-xs font-bold uppercase text-neutral-400 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-700">
            {finance.map(f => (
              <tr key={f.id} onClick={() => { setSelectedRecord(f); setFormRecord({ ...f }); setShowModal(true); }} className="text-sm hover:bg-neutral-700/50 cursor-pointer group">
                <td className="px-6 py-4 font-bold text-white relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 group-hover:h-2/3 bg-neutral-500 transition-all rounded-r-full"></div>
                  {events.find(e => e.id === f.eventId)?.name}
                </td>
                <td className="px-6 py-4 text-neutral-300">{vendedores.find(v => v.id === f.salespersonId)?.name}</td>
                <td className="px-6 py-4 font-black text-white tabular-nums text-lg">$ {f.amount.toFixed(2)}</td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${f.status === FinanceStatus.PENDING ? 'bg-amber-900/30 text-amber-400' :
                    f.status === FinanceStatus.PAID ? 'bg-neutral-900/30 text-neutral-400' : 'bg-emerald-900/30 text-emerald-400'
                    }`}>
                    {f.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <span className="text-xs font-bold text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity">Editar</span>
                    {f.status === FinanceStatus.PENDING && (
                      <button onClick={(e) => handleMarkAsPaid(e, f)} className="text-xs bg-white text-neutral-900 px-3 py-1.5 rounded-lg font-bold hover:bg-neutral-200 transition-colors">Marcar Pago</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-neutral-800 rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 border border-neutral-700">
            <div className="p-6 border-b border-neutral-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">{selectedRecord ? 'Editar Lançamento' : 'Novo Lançamento'}</h3>
              <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-white"><X size={18} strokeWidth={1.5} /></button>
            </div>
            <div className="p-6 space-y-4">
              <select className="w-full border border-neutral-600 p-3 rounded-xl bg-neutral-700 text-white focus:border-white outline-none" value={formRecord.eventId || ''} onChange={e => setFormRecord({ ...formRecord, eventId: e.target.value })}>
                <option value="">Evento</option>
                {events.map(e => <option key={e.id} value={e.id} className="bg-neutral-800">{e.name}</option>)}
              </select>
              <select className="w-full border border-neutral-600 p-3 rounded-xl bg-neutral-700 text-white focus:border-white outline-none" value={formRecord.salespersonId || ''} onChange={e => setFormRecord({ ...formRecord, salespersonId: e.target.value })}>
                <option value="">Vendedor</option>
                {vendedores.map(v => <option key={v.id} value={v.id} className="bg-neutral-800">{v.name}</option>)}
              </select>
              <input type="number" step="0.01" className="w-full border border-neutral-600 p-3 rounded-xl bg-neutral-700 text-white focus:border-white outline-none placeholder:text-neutral-400" placeholder="Valor" value={formRecord.amount || ''} onChange={e => setFormRecord({ ...formRecord, amount: Number(e.target.value) })} />

              <div className="flex gap-3 pt-2">
                {selectedRecord && (
                  <button
                    onClick={handleDelete}
                    disabled={isSubmitting}
                    className="flex-1 bg-red-900/30 text-red-500 py-4 rounded-2xl font-bold hover:bg-red-900/50 transition-colors border border-red-900/50 flex items-center justify-center disabled:opacity-50"
                  >
                    <Trash2 size={18} strokeWidth={1.5} className="mr-2" /> Excluir
                  </button>
                )}
                <button
                  onClick={handleLaunchOrEdit}
                  disabled={isSubmitting}
                  className={`flex-[2] bg-white text-neutral-900 py-4 rounded-2xl font-bold hover:bg-neutral-200 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isSubmitting ? (
                    <><RefreshCw className="animate-spin mr-2" size={18} strokeWidth={1.5} /> Salvando...</>
                  ) : (
                    selectedRecord ? 'Salvar Alterações' : 'Lançar Pagamento'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* OLD ADMIN REPORTS - REPLACED WITH NEW MODERN DESIGN
const AdminReports: React.FC<{ visits: Visit[], academies: Academy[], events: Event[], vouchers: Voucher[], vendedores: User[] }> = ({ visits, academies, events, vouchers, vendedores }) => {
  // ... (código antigo comentado)
  return null;
};
END OF OLD ADMIN REPORTS */



const SalespersonEvents: React.FC<{ events: Event[], academies: Academy[], visits: Visit[], notifications: any, onDismissNotif: any, onSelectAcademy: any }> = ({ events, academies, visits, notifications, onDismissNotif, onSelectAcademy }) => {
  // Calculate global progress for the salesperson
  // totalAcademies should be the count of unique assignments (event_id, academy_id)
  const totalAcademies = events.reduce((acc, e) => acc + (e.academiesIds?.length || 0), 0);

  // completedVisitsCount should be the count of unique assignments that have been visited
  const completedVisitsCount = events.reduce((acc, e) => {
    const visitedInEvent = visits.filter(v => v.eventId === e.id && v.status === VisitStatus.VISITED);
    const uniqueVisitedIds = new Set(visitedInEvent.map(v => v.academyId));
    // Somente contamos academias que realmente fazem parte deste evento
    const validVisitedCount = Array.from(uniqueVisitedIds).filter(aid => e.academiesIds.includes(aid)).length;
    return acc + validVisitedCount;
  }, 0);

  return (
    <div className="space-y-6 pb-20"> {/* pb-20 to ensure content is above bottom nav */}
      <div className="bg-neutral-800 p-4 rounded-2xl border border-neutral-700 shadow-sm">
        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Seu Progresso de Visitas</h3>
        <ProgressBar total={totalAcademies} completed={completedVisitsCount} />
      </div>

      {events.map(e => {
        const allAcademies = e.academiesIds.map(aid => academies.find(a => a.id === aid)).filter(Boolean) as Academy[];
        const completedIds = visits.filter(v => v.eventId === e.id).map(v => v.academyId);
        const pendingAcademies = allAcademies.filter(a => !completedIds.includes(a.id));
        const finishedAcademies = allAcademies.filter(a => completedIds.includes(a.id));

        return (
          <div key={e.id} className="bg-neutral-800 rounded-2xl border border-neutral-700 overflow-hidden shadow-sm">
            <div className="bg-neutral-950 p-4 text-white font-bold flex items-center justify-between">
              <div className="flex items-center">
                <span className="truncate max-w-[200px]">{e.name}</span>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${e.status === EventStatus.IN_PROGRESS ? 'bg-emerald-900/30 text-emerald-400' : 'bg-neutral-800 text-neutral-300'}`}>
                {e.status === EventStatus.IN_PROGRESS ? 'ATIVO' : e.status}
              </span>
            </div>
            <div className="p-4 space-y-6">
              <div>
                <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3 flex items-center">
                  <span className="mr-1">Pendentes</span>
                  <span className="bg-neutral-700 text-white px-1.5 py-0.5 rounded text-[10px]">{pendingAcademies.length}</span>
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {pendingAcademies.map(a => (
                    <div key={a.id} onClick={() => onSelectAcademy(e.id, a.id)} className="p-4 flex justify-between items-center bg-neutral-700/30 rounded-xl active:bg-neutral-700 active:scale-[0.98] cursor-pointer group transition-all border border-neutral-700 hover:border-neutral-500">
                      <div className="flex items-center space-x-3 w-full">
                        <div className="p-2.5 rounded-xl bg-neutral-800 text-neutral-400 shrink-0 font-bold text-xs uppercase">
                          ACAD
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-white text-sm truncate">{a.name}</p>
                          <p className="text-xs text-neutral-400 truncate">{a.city} • <span className="text-neutral-500">{a.responsible}</span></p>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-neutral-500 shrink-0" />
                    </div>
                  ))}
                  {pendingAcademies.length === 0 && <p className="text-center text-xs text-neutral-500 italic py-2">Nenhuma academia pendente neste evento.</p>}
                </div>
              </div>

              {finishedAcademies.length > 0 && (
                <div className="pt-4 border-t border-neutral-700">
                  <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3 flex items-center">
                    <span className="mr-1">Concluídas</span>
                    <span className="bg-emerald-900/30 text-emerald-500 px-1.5 py-0.5 rounded text-[10px]">{finishedAcademies.length}</span>
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {finishedAcademies.map(a => {
                      const visit = visits.find(v => v.eventId === e.id && v.academyId === a.id);
                      return (
                        <div key={a.id} onClick={() => onSelectAcademy(e.id, a.id)} className="p-3 flex justify-between items-center bg-neutral-800/50 rounded-xl border border-neutral-800">
                          <div className="flex items-center space-x-3 min-w-0">
                            <div className="p-1.5 rounded-lg bg-emerald-900/10 text-emerald-600/50 font-bold text-[10px]">
                              OK
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-white text-sm opacity-50 truncate">{a.name}</p>
                              <div className="flex items-center space-x-2 mt-0.5">
                                {visit?.temperature && (
                                  <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${visit.temperature === AcademyTemperature.HOT ? 'bg-red-900/20 text-red-500/70' : 'bg-neutral-900/30 text-neutral-600'}`}>
                                    {visit.temperature}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Spacer for bottom nav */}
      <div className="h-12"></div>
    </div>
  );
};

const VisitDetail: React.FC<{ eventId: string, academy: Academy, event: Event, existingVisit?: Visit, onFinish: any, onCancel: any }> = ({ eventId, academy, event, existingVisit, onFinish, onCancel }) => {
  const [step, setStep] = useState<'START' | 'ACTIVE' | 'VOUCHERS' | 'QR_CODE' | 'SUMMARY'>(existingVisit ? 'SUMMARY' : 'START');
  const [visit, setVisit] = useState<Partial<Visit>>(existingVisit || { eventId, academyId: academy.id, salespersonId: event.salespersonId!, status: VisitStatus.PENDING, vouchersGenerated: [], notes: '', temperature: undefined });
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { if (!existingVisit) { setStep('START'); setVisit({ eventId, academyId: academy.id, salespersonId: event.salespersonId!, status: VisitStatus.PENDING, vouchersGenerated: [], notes: '', temperature: undefined }); } }, [academy.id, eventId, existingVisit]);

  const handleFinalize = () => { if (!visit.notes || !visit.temperature) { alert("Preencha as observações"); return; } setVisit(p => ({ ...p, status: VisitStatus.VISITED, finishedAt: new Date().toISOString() })); setStep('VOUCHERS'); };

  const adjust = (c: number) => { if (c > 0) { const code = generateVoucherCode(); setVisit(p => ({ ...p, vouchersGenerated: [...(p.vouchersGenerated || []), code] })); } else setVisit(p => ({ ...p, vouchersGenerated: (p.vouchersGenerated || []).slice(0, -1) })); };

  // Gera o link para a landing page pública
  const generateShareLink = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const academyName = encodeURIComponent(academy.name);
    const codes = encodeURIComponent(visit.vouchersGenerated?.join(',') || '');
    const timestamp = Date.now();
    return `${baseUrl}#/public-voucher/${academyName}|${codes}|${timestamp}`;
  };

  const handleFinishWithQr = () => {
    setStep('QR_CODE');
  };

  return (
    <div className="fixed inset-0 z-[60] bg-neutral-900 overflow-y-auto animate-in slide-in-from-right duration-300">
      {/* Fixed Header */}
      <div className="sticky top-0 bg-neutral-900/95 backdrop-blur-sm p-4 border-b border-neutral-800 z-10 flex justify-between items-center shadow-lg">
        <div>
          <h3 className="text-xl font-bold text-white leading-none">{academy.name}</h3>
          <p className="text-neutral-400 text-xs font-medium mt-1">{academy.city} - {academy.state}</p>
        </div>
        <button onClick={onCancel} className="bg-neutral-800 hover:bg-neutral-700 text-white p-2 rounded-full transition-colors">
          <X size={20} strokeWidth={1.5} />
        </button>
      </div>

      <div className="p-4 pb-32 space-y-6 max-w-lg mx-auto">
        {toast && <div className="fixed top-20 left-4 right-4 bg-neutral-900 text-white p-4 rounded-xl shadow-2xl animate-in slide-in-from-top z-[70] flex items-center space-x-2 border border-neutral-700 justify-center"><CheckCircle2 size={18} className="text-emerald-400" /><span>{toast}</span></div>}

        {/* Content Container - removed heavy borders for mobile full screen feel */}
        <div className="relative">

          {step === 'START' && (
            <div className="text-center py-8 space-y-6 animate-in zoom-in-95">
              <div className="w-20 h-20 bg-neutral-900/30 text-neutral-500 rounded-full flex items-center justify-center mx-auto animate-pulse"><Clock size={40} /></div>
              <div className="space-y-1"><h4 className="font-bold text-white">Pronto para começar?</h4><p className="text-sm text-neutral-400">Atendimento oficial para registro.</p></div>
              <button onClick={() => { setVisit(p => ({ ...p, startedAt: new Date().toISOString() })); setStep('ACTIVE'); }} className="w-full bg-white text-neutral-900 py-4 rounded-2xl font-bold shadow-xl shadow-neutral-900/20 hover:bg-neutral-200 transition-all">Iniciar Visita Agora</button>
            </div>
          )}

          {step === 'ACTIVE' && (
            <div className="space-y-6 animate-in fade-in">
              <textarea placeholder="Observações..." className="w-full h-32 border border-neutral-600 bg-neutral-700 text-white p-4 rounded-2xl text-sm outline-none transition-all placeholder:text-neutral-500 focus:border-white" value={visit.notes} onChange={e => setVisit(p => ({ ...p, notes: e.target.value }))} />
              <div className="grid grid-cols-3 gap-3">
                {[AcademyTemperature.COLD, AcademyTemperature.WARM, AcademyTemperature.HOT].map(t => (
                  <button key={t} onClick={() => setVisit(p => ({ ...p, temperature: t }))} className={`py-3 rounded-xl font-bold transition-all border ${visit.temperature === t ? 'bg-white text-neutral-900 border-white' : 'bg-neutral-700 text-neutral-400 border-neutral-600 hover:bg-neutral-600'}`}>{t}</button>
                ))}
              </div>
              <button onClick={handleFinalize} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-colors">Gerar Vouchers</button>
            </div>
          )}

          {step === 'VOUCHERS' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 text-center">
              <div className="bg-neutral-700 p-6 rounded-2xl flex items-center justify-center space-x-8 border border-neutral-600">
                <button onClick={() => adjust(-1)} className="bg-neutral-600 p-3 rounded-full border border-neutral-500 shadow-sm active:scale-90 text-white hover:bg-neutral-500"><Minus size={18} strokeWidth={1.5} /></button>
                <span className="text-4xl font-black text-white tabular-nums">{visit.vouchersGenerated?.length || 0}</span>
                <button onClick={() => adjust(1)} className="bg-neutral-600 p-3 rounded-full border border-neutral-500 shadow-sm active:scale-90 text-white hover:bg-neutral-500"><Plus size={18} strokeWidth={1.5} /></button>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {visit.vouchersGenerated?.map((c, i) => (
                  <span key={i} className="bg-neutral-900/30 text-neutral-400 border border-neutral-800/50 px-3 py-1 rounded-lg font-mono font-bold">{c}</span>
                ))}
              </div>
              <button onClick={handleFinishWithQr} className="w-full bg-neutral-950 text-white py-4 rounded-2xl font-bold shadow-xl flex items-center justify-center space-x-2 border border-neutral-700">
                <QrCode size={18} strokeWidth={1.5} />
                <span>Gerar QR Code para o Dono</span>
              </button>
            </div>
          )}

          {step === 'QR_CODE' && (
            <div className="space-y-6 animate-in zoom-in-95 text-center">
              <div className="space-y-2">
              </div>
              <div className="bg-white p-4 rounded-2xl border-2 border-neutral-200 inline-block shadow-lg">
                {/* Usando o serviço qrserver para gerar o QR code dinamicamente */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(generateShareLink())}`}
                  alt="Voucher QR Code"
                  className="w-48 h-48 mx-auto"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    const landingText = `Thank you for being part of the upcoming PBJJF event! 🥋\n\nYour academy (${academy.name}) has received the following vouchers:\n👉 ${visit.vouchersGenerated?.join(', ')}\n\nTo redeem, please send a text message to (407) 633-9166 with the academy name and the voucher codes listed above.`;
                    navigator.clipboard.writeText(landingText);
                    setToast("Copiado com sucesso!");
                    setTimeout(() => setToast(null), 2000);
                  }}
                  className="flex-1 bg-neutral-700 text-neutral-300 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 text-sm hover:bg-neutral-600"
                >
                  <Copy size={16} strokeWidth={1.5} />
                  <span>Copiar Link</span>
                </button>
                <button
                  onClick={() => window.open(generateShareLink(), '_blank')}
                  className="flex-1 bg-neutral-900/30 text-neutral-400 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 text-sm hover:bg-neutral-900/50"
                >
                  <ExternalLink size={16} strokeWidth={1.5} />
                  <span>Visualizar Tela</span>
                </button>
              </div>
              <button onClick={() => onFinish(visit)} className="w-full bg-white text-neutral-900 py-4 rounded-2xl font-bold mt-4 hover:bg-neutral-200 transition-colors">Concluir e Voltar</button>
            </div>
          )}

          {step === 'SUMMARY' && (
            <div className="space-y-6 animate-in zoom-in-95">
              <div className="bg-emerald-900/30 text-emerald-400 p-4 rounded-2xl font-bold text-center border border-emerald-800/50">VISITA REGISTRADA</div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-700 p-4 rounded-xl border border-neutral-600"><span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Vouchers</span><span className="font-bold text-white tabular-nums">{visit.vouchersGenerated?.length}</span></div>
                <div className="bg-neutral-700 p-4 rounded-xl border border-neutral-600"><span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Interesse</span><span className={`font-bold ${visit.temperature === AcademyTemperature.HOT ? 'text-red-400' : 'text-neutral-400'}`}>{visit.temperature}</span></div>
              </div>
              <div className="bg-neutral-700 p-4 rounded-xl border border-neutral-600 text-sm text-neutral-300 italic">"{visit.notes}"</div>
              <div className="flex space-x-2">
                <button onClick={() => setStep('QR_CODE')} className="flex-1 bg-neutral-950 text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 border border-neutral-700"><QrCode size={18} /><span>Reexibir QR</span></button>
                <button onClick={() => setStep('ACTIVE')} className="flex-1 bg-neutral-700 text-neutral-300 py-4 rounded-2xl font-bold hover:bg-neutral-600">Editar Relatório</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* OLD SALES FINANCE - REPLACED WITH NEW MODERN DESIGN
const SalesFinance: React.FC<{ finance: FinanceRecord[], events: Event[], onConfirm: any }> = ({ finance, events, onConfirm }) => (
  // ... (código antigo comentado)
  null
);
END OF OLD SALES FINANCE */






const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [academies, setAcademies] = useState<Academy[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [finance, setFinance] = useState<FinanceRecord[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [sellers, setSellers] = useState<User[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);

  const [selectedAcademyId, setSelectedAcademyId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [globalToast, setGlobalToast] = useState<{ message: string, type: 'success' | 'info' | 'error' } | null>(null);

  // Auto-hide toast
  useEffect(() => {
    if (globalToast) {
      const timer = setTimeout(() => setGlobalToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [globalToast]);

  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Limpar campos de seleção ao mudar para abas principais (não detalhes)
  useEffect(() => {
    const detailTabs = ['visit_detail', 'event_detail_admin'];

    // Só limpamos se não estivermos indo para uma tela de detalhes
    if (!detailTabs.includes(activeTab)) {
      setSelectedEventId(null);
      setSelectedAcademyId(null);
    }

    // Verificação de Segurança de Perfil (Role Protection)
    if (currentUser) {
      const adminTabs = ['dashboard', 'access_control', 'academies', 'events', 'admin_finance', 'reports', 'event_detail_admin'];
      if (currentUser.role !== UserRole.ADMIN && adminTabs.includes(activeTab)) {
        setActiveTab('my_events');
      }
      if (currentUser.role === UserRole.ADMIN && activeTab === 'visit_detail') {
        setActiveTab('dashboard');
      }
    }
  }, [activeTab, currentUser?.role]);

  useEffect(() => {
    // Check local session
    const storedUser = localStorage.getItem('bjj_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setCurrentUser(parsed);
      } catch (e) {
        localStorage.removeItem('bjj_user');
      }
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('bjj_user', JSON.stringify(user));
    // Reset state and set initial tab
    setSelectedEventId(null);
    setSelectedAcademyId(null);
    setActiveTab(user.role === UserRole.ADMIN ? 'dashboard' : 'my_events');
  };

  // Fetch initial data
  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser?.id]); // Use ID to be safe

  const loadData = React.useCallback(async () => {
    try {
      const dbAcademies = await DatabaseService.getAcademies();
      setAcademies(dbAcademies);

      const dbEvents = await DatabaseService.getEvents();
      // Need to fetch academies for each event (junction)
      const eventsWithAcademies = await Promise.all(dbEvents.map(async (e: any) => {
        const ids = await DatabaseService.getEventAcademies(e.id);
        return { ...e, academiesIds: ids };
      }));
      setEvents(eventsWithAcademies);

      const dbVisits = await DatabaseService.getVisits();
      setVisits(dbVisits);

      const dbFinance = await DatabaseService.getFinance();
      setFinance(dbFinance);

      const dbVouchers = await DatabaseService.getVouchers();
      setVouchers(dbVouchers);

      if (currentUser) {
        const dbNotifications = await DatabaseService.getNotifications(currentUser.id);
        setNotifications(dbNotifications);
      }

    } catch (error) {
      console.error("Error loading data:", error);
    }
  }, [currentUser?.id]);

  // Real-time Notifications Subscription
  useEffect(() => {
    if (!currentUser) return;

    console.log('🔔 [Notifications] Setting up realtime subscription for user:', currentUser.id);

    const channel = supabase
      .channel(`user-notifs-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUser.id}`
        },
        (payload) => {
          console.log('🔔 [Notifications] Received realtime notification:', payload);
          const newN = payload.new;
          const mapped: Notification = {
            id: newN.id,
            userId: newN.user_id,
            message: newN.message,
            read: newN.read,
            timestamp: newN.created_at
          };
          console.log('🔔 [Notifications] Adding to state:', mapped);
          setNotifications(prev => [mapped, ...prev]);
        }
      )
      .subscribe((status) => {
        console.log('🔔 [Notifications] Subscription status:', status);
      });

    return () => {
      console.log('🔔 [Notifications] Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id]);

  // 🔄 Real-time Global Data Sync
  useEffect(() => {
    if (!currentUser) return;

    console.log('🔄 [DataSync] Setting up global realtime synchronization...');

    const channel = supabase
      .channel('global-data-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'academies' }, (p) => {
        console.log('🔄 [DataSync] academies changed:', p.eventType);
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, (p) => {
        console.log('🔄 [DataSync] events changed:', p.eventType);
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_academies' }, (p) => {
        console.log('🔄 [DataSync] event_academies changed:', p.eventType);
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visits' }, (p) => {
        console.log('🔄 [DataSync] visits changed:', p.eventType);
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vouchers' }, (p) => {
        console.log('🔄 [DataSync] vouchers changed:', p.eventType);
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'finance_records' }, (p) => {
        console.log('🔄 [DataSync] finance_records changed:', p.eventType);
        loadData();
      })
      .subscribe((status) => {
        console.log('🔄 [DataSync] Subscription status:', status);
      });

    return () => {
      console.log('🔄 [DataSync] Cleaning up global synchronization');
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, loadData]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      if (data) {
        setCurrentUser({
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role as UserRole
        });
        setActiveTab(data.role === UserRole.ADMIN ? 'dashboard' : 'my_events');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const logout = async () => {
    localStorage.removeItem('bjj_user');
    setCurrentUser(null);
    window.location.reload();
  };

  const fetchUsers = async () => {
    // Buscar apenas usuários ATIVOS da tabela app_users
    const { data: salesData } = await supabase
      .from('app_users')
      .select('*')
      .eq('role', UserRole.SALES)
      .eq('status', 'ACTIVE');
    if (salesData) setSellers(salesData as User[]);

    const { data: adminData } = await supabase
      .from('app_users')
      .select('*')
      .eq('role', UserRole.ADMIN)
      .eq('status', 'ACTIVE');
    if (adminData) setAdmins(adminData as User[]);
  };

  useEffect(() => {
    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser]);


  /* Restore notifyUser */
  const notifyUser = async (userId: string, message: string) => {
    console.log('📤 [Notifications] Sending notification:', { userId, message, currentUserId: currentUser?.id });

    // Se a notificação for para o usuário atual, mostramos um toast e adicionamos ao estado
    if (userId === currentUser?.id) {
      setGlobalToast({ message, type: 'info' });
      const newNotif: Notification = {
        id: Math.random().toString(36).substr(2, 9),
        userId,
        message,
        read: false,
        timestamp: new Date().toISOString()
      };
      setNotifications(prev => [newNotif, ...prev]);
    }

    // Persist to database
    try {
      await DatabaseService.createNotification(userId, message);
    } catch (error) {
      console.error('📤 [Notifications] Error saving notification:', error);
    }
  };

  const handleUpdateEvent = async (updatedEvent: Event) => {
    try {
      const oldEvent = events.find(e => e.id === updatedEvent.id);

      // 1. Update the main event record
      await DatabaseService.updateEvent(updatedEvent.id, updatedEvent);

      // 2. Sync academies (Junction Table)
      if (oldEvent) {
        const added = updatedEvent.academiesIds.filter(id => !oldEvent.academiesIds.includes(id));
        const removed = oldEvent.academiesIds.filter(id => !updatedEvent.academiesIds.includes(id));

        // Execute junction updates
        for (const id of added) await DatabaseService.addEventAcademy(updatedEvent.id, id);
        for (const id of removed) await DatabaseService.removeEventAcademy(updatedEvent.id, id);
      }

      // 3. Update local state
      setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));

      // 4. Notifications (Legacy Logic adapted)
      if (oldEvent && oldEvent.salespersonId !== updatedEvent.salespersonId) {
        if (updatedEvent.salespersonId) {
          notifyUser(updatedEvent.salespersonId, `Você é o novo responsável pelo evento "${updatedEvent.name}".`);
        }
        if (oldEvent.salespersonId) {
          notifyUser(oldEvent.salespersonId, `Você não é mais o responsável pelo evento "${oldEvent.name}".`);
        }
      }

      if (oldEvent && updatedEvent.salespersonId) {
        const added = updatedEvent.academiesIds.filter(id => !oldEvent.academiesIds.includes(id));
        if (added.length > 0) {
          notifyUser(updatedEvent.salespersonId, `${added.length} novas academias atribuídas ao evento "${updatedEvent.name}".`);
        }

        // Notificar se detalhes básicos mudaram
        if (oldEvent.name !== updatedEvent.name || oldEvent.city !== updatedEvent.city || oldEvent.state !== updatedEvent.state) {
          notifyUser(updatedEvent.salespersonId, `As informações do evento "${updatedEvent.name}" foram atualizadas.`);
        }
      }

      setGlobalToast({ message: "Evento atualizado com sucesso!", type: 'success' });

    } catch (error) {
      console.error("Error updating event:", error);
      alert("Erro ao atualizar evento.");
    }
  };

  // Se o hash contiver public-voucher, renderiza a tela pública
  if (hash.startsWith('#/public-voucher/')) {
    const rawHash = hash.replace('#/public-voucher/', '');
    // Tenta dividir por pipe literal, ou pipe encoded (%7C) se o browser/scanner codificou
    let voucherData = rawHash.split('|');
    if (voucherData.length < 3 && rawHash.includes('%7C')) {
      voucherData = rawHash.split('%7C');
    }
    const academyName = decodeURIComponent(voucherData[0] || '');
    const codesStr = decodeURIComponent(voucherData[1] || '');
    const timestamp = parseInt(voucherData[2] || '0');

    return (
      <PublicVoucherLanding
        academyName={academyName}
        codes={codesStr.split(',')}
        createdAt={timestamp}
      />
    );
  }


  // Se não estiver logado, exibe a tela de Auth
  if (!currentUser) {
    return <CustomAuth onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-neutral-900 font-sans text-neutral-100 overflow-hidden">
      {/* Sidebar - Only for Admin */}
      {
        currentUser.role === UserRole.ADMIN && (
          <Sidebar
            currentUser={currentUser}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            logout={logout}
          />
        )
      }

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col h-screen overflow-hidden ${currentUser.role === UserRole.SALES ? 'pb-16' : ''}`}> {/* Add padding bottom for mobile nav */}

        {/* Navbar - Only for Admin (Salesperson uses simplified header or just content) */}
        {currentUser.role === UserRole.ADMIN ? (
          <Navbar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            activeTab={activeTab}
          />
        ) : (
          /* Salesperson Header */
          <header className="bg-neutral-900 border-b border-neutral-800 p-4 shrink-0 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src="/oss_logo.jpg" alt="Logo" className="w-8 h-8 object-contain mix-blend-screen filter invert hue-rotate-180 brightness-110 contrast-125 saturate-150" />
              <h1 className="text-lg font-bold text-white tracking-tight">BJJVisits</h1>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">{currentUser.name}</p>
            </div>
          </header>
        )}

        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 print:p-0 relative">
          {/* Real-time Toast System (Success/Info/Error for the actor) */}
          {globalToast && (
            <div className="fixed top-20 right-4 left-4 md:left-auto md:w-96 z-[200] animate-in slide-in-from-top-4 duration-500">
              <div className={cn(
                "p-4 rounded-[1.5rem] shadow-2xl border backdrop-blur-xl flex items-center space-x-3",
                globalToast.type === 'success' ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" :
                  globalToast.type === 'error' ? "bg-red-500/20 border-red-500/30 text-red-400" :
                    "bg-[hsl(262,83%,58%)]/20 border-[hsl(262,83%,58%)]/30 text-white"
              )}>
                <div className={cn(
                  "p-2 rounded-xl",
                  globalToast.type === 'success' ? "bg-emerald-500/20" :
                    globalToast.type === 'error' ? "bg-red-500/20" :
                      "bg-white/10"
                )}>
                  {globalToast.type === 'success' ? <CheckCircle2 size={18} /> :
                    globalToast.type === 'error' ? <AlertCircle size={18} /> :
                      <Bell size={18} />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black leading-tight">{globalToast.message}</p>
                </div>
                <button onClick={() => setGlobalToast(null)} className="text-white/40 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Incoming Notifications Alert Feed (Messages from other users) */}
          {notifications.filter(n => n.userId === currentUser.id && !n.read).length > 0 && (
            <div className="mb-8 space-y-3 max-w-2xl">
              <div className="flex items-center space-x-2 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4 ml-2">
                <TrendingUp size={12} />
                <span>Alertas do Sistema</span>
              </div>
              {notifications.filter(n => n.userId === currentUser.id && !n.read).map((n) => (
                <div key={n.id} className="group relative overflow-hidden bg-gradient-to-r from-neutral-800 to-neutral-800/50 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-4 flex justify-between items-center shadow-xl animate-in slide-in-from-left-4 duration-500 hover:border-white/20 transition-all">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                  <div className="flex items-center space-x-4 relative z-10">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-purple-400 border border-white/5 group-hover:scale-110 transition-transform">
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
          )}

          {activeTab === 'dashboard' && currentUser.role === UserRole.ADMIN && <AdminDashboard events={events} academies={academies} visits={visits} vouchers={vouchers} finance={finance} vendedores={sellers} />}
          {activeTab === 'access_control' && currentUser.role === UserRole.ADMIN && (
            <UsersManager
              users={[...sellers, ...admins]}
              setUsers={(newUsersOrUpdater: any) => {
                if (typeof newUsersOrUpdater === 'function') {
                  fetchUsers();
                } else {
                  setSellers(newUsersOrUpdater.filter((u: User) => u.role === UserRole.SALES));
                  setAdmins(newUsersOrUpdater.filter((u: User) => u.role === UserRole.ADMIN));
                }
              }}
              currentUser={currentUser}
              notifyUser={notifyUser}
            />
          )}
          {activeTab === 'academies' && currentUser.role === UserRole.ADMIN && <AcademiesManager academies={academies} setAcademies={setAcademies} currentUser={currentUser} notifyUser={notifyUser} events={events} />}
          {activeTab === 'events' && currentUser.role === UserRole.ADMIN && <EventsManager events={events} visits={visits} setEvents={setEvents} academies={academies} vendedores={sellers} onSelectEvent={(id) => { setSelectedEventId(id); setActiveTab('event_detail_admin'); }} notifyUser={notifyUser} />}
          {activeTab === 'event_detail_admin' && selectedEventId && currentUser.role === UserRole.ADMIN && (
            <EventDetailAdmin
              event={events.find(e => e.id === selectedEventId)!}
              academies={academies}
              visits={visits}
              vendedores={sellers}
              onBack={() => setActiveTab('events')}
              onUpdateEvent={handleUpdateEvent}
              notifyUser={notifyUser}
            />
          )}
          {activeTab === 'admin_finance' && currentUser.role === UserRole.ADMIN && (
            <AdminFinance
              finance={finance}
              setFinance={setFinance}
              events={events}
              vendedores={sellers}
              notifyUser={notifyUser}
            />
          )}
          {activeTab === 'reports' && currentUser.role === UserRole.ADMIN && <Reports visits={visits} academies={academies} events={events} vouchers={vouchers} vendedores={sellers} />}

          {activeTab === 'my_events' && <SalespersonEvents events={events.filter(e => e.salespersonId === currentUser.id)} academies={academies} visits={visits} notifications={notifications.filter(n => n.userId === currentUser.id && !n.read)} onDismissNotif={(id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))} onSelectAcademy={(eventId, academyId) => { setSelectedEventId(eventId); setSelectedAcademyId(academyId); setActiveTab('visit_detail'); }} />}
          {activeTab === 'visit_detail' && selectedEventId && selectedAcademyId && (
            <VisitDetail eventId={selectedEventId} academy={academies.find(a => a.id === selectedAcademyId)!} event={events.find(e => e.id === selectedEventId)!} existingVisit={visits.find(v => v.eventId === selectedEventId && v.academyId === selectedAcademyId)} onFinish={async (visit) => {
              try {
                // Save Visit
                const savedVisit = await DatabaseService.upsertVisit(visit);
                setVisits(prev => [...prev.filter(v => !(v.eventId === visit.eventId && v.academyId === visit.academyId)), savedVisit]);

                // Save Vouchers
                const currentVoucherCodes = new Set(vouchers.map(v => v.code));
                const newVoucherObjects: Voucher[] = (visit.vouchersGenerated || [])
                  .filter(code => !currentVoucherCodes.has(code))
                  .map(code => ({
                    code,
                    eventId: visit.eventId,
                    academyId: visit.academyId,
                    visitId: savedVisit.id,
                    createdAt: new Date().toISOString()
                  }));

                if (newVoucherObjects.length > 0) {
                  await DatabaseService.createVouchers(newVoucherObjects);
                  setVouchers(prev => [...prev, ...newVoucherObjects]);
                }

                // Notify Admins (Only if completely new visit or status changed to VISITED first time)
                // Simplified: notify every time for now or check if it was already visited?
                // Defaulting to keeping existing notification logic but safe from errors
                admins.forEach(admin => {
                  notifyUser(admin.id, `O vendedor ${currentUser.name} concluiu uma visita na academia "${academies.find(a => a.id === selectedAcademyId)?.name}".`);
                });

                setActiveTab('my_events');
              } catch (error) {
                console.error("Error saving visit:", error);
                alert("Erro ao salvar visita.");
              }
            }}
              onCancel={() => setActiveTab('my_events')}
            />
          )}
          {activeTab === 'sales_finance' && (
            <SalesFinance
              finance={finance.filter(f => f.salespersonId === currentUser.id)}
              events={events}
              onConfirm={async (recordId) => {
                const record = finance.find(f => f.id === recordId);
                if (record) {
                  try {
                    const updated = await DatabaseService.updateFinance(record.id, { ...record, status: FinanceStatus.RECEIVED, updatedAt: new Date().toISOString() });
                    setFinance(prev => prev.map(f => f.id === recordId ? updated : f));

                    // Notificar admins que o vendedor recebeu o dinheiro
                    const eventName = events.find(e => e.id === record.eventId)?.name;
                    admins.forEach(admin => {
                      notifyUser(admin.id, `O vendedor ${currentUser?.name} confirmou o recebimento de $ ${record.amount.toFixed(2)} referente ao evento "${eventName}".`);
                    });
                  } catch (error) {
                    console.error("Error confirming finance:", error);
                  }
                }
              }}
            />
          )}
        </div>
      </main>

      {/* Mobile Bottom Nav - Only for Salesperson */}
      {
        currentUser.role === UserRole.SALES && (
          <MobileBottomNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            logout={logout}
          />
        )
      }
    </div>
  );
};
export default App;
