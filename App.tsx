
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  LayoutDashboard,
  School,
  Calendar,
  Users,
  DollarSign,
  FileText,
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
  Wallet,
  UserCheck,
  QrCode,
  Copy,
  ExternalLink,
  Thermometer
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
  SystemLog,
  Voucher,
  AcademyObservation
} from './types';
import {
  INITIAL_ACADEMIES, // Keeping for fallback if needed, or remove
  INITIAL_EVENTS,
  INITIAL_FINANCE,
  INITIAL_LOGS,
  generateVoucherCode
} from './data';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import CustomAuth from './components/CustomAuth';
import { ProgressBar } from './components/ProgressBar';
import { supabase, DatabaseService, AuthService } from './lib/supabase';
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

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [academies, setAcademies] = useState<Academy[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [finance, setFinance] = useState<FinanceRecord[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [sellers, setSellers] = useState<User[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);

  const [selectedAcademyId, setSelectedAcademyId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    // Check local session
    const storedUser = localStorage.getItem('bjj_user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('bjj_user', JSON.stringify(user));
    setActiveTab(user.role === UserRole.ADMIN ? 'dashboard' : 'my_events');
    addLog('LOGIN', `Usuário ${user.name} entrou (Custom Auth)`);
  };

  // Fetch initial data
  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
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
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      if (data) {
        setCurrentUser({
          id: data.id,
          name: data.name,
          email: '', // Not stored in profiles, but available in auth.user
          role: data.role as UserRole
        });
        setActiveTab(data.role === UserRole.ADMIN ? 'dashboard' : 'my_events');
        addLog('LOGIN', `Usuário ${data.name} acessou o sistema`);
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
    const { data: salesData } = await supabase.from('app_users').select('*').eq('role', UserRole.SALES);
    if (salesData) setSellers(salesData as User[]);

    const { data: adminData } = await supabase.from('app_users').select('*').eq('role', UserRole.ADMIN);
    if (adminData) setAdmins(adminData as User[]);
  };

  useEffect(() => {
    if (currentUser?.role === UserRole.ADMIN) {
      fetchUsers();
    }
  }, [currentUser]);

  const addLog = async (action: string, details: string) => {
    if (!currentUser) return;
    const newLog: SystemLog = {
      id: Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      userName: currentUser.name,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    setLogs(prev => [newLog, ...prev]);

    // Persist to database
    try {
      await DatabaseService.createSystemLog(currentUser.id, currentUser.name, action, details);
    } catch (error) {
      console.error('Error saving log:', error);
    }
  };

  /* Restore notifyUser */
  const notifyUser = async (userId: string, message: string) => {
    const newNotif: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      message,
      read: false,
      timestamp: new Date().toISOString()
    };
    setNotifications(prev => [newNotif, ...prev]);

    // Persist to database
    try {
      await DatabaseService.createNotification(userId, message);
    } catch (error) {
      console.error('Error saving notification:', error);
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
      if (oldEvent && oldEvent.salespersonId !== updatedEvent.salespersonId && updatedEvent.salespersonId) {
        notifyUser(updatedEvent.salespersonId, `Você é o novo responsável pelo evento "${updatedEvent.name}".`);
        addLog('EVENT_SALESPERSON_CHANGED', `Vendedor do evento "${updatedEvent.name}" alterado`);
      }

      if (oldEvent && updatedEvent.salespersonId) {
        const newAcademiesCount = updatedEvent.academiesIds.length - oldEvent.academiesIds.length;
        if (newAcademiesCount > 0) {
          notifyUser(updatedEvent.salespersonId, `${newAcademiesCount} novas academias atribuídas ao evento "${updatedEvent.name}".`);
        }
      }

      addLog('EVENT_UPDATED', `Evento "${updatedEvent.name}" atualizado.`);

    } catch (error) {
      console.error("Error updating event:", error);
      alert("Erro ao atualizar evento.");
    }
  };

  // Se o hash contiver public-voucher, renderiza a tela pública
  if (hash.startsWith('#/public-voucher/')) {
    const voucherData = hash.replace('#/public-voucher/', '').split('|');
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
    <div className="flex min-h-screen bg-slate-900 text-slate-100">
      <Sidebar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        logout={logout}
      />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <Navbar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeTab={activeTab}
        />

        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 print:p-0">
          {/* Global Notifications */}
          {notifications.filter(n => n.userId === currentUser.id && !n.read).length > 0 && (
            <div className="mb-6 space-y-3">
              {notifications.filter(n => n.userId === currentUser.id && !n.read).map((n) => (
                <div key={n.id} className="bg-indigo-600 text-white p-4 rounded-2xl flex justify-between items-center shadow-lg animate-in slide-in-from-top-2 border border-indigo-500">
                  <div className="flex items-center space-x-3">
                    <Bell size={20} />
                    <span className="font-bold text-sm">{n.message}</span>
                  </div>
                  <button onClick={() => {
                    setNotifications(prev => prev.map(notif => notif.id === n.id ? { ...notif, read: true } : notif));
                    DatabaseService.markNotificationAsRead(n.id).catch(err => console.error("Error marking read:", err));
                  }} className="hover:bg-white/20 p-1 rounded-lg">
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'dashboard' && currentUser.role === UserRole.ADMIN && <AdminDashboard events={events} academies={academies} visits={visits} vouchers={vouchers} finance={finance} vendedores={sellers} />}
          {activeTab === 'access_control' && currentUser.role === UserRole.ADMIN && <AccessControlManager addLog={addLog} />}
          {activeTab === 'academies' && currentUser.role === UserRole.ADMIN && <AcademiesManager academies={academies} setAcademies={setAcademies} addLog={addLog} currentUser={currentUser} />}
          {activeTab === 'events' && currentUser.role === UserRole.ADMIN && <EventsManager events={events} visits={visits} setEvents={setEvents} academies={academies} vendedores={sellers} addLog={addLog} onSelectEvent={(id) => { setSelectedEventId(id); setActiveTab('event_detail_admin'); }} notifyUser={notifyUser} />}
          {activeTab === 'event_detail_admin' && selectedEventId && currentUser.role === UserRole.ADMIN && (
            <EventDetailAdmin
              event={events.find(e => e.id === selectedEventId)!}
              academies={academies}
              visits={visits}
              vendedores={sellers}
              onBack={() => setActiveTab('events')}
              onUpdateEvent={handleUpdateEvent}
            />
          )}
          {activeTab === 'admin_finance' && currentUser.role === UserRole.ADMIN && (
            <AdminFinance
              finance={finance}
              setFinance={setFinance}
              events={events}
              vendedores={sellers}
              addLog={addLog}
              notifyUser={notifyUser}
            />
          )}
          {activeTab === 'reports' && currentUser.role === UserRole.ADMIN && <AdminReports visits={visits} academies={academies} events={events} vouchers={vouchers} vendedores={sellers} />}
          {activeTab === 'logs' && currentUser.role === UserRole.ADMIN && <LogsTable logs={logs} />}

          {activeTab === 'my_events' && <SalespersonEvents events={events.filter(e => e.salespersonId === currentUser.id)} academies={academies} visits={visits} notifications={notifications.filter(n => n.userId === currentUser.id && !n.read)} onDismissNotif={(id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))} onSelectAcademy={(eventId, academyId) => { setSelectedEventId(eventId); setSelectedAcademyId(academyId); setActiveTab('visit_detail'); }} />}
          {activeTab === 'visit_detail' && selectedEventId && selectedAcademyId && (
            <VisitDetail eventId={selectedEventId} academy={academies.find(a => a.id === selectedAcademyId)!} event={events.find(e => e.id === selectedEventId)!} existingVisit={visits.find(v => v.eventId === selectedEventId && v.academyId === selectedAcademyId)} onFinish={async (visit) => {
              try {
                // Save Visit
                const savedVisit = await DatabaseService.upsertVisit(visit);
                setVisits(prev => [...prev.filter(v => !(v.eventId === visit.eventId && v.academyId === visit.academyId)), savedVisit]);

                // Save Vouchers
                const newVoucherObjects: Voucher[] = (visit.vouchersGenerated || []).map(code => ({
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

                addLog('VISIT_COMPLETED', `Visita concluída na academia ${academies.find(a => a.id === selectedAcademyId)?.name}`);

                // Notify Admins
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
                    addLog('FINANCE_RECEIVED', `Vendedor confirmou recebimento de R$ ${record.amount.toFixed(2)}`);
                  } catch (error) {
                    console.error("Error confirming finance:", error);
                  }
                }
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
};

// --- COMPONENTE PÚBLICO DE LANDING PAGE DE VOUCHERS ---
const PublicVoucherLanding: React.FC<{ academyName: string, codes: string[], createdAt: number }> = ({ academyName, codes, createdAt }) => {
  const [copied, setCopied] = useState(false);
  const now = Date.now();
  const threeHoursInMs = 3 * 60 * 60 * 1000;
  const isExpired = now - createdAt > threeHoursInMs;

  const contentToCopy = `Thank you for being part of the upcoming PBJJF event! 🥋\n\nYour academy (${academyName}) has received the following vouchers:\n👉 ${codes.join(', ')}\n\nTo redeem, please send a text message to (407) 633-9166 with the academy name and the voucher codes listed above.\n\nWe appreciate the partnership and wish you a great event!`;

  const handleCopy = () => {
    navigator.clipboard.writeText(contentToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isExpired) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-slate-800 p-10 rounded-3xl shadow-xl border border-slate-700 space-y-4">
          <div className="bg-red-900/30 text-red-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto"><Clock size={32} /></div>
          <h1 className="text-2xl font-bold text-white">Link Expirado</h1>
          <p className="text-slate-400 leading-relaxed">Este link de vouchers expirou após 3 horas por razões de segurança. Por favor, solicite um novo código ao representante.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-slate-800 rounded-3xl shadow-2xl border border-slate-700 overflow-hidden">
        <div className="bg-slate-950 p-6 text-center text-white">
          <div className="bg-blue-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"><Ticket size={24} /></div>
          <h1 className="text-xl font-bold">PBJJF Vouchers</h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">{academyName}</p>
        </div>
        <div className="p-8 space-y-8">
          <div className="space-y-4 text-center">
            <h2 className="text-xl font-bold text-white leading-snug">Thank you for being part of the upcoming PBJJF event! 🥋</h2>
            <div className="py-6 px-4 bg-blue-900/30 rounded-2xl border border-blue-800 space-y-2">
              <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">Your Vouchers</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {codes.map((c, i) => (
                  <span key={i} className="bg-slate-900 border border-blue-900/50 px-3 py-1.5 rounded-lg font-mono font-bold text-blue-400 shadow-sm">{c}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700 text-sm text-slate-400 leading-relaxed">
              To redeem, please send a text message to <span className="font-bold text-white">(407) 633-9166</span> with the academy name and the voucher codes listed above.
            </div>
            <p className="text-center text-sm font-medium text-slate-500 italic">We appreciate the partnership and wish you a great event!</p>
          </div>

          <button
            onClick={handleCopy}
            className={`w-full flex items-center justify-center space-x-2 py-4 rounded-2xl font-bold transition-all ${copied ? 'bg-emerald-600 text-white' : 'bg-white text-slate-900 hover:bg-slate-200'}`}
          >
            {copied ? <CheckCircle2 size={20} /> : <Copy size={20} />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Instructions & Codes'}</span>
          </button>
        </div>
        <div className="bg-slate-900 p-4 border-t border-slate-800 text-center">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Expires in 3 hours • Secure BJJVisits Token</p>
        </div>
      </div>
    </div>
  );
};

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

  // Filter Data by Year
  const filteredEvents = useMemo(() => events.filter(e => e.startDate && new Date(e.startDate).getFullYear().toString() === selectedYear), [events, selectedYear]);
  const filteredVisits = useMemo(() => visits.filter(v => v.finishedAt && new Date(v.finishedAt).getFullYear().toString() === selectedYear), [visits, selectedYear]);
  const filteredVouchers = useMemo(() => vouchers.filter(v => new Date(v.createdAt).getFullYear().toString() === selectedYear), [vouchers, selectedYear]);

  // KPIs
  const pendingVisitsCount = visits.filter(v => v.status === VisitStatus.PENDING).length;
  const activeEventsCount = filteredEvents.filter(e => e.status === EventStatus.IN_PROGRESS).length;

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
    const pending = visits.length - visited;
    return [
      { name: 'Realizadas', value: visited, color: '#10b981' },
      { name: 'Pendentes', value: pending, color: '#64748b' }
    ];
  }, [visits, filteredVisits]);

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
      {/* Header & Year Filter */}
      <div className="flex justify-between items-center bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-white">Dashboard</h2>
          <p className="text-slate-400">Visão geral de performance e métricas</p>
        </div>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-white text-sm font-bold rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-600"
        >
          {availableYears.map(yr => (
            <option key={yr} value={yr}>{yr}</option>
          ))}
        </select>
      </div>

      {/* KPI Cards - Removed Revenue Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Eventos Ativos</p>
              <h3 className="text-3xl font-black text-white mt-1">{activeEventsCount}</h3>
            </div>
            <div className="p-3 bg-blue-900/30 text-blue-400 rounded-xl"><Calendar size={24} /></div>
          </div>
          <p className="text-xs text-slate-500">Eventos em andamento agora</p>
        </div>

        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Visitas Realizadas</p>
              <h3 className="text-3xl font-black text-white mt-1">{filteredVisits.length}</h3>
            </div>
            <div className="p-3 bg-indigo-900/30 text-indigo-400 rounded-xl"><CheckCircle2 size={24} /></div>
          </div>
          <p className="text-xs text-slate-500">Total acumulado no ano</p>
        </div>

        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Vouchers Gerados</p>
              <h3 className="text-3xl font-black text-white mt-1">{filteredVouchers.length}</h3>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <div className="p-3 bg-amber-900/30 text-amber-400 rounded-xl"><Ticket size={24} /></div>
              <button
                onClick={() => {
                  const headers = "Código;Data;Academia;Evento;Vendedor\n";
                  const rows = filteredVouchers.map(v => {
                    const visit = visits.find(vis => vis.id === v.visitId);
                    const academy = academies.find(a => a.id === v.academyId)?.name || '';
                    const event = events.find(e => e.id === v.eventId)?.name || '';
                    const seller = vendedores.find(u => u.id === (visit?.salespersonId || event?.salespersonId))?.name || '';
                    return `${v.code};${new Date(v.createdAt).toLocaleDateString()};${academy};${event};${seller}`;
                  }).join('\n');
                  const blob = new Blob(["\uFEFF" + headers + rows], { type: 'text/csv;charset=utf-8;' });
                  const link = document.body.appendChild(document.createElement("a"));
                  link.href = URL.createObjectURL(blob);
                  link.download = `vouchers_dashboard_${selectedYear}.csv`;
                  link.click();
                  document.body.removeChild(link);
                }}
                className="text-[10px] font-bold text-amber-500 hover:text-amber-400 flex items-center space-x-1"
              >
                <Download size={12} />
                <span>Exportar</span>
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-500">Conversão de alunos</p>
        </div>
      </div>

      {/* Charts Row - Removed Revenue Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Visit Status & Temperature */}
        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-sm h-[350px] flex flex-col">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Temperatura das Academias</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={temperatureData} layout="vertical" margin={{ left: 0, right: 40 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={80} stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: '#334155', opacity: 0.2 }} contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontWeight: 'bold' }} />
                <Bar dataKey="value" fill="#ec4899" radius={[0, 8, 8, 0]} barSize={28}>
                  <Label
                    position="right"
                    content={({ value, x, y, width, height }: any) => (
                      <text
                        x={Number(x) + Number(width) + 10}
                        y={Number(y) + Number(height) / 2}
                        fill="#fff"
                        fontSize={18}
                        fontWeight="900"
                        textAnchor="start"
                        dominantBaseline="middle"
                      >
                        {value}
                      </text>
                    )}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-sm h-[350px] flex flex-col">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Progresso de Visitas</h3>
          <div className="flex-1 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={visitStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {visitStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                  <Label
                    position="center"
                    content={({ viewBox }: any) => {
                      const { cx, cy } = viewBox;
                      const total = visitStatusData.reduce((sum, entry) => sum + entry.value, 0);
                      const completed = visitStatusData.find(e => e.name === 'Realizadas')?.value || 0;
                      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
                      return (
                        <g>
                          <text x={cx} y={cy - 10} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize={36} fontWeight="900">
                            {percentage}%
                          </text>
                          <text x={cx} y={cy + 20} textAnchor="middle" dominantBaseline="middle" fill="#94a3b8" fontSize={12} fontWeight="600">
                            Concluídas
                          </text>
                        </g>
                      );
                    }}
                  />
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontWeight: 'bold' }} />
                <Legend verticalAlign="bottom" align="center" layout="horizontal" iconType="circle" wrapperStyle={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Seller Leaderboard (Updated) & Latest Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold text-white mb-4">Top Vendedores</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="pb-3 text-xs font-bold text-slate-500 uppercase">Vendedor</th>
                  <th className="pb-3 text-xs font-bold text-slate-500 uppercase text-right">Visitas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {sellerLeaderboard.map((seller, idx) => (
                  <tr key={idx} className="group hover:bg-slate-700/30 transition-colors">
                    <td className="py-3 text-sm font-bold text-white flex items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 text-[10px] font-black ${idx === 0 ? 'bg-yellow-500 text-yellow-900' : idx === 1 ? 'bg-slate-400 text-slate-900' : idx === 2 ? 'bg-orange-700 text-orange-200' : 'bg-slate-700 text-slate-400'}`}>
                        {idx + 1}
                      </div>
                      {seller.name}
                    </td>
                    <td className="py-3 text-sm text-slate-400 text-right">{seller.visits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold text-white mb-4">Últimos Lançamentos</h3>
          <div className="space-y-4">
            {finance.slice(0, 5).map(f => (
              <div key={f.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="bg-emerald-900/30 text-emerald-500 p-2 rounded-lg"><DollarSign size={16} /></div>
                  <div>
                    <p className="text-sm font-bold text-white">{events.find(e => e.id === f.eventId)?.name}</p>
                    <p className="text-xs text-slate-500">{new Date(f.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-white">${f.amount}</p>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest">{f.status}</span>
                </div>
              </div>
            ))}
            {finance.length === 0 && <p className="text-slate-500 text-center py-4">Nenhum lançamento recente.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

const AcademiesManager: React.FC<{ academies: Academy[], setAcademies: React.Dispatch<React.SetStateAction<Academy[]>>, addLog: (a: string, d: string) => void, currentUser: User }> = ({ academies, setAcademies, addLog, currentUser }) => {
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'view' | 'edit'>('create');
  const [academyForm, setAcademyForm] = useState<Partial<Academy>>({ state: 'SP' });
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openModal = (mode: 'create' | 'view' | 'edit', academy?: Academy) => {
    setModalMode(mode);
    setAcademyForm(academy || { state: 'SP' });
    setShowModal(true);
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(l => l.trim() !== '');

        const dataLines = lines.length > 1 ? lines.slice(1) : lines;

        const newAcademies: Partial<Academy>[] = dataLines.map(line => {
          const [name, address, city, state, responsible, phone] = line.split(/[;,]/).map(s => s.trim());
          return {
            name: name || 'Academia sem nome',
            address: address || '',
            city: city || '',
            state: state || 'SP',
            responsible: responsible || '',
            phone: phone || ''
          };
        });

        if (newAcademies.length === 0) {
          showToast("Nenhum dado encontrado no CSV", "error");
          return;
        }

        const createdAcademies = await DatabaseService.createAcademies(newAcademies);
        setAcademies(prev => [...createdAcademies, ...prev]);
        addLog('ACADEMIES_IMPORTED', `${newAcademies.length} academias importadas via CSV.`);
        showToast(`${newAcademies.length} academias importadas com sucesso!`);
      } catch (error) {
        console.error("Error parsing CSV:", error);
        showToast("Erro ao processar arquivo CSV", "error");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`ATENÇÃO: Deseja realmente excluir a academia "${name}"?`)) {
      try {
        await DatabaseService.deleteAcademy(id);
        setAcademies(prev => prev.filter(i => i.id !== id));
        addLog('ACADEMY_DELETED', `Academia "${name}" excluída`);
        showToast("Academia excluída!", "error");
      } catch (error) {
        console.error("Error deleting academy:", error);
        showToast("Erro ao excluir academia", "error");
      }
    }
  };

  // Get unique cities and states for filters
  const cities = useMemo(() => Array.from(new Set(academies.map(a => a.city).filter(Boolean))).sort(), [academies]);
  const states = useMemo(() => Array.from(new Set(academies.map(a => a.state).filter(Boolean))).sort(), [academies]);

  const filteredAcademies = useMemo(() => {
    return academies.filter(a => {
      const matchesSearch = !searchTerm ||
        (a.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (a.responsible?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (a.phone || '').includes(searchTerm);

      const matchesCity = !cityFilter || a.city === cityFilter;
      const matchesState = !stateFilter || a.state === stateFilter;

      return matchesSearch && matchesCity && matchesState;
    });
  }, [academies, searchTerm, cityFilter, stateFilter]);

  return (
    <div className="space-y-6">
      {toast && <div className="fixed top-20 right-8 z-[200] bg-slate-900 text-white px-6 py-4 rounded-xl shadow-2xl animate-in slide-in-from-right flex items-center space-x-3 border border-slate-700">
        {toast.type === 'success' ? <CheckCircle2 size={20} className="text-emerald-400" /> : <AlertCircle size={20} className="text-red-400" />}
        <span className="font-bold">{toast.message}</span>
      </div>}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white">Gerenciar Academias</h2>
          <p className="text-slate-400">Total de <span className="text-blue-400 font-bold">{academies.length}</span> academias cadastradas.</p>
        </div>
        <div className="flex items-center space-x-3">
          <label className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center space-x-2 hover:bg-emerald-700 transition-colors shadow-lg cursor-pointer">
            <Upload size={20} />
            <span>Importar CSV</span>
            <input type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
          </label>
          <button onClick={() => openModal('create')} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center space-x-2 hover:bg-blue-700 transition-colors shadow-lg">
            <Plus size={20} />
            <span>Nova Academia</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-sm">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Nome, responsável ou tel..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="bg-slate-900 border border-slate-700 rounded-xl text-white px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
        >
          <option value="">Todas as Cidades</option>
          {cities.map(city => <option key={city} value={city}>{city}</option>)}
        </select>
        <select
          className="bg-slate-900 border border-slate-700 rounded-xl text-white px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
        >
          <option value="">Todos os Estados (Região)</option>
          {states.map(state => <option key={state} value={state}>{state}</option>)}
        </select>
        <button
          onClick={() => { setSearchTerm(''); setCityFilter(''); setStateFilter(''); }}
          className="text-slate-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider"
        >
          Limpar Filtros
        </button>
      </div>

      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-900 border-b border-slate-700">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Academia</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Responsável</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {filteredAcademies.length > 0 ? filteredAcademies.map(a => (
              <tr key={a.id} className="hover:bg-slate-700/50">
                <td className="px-6 py-4">
                  <div className="font-bold text-white">{a.name}</div>
                  <div className="text-xs text-slate-400 leading-relaxed font-medium flex items-center">
                    <MapPin size={12} className="mr-1 text-slate-500" />
                    {a.city} - {a.state}
                  </div>
                  {a.phone && <div className="text-[10px] text-blue-400/70 mt-0.5">{a.phone}</div>}
                </td>
                <td className="px-6 py-4 text-sm text-slate-300 font-medium">{a.responsible || '---'}</td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => openModal('view', a)} className="p-2 text-blue-400 hover:bg-blue-900/40 rounded-lg transition-colors"><Eye size={18} /></button>
                  <button onClick={() => openModal('edit', a)} className="p-2 text-amber-400 hover:bg-amber-900/40 rounded-lg transition-colors"><Edit3 size={18} /></button>
                  <button onClick={() => handleDelete(a.id, a.name)} className="p-2 text-red-400 hover:bg-red-900/40 rounded-lg transition-colors"><Trash2 size={18} /></button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-slate-500 italic">Nenhuma academia encontrada com os filtros aplicados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col border border-slate-700">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">{modalMode === 'create' ? 'Nova Academia' : modalMode === 'edit' ? 'Editar Academia' : 'Detalhes'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X size={24} /></button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="space-y-4">
                <input type="text" placeholder="Nome da Academia" className="w-full border border-slate-600 bg-slate-700 text-white p-3 rounded-xl placeholder:text-slate-400 focus:border-blue-500 outline-none" value={academyForm.name || ''} onChange={e => setAcademyForm({ ...academyForm, name: e.target.value })} />
                <input type="text" placeholder="Endereço" className="w-full border border-slate-600 bg-slate-700 text-white p-3 rounded-xl placeholder:text-slate-400 focus:border-blue-500 outline-none" value={academyForm.address || ''} onChange={e => setAcademyForm({ ...academyForm, address: e.target.value })} />
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="Cidade" className="w-full border border-slate-600 bg-slate-700 text-white p-3 rounded-xl placeholder:text-slate-400 focus:border-blue-500 outline-none" value={academyForm.city || ''} onChange={e => setAcademyForm({ ...academyForm, city: e.target.value })} />
                  <input type="text" placeholder="SP" maxLength={2} className="w-full border border-slate-600 bg-slate-700 text-white p-3 rounded-xl placeholder:text-slate-400 focus:border-blue-500 outline-none" value={academyForm.state || ''} onChange={e => setAcademyForm({ ...academyForm, state: e.target.value.toUpperCase() })} />
                </div>
                <input type="text" placeholder="Responsável" className="w-full border border-slate-600 bg-slate-700 text-white p-3 rounded-xl placeholder:text-slate-400 focus:border-blue-500 outline-none" value={academyForm.responsible || ''} onChange={e => setAcademyForm({ ...academyForm, responsible: e.target.value })} />
                <input type="tel" placeholder="Telefone" className="w-full border border-slate-600 bg-slate-700 text-white p-3 rounded-xl placeholder:text-slate-400 focus:border-blue-500 outline-none" value={academyForm.phone || ''} onChange={e => setAcademyForm({ ...academyForm, phone: e.target.value })} />
                {modalMode !== 'view' && (
                  <button onClick={async () => {
                    try {
                      if (academyForm.id) {
                        const updated = await DatabaseService.updateAcademy(academyForm.id, academyForm);
                        setAcademies(prev => prev.map(item => item.id === updated.id ? updated : item));
                        showToast("Academia atualizada!");
                      } else {
                        const created = await DatabaseService.createAcademy(academyForm);
                        setAcademies(prev => [created, ...prev]);
                        showToast("Academia criada com sucesso!");
                      }
                      setShowModal(false);
                    } catch (error) {
                      console.error("Error saving academy:", error);
                      showToast("Erro ao salvar academia", "error");
                    }
                  }} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-colors">Salvar Academia</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const EventsManager: React.FC<{ events: Event[], visits: Visit[], setEvents: any, academies: Academy[], vendedores: User[], addLog: any, onSelectEvent: any, notifyUser: (uid: string, msg: string) => void }> = ({ events, visits, setEvents, academies, vendedores, addLog, onSelectEvent, notifyUser }) => {
  const [showModal, setShowModal] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    status: EventStatus.UPCOMING,
    academiesIds: [],
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.name || !newEvent.city || !newEvent.state || !newEvent.startDate || !newEvent.endDate) {
      alert("Preencha todos os campos obrigatórios (Nome, Cidade, UF e Datas)");
      return;
    }

    try {
      const created = await DatabaseService.createEvent(newEvent);
      setEvents((prev: Event[]) => [created, ...prev]);

      if (created.salespersonId) notifyUser(created.salespersonId, `Você foi atribuído ao novo evento "${created.name}".`);
      addLog('EVENT_CREATED', `Evento "${created.name}" criado`);
      setShowModal(false);
      setNewEvent({
        status: EventStatus.UPCOMING,
        academiesIds: [],
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      });
    } catch (error: any) {
      console.error("Error creating event:", error);
      alert(`Erro ao criar evento: ${error.message || JSON.stringify(error)}`);
    }
  };

  const handleDeleteEvent = async (e: React.MouseEvent, eventId: string, eventName: string) => {
    e.stopPropagation();
    if (window.confirm(`ATENÇÃO: Deseja realmente excluir o evento "${eventName}"?`)) {
      try {
        await DatabaseService.deleteEvent(eventId);
        setEvents((prev: Event[]) => prev.filter(ev => ev.id !== eventId));
        addLog('EVENT_DELETED', `Evento "${eventName}" excluído`);
        alert("Evento excluído!");
      } catch (error) {
        console.error("Error deleting event:", error);
        alert("Erro ao excluir evento");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-slate-400">Gestão de eventos e distribuição de vendedores.</p>
        <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center space-x-2 shadow-lg hover:bg-blue-700 transition-colors">
          <Plus size={20} /><span>Novo Evento</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map(e => {
          const totalAcademies = e.academiesIds.length;
          const completedVisits = visits.filter(v => v.eventId === e.id && v.status === VisitStatus.VISITED).length;
          const progress = totalAcademies > 0 ? Math.round((completedVisits / totalAcademies) * 100) : 0;

          const startDate = new Date(e.startDate);
          const endDate = new Date(e.endDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(0, 0, 0, 0);

          const isExpired = today > endDate;
          const isOngoing = today >= startDate && today <= endDate;
          const diffDays = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          return (
            <div key={e.id} onClick={() => onSelectEvent(e.id)} className="bg-slate-800 p-6 rounded-2xl border border-slate-700 cursor-pointer hover:border-blue-500 transition-all group shadow-sm relative overflow-hidden flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${isExpired ? 'bg-slate-700 text-slate-400' : isOngoing ? 'bg-emerald-900/50 text-emerald-400' : 'bg-blue-900/50 text-blue-400'}`}>
                  {isExpired ? 'Encerrado' : isOngoing ? 'Em Andamento' : e.status}
                </span>
                <button onClick={(ev) => handleDeleteEvent(ev, e.id, e.name)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-900/30 rounded-lg"><Trash2 size={16} /></button>
              </div>

              <div className="flex-1">
                <h4 className="text-xl font-bold text-white">{e.name}</h4>
                <p className="text-sm text-slate-400 mb-2">{e.city} - {e.state}</p>

                <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-500 uppercase mb-4">
                  <Calendar size={12} className="text-blue-500" />
                  <span>
                    {e.startDate === e.endDate
                      ? new Date(e.startDate).toLocaleDateString('pt-BR')
                      : `${new Date(e.startDate).toLocaleDateString('pt-BR')} - ${new Date(e.endDate).toLocaleDateString('pt-BR')}`
                    }
                  </span>
                  <span>•</span>
                  <span className={isExpired ? 'text-slate-600' : isOngoing ? 'text-emerald-500' : 'text-blue-400'}>
                    {isExpired ? 'Encerrado' : isOngoing ? 'Acontecendo Agora' : diffDays === 1 ? 'Falta 1 dia' : `Faltam ${diffDays} dias`}
                  </span>
                </div>
              </div>

              <div className="space-y-2 mt-auto">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{totalAcademies} Academias</span>
                  <span className="text-xs font-black text-blue-400">{progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col border border-slate-700">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Novo Evento</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X size={24} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <input type="text" placeholder="Nome do Evento" className="w-full border border-slate-600 bg-slate-700 text-white p-3 rounded-xl placeholder:text-slate-400 focus:border-blue-500 outline-none" onChange={e => setNewEvent({ ...newEvent, name: e.target.value })} />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">Cidade</label>
                  <input type="text" placeholder="Ex: Orlando" className="w-full border border-slate-600 bg-slate-700 text-white p-3 rounded-xl placeholder:text-slate-400 focus:border-blue-500 outline-none" onChange={e => setNewEvent({ ...newEvent, city: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">UF</label>
                  <input type="text" placeholder="Ex: FL" maxLength={2} className="w-full border border-slate-600 bg-slate-700 text-white p-3 rounded-xl placeholder:text-slate-400 focus:border-blue-500 outline-none" onChange={e => setNewEvent({ ...newEvent, state: e.target.value.toUpperCase() })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">Data Início</label>
                  <input type="date" className="w-full border border-slate-600 bg-slate-700 text-white p-3 rounded-xl focus:border-blue-500 outline-none" value={newEvent.startDate} onChange={e => setNewEvent({ ...newEvent, startDate: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">Data Fim</label>
                  <input type="date" className="w-full border border-slate-600 bg-slate-700 text-white p-3 rounded-xl focus:border-blue-500 outline-none" value={newEvent.endDate} onChange={e => setNewEvent({ ...newEvent, endDate: e.target.value })} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">Vendedor Responsável (Opcional)</label>
                <select className="w-full border border-slate-600 text-white p-3 rounded-xl bg-slate-700 focus:border-blue-500 outline-none" onChange={e => setNewEvent({ ...newEvent, salespersonId: e.target.value || undefined })}>
                  <option value="">Vincular depois...</option>
                  {vendedores.map(v => <option key={v.id} value={v.id} className="bg-slate-800">{v.name}</option>)}
                </select>
              </div>

              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-colors mt-4">Criar Evento</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const EventDetailAdmin: React.FC<{ event: Event, academies: Academy[], visits: Visit[], vendedores: User[], onBack: any, onUpdateEvent: any }> = ({ event, academies, visits, vendedores, onBack, onUpdateEvent }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Event>>({ ...event });

  const eventAcademies = academies.filter(a => event.academiesIds.includes(a.id));

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
    onUpdateEvent({ ...event, salespersonId: newSalespersonId || undefined });
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
        <button onClick={onBack} className="flex items-center text-blue-500 font-bold hover:underline transition-all hover:text-blue-400">
          <ChevronLeft size={20} className="mr-1" /> Voltar para Eventos
        </button>
        {!isEditing && (
          <button
            onClick={() => { setEditForm({ ...event }); setIsEditing(true); }}
            className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all"
          >
            <Edit3 size={16} />
            <span>Editar Informações</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-sm">
            {isEditing ? (
              <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Nome do Evento</label>
                  <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-white outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Cidade</label>
                  <input type="text" value={editForm.city} onChange={e => setEditForm({ ...editForm, city: e.target.value })} className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-white outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">UF</label>
                  <input type="text" maxLength={2} value={editForm.state} onChange={e => setEditForm({ ...editForm, state: e.target.value.toUpperCase() })} className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-white outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Data Início</label>
                  <input type="date" value={editForm.startDate} onChange={e => setEditForm({ ...editForm, startDate: e.target.value })} className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-white outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Data Fim</label>
                  <input type="date" value={editForm.endDate} onChange={e => setEditForm({ ...editForm, endDate: e.target.value })} className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-white outline-none focus:border-blue-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Status</label>
                  <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value as EventStatus })} className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-white outline-none focus:border-blue-500">
                    {Object.values(EventStatus).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2 flex space-x-3 pt-4">
                  <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-all">Salvar Alterações</button>
                  <button type="button" onClick={() => setIsEditing(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-bold transition-all">Cancelar</button>
                </div>
              </form>
            ) : (
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 bg-blue-900/50 px-2 py-1 rounded-full">{event.status}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center">
                      <Calendar size={12} className="mr-1" />
                      {event.startDate === event.endDate
                        ? new Date(event.startDate).toLocaleDateString('pt-BR')
                        : `${new Date(event.startDate).toLocaleDateString('pt-BR')} - ${new Date(event.endDate).toLocaleDateString('pt-BR')}`
                      }
                    </span>
                  </div>
                  <h3 className="text-3xl font-black text-white mt-2">{event.name}</h3>
                  <p className="text-slate-400 flex items-center font-medium mt-1">
                    <MapPin size={16} className="mr-1 text-slate-500" />
                    {event.city} - {event.state}
                  </p>
                </div>
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Academias</p>
                  <p className="text-2xl font-black text-white tabular-nums">{event.academiesIds.length}</p>
                </div>
              </div>
            )}

            <div className="border-t border-slate-700 pt-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Academias Vinculadas</h4>
                <button
                  onClick={() => { setSelectedIds([]); setShowAddModal(true); }}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg flex items-center transition-all shadow-lg active:scale-95"
                >
                  <Plus size={14} className="mr-1.5" /> Adicionar Academia
                </button>
              </div>
              <div className="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden">
                <div className="divide-y divide-slate-800">
                  {eventAcademies.map(a => {
                    const visit = visits.find(v => v.academyId === a.id && v.eventId === event.id);
                    return (
                      <div
                        key={a.id}
                        onClick={() => visit && setSelectedVisit(visit)}
                        className={`p-4 flex justify-between items-center bg-slate-800 hover:bg-slate-700 transition-colors ${visit ? 'cursor-pointer' : ''}`}
                      >
                        <div>
                          <p className="font-bold text-white text-sm">{a.name}</p>
                          <p className="text-[10px] text-slate-400">{a.city} - Resp: {a.responsible}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          {visit ? (
                            <div className="flex items-center space-x-2">
                              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${visit.temperature === AcademyTemperature.HOT ? 'bg-red-900/30 text-red-400' : 'bg-blue-900/30 text-blue-400'}`}>{visit.temperature}</span>
                              <span className="bg-emerald-900/30 text-emerald-400 p-1 rounded-full"><CheckCircle2 size={14} /></span>
                            </div>
                          ) : (
                            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Pendente</span>
                          )}
                          <button
                            onClick={() => handleRemoveAcademy(a.id)}
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                            title="Remover Vinculo"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-sm space-y-6">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center">
                <UserCheck size={16} className="mr-2 text-blue-500" />
                Vendedor Responsável
              </h4>
              <p className="text-[10px] text-slate-400 mb-3 italic">Defina quem executará as visitas</p>

              <select
                value={event.salespersonId || ''}
                onChange={(e) => handleSalespersonChange(e.target.value)}
                className="w-full border border-slate-600 p-3 rounded-xl bg-slate-900 focus:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-white"
              >
                <option value="">Nenhum Atribuído</option>
                {vendedores.map(v => (
                  <option key={v.id} value={v.id} className="bg-slate-800">{v.name}</option>
                ))}
              </select>

              <div className="mt-4 p-3 bg-blue-900/30 border border-blue-800/50 rounded-xl">
                <div className="flex items-start space-x-2">
                  <Info size={14} className="text-blue-400 mt-0.5" />
                  <p className="text-[10px] text-blue-300 leading-relaxed font-medium">
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
          <div className="bg-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col h-[85vh]">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
              <div>
                <h3 className="text-xl font-bold text-white">Vincular Academias</h3>
                <p className="text-xs text-slate-400 mt-1 flex items-center">
                  <Info size={12} className="mr-1" /> Selecione as academias e clique em Vincular Selecionadas.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Filters */}
            <div className="p-4 bg-slate-900/40 border-b border-slate-700 space-y-3">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="Buscar por nome, responsável ou telefone..."
                  className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select
                  className="bg-slate-900 border border-slate-700 rounded-xl text-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/50 text-xs font-semibold"
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                >
                  <option value="">Cidades</option>
                  {modalCities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select
                  className="bg-slate-900 border border-slate-700 rounded-xl text-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/50 text-xs font-semibold"
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                >
                  <option value="">Estados</option>
                  {modalStates.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-900/20">
              {availableAcademies.length > 0 ? (
                availableAcademies.map(a => {
                  const isSelected = selectedIds.includes(a.id);
                  return (
                    <button
                      key={a.id}
                      onClick={() => toggleSelection(a.id)}
                      className={`w-full p-4 flex items-center bg-slate-800/50 border transition-all rounded-2xl group text-left ${isSelected ? 'border-blue-500 bg-blue-900/20 ring-1 ring-blue-500' : 'border-slate-700 hover:border-slate-500'
                        }`}
                    >
                      <div className={`w-6 h-6 rounded-lg mr-4 flex items-center justify-center transition-all ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-900 border border-slate-600 text-transparent'
                        }`}>
                        <CheckCircle2 size={16} />
                      </div>
                      <div className="flex-1">
                        <p className={`font-bold transition-colors ${isSelected ? 'text-blue-400' : 'text-white'}`}>{a.name}</p>
                        <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                          <span className="bg-slate-900 px-1.5 py-0.5 rounded text-slate-300 font-bold uppercase">{a.state}</span>
                          <span>{a.city}</span>
                          {a.responsible && <span>• Resp: {a.responsible}</span>}
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="py-20 text-center space-y-4">
                  <div className="bg-slate-900/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-slate-700 text-opacity-30">
                    <School size={32} />
                  </div>
                  <p className="text-slate-500 font-medium">Nenhuma academia disponível com estes critérios.</p>
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-800/80 border-t border-slate-700 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {selectedIds.length} selecionada{selectedIds.length !== 1 ? 's' : ''}
              </span>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  disabled={selectedIds.length === 0}
                  onClick={handleBulkLink}
                  className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg ${selectedIds.length > 0
                    ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed text-opacity-50'
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
          <div className="bg-slate-800 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-700 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900/30">
              <div>
                <h3 className="text-xl font-bold text-white">Detalhes da Visita</h3>
                <p className="text-xs text-slate-400 mt-1">
                  {academies.find(a => a.id === selectedVisit.academyId)?.name}
                </p>
              </div>
              <button
                onClick={() => setSelectedVisit(null)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Status</p>
                  <span className="text-sm font-bold text-emerald-400 flex items-center">
                    <CheckCircle2 size={14} className="mr-1.5" /> {selectedVisit.status}
                  </span>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Temperatura</p>
                  <span className={`text-sm font-bold flex items-center ${selectedVisit.temperature === AcademyTemperature.HOT ? 'text-red-400' : 'text-blue-400'}`}>
                    <Thermometer size={14} className="mr-1.5" /> {selectedVisit.temperature}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase ml-1">Observações do Vendedor</p>
                <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50 text-sm text-slate-300 leading-relaxed italic">
                  {selectedVisit.notes || 'Nenhuma observação registrada.'}
                </div>
              </div>

              {selectedVisit.vouchersGenerated && selectedVisit.vouchersGenerated.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase ml-1">Vouchers Gerados ({selectedVisit.vouchersGenerated.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedVisit.vouchersGenerated.map(code => (
                      <span key={code} className="bg-blue-900/30 text-blue-400 px-3 py-1.5 rounded-lg border border-blue-800/50 font-mono font-bold text-xs uppercase shadow-sm">
                        {code}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-700 flex justify-between items-center">
                <div className="text-[10px] text-slate-500 font-medium">
                  <p>Início: {selectedVisit.startedAt ? new Date(selectedVisit.startedAt).toLocaleString('pt-BR') : '---'}</p>
                  <p>Fim: {selectedVisit.finishedAt ? new Date(selectedVisit.finishedAt).toLocaleString('pt-BR') : '---'}</p>
                </div>
                <button
                  onClick={() => setSelectedVisit(null)}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-xl font-bold transition-colors"
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

const AdminFinance: React.FC<{ finance: FinanceRecord[], setFinance: any, events: Event[], vendedores: User[], addLog: any, notifyUser: any }> = ({ finance, setFinance, events, vendedores, addLog, notifyUser }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<FinanceRecord | null>(null);
  const [formRecord, setFormRecord] = useState<Partial<FinanceRecord>>({ status: FinanceStatus.PENDING });

  const handleLaunchOrEdit = async () => {
    if (!formRecord.eventId || !formRecord.salespersonId || !formRecord.amount) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

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
        addLog('FINANCE_EDITED', `Lançamento ID ${updated.id} atualizado.`);
      } else {
        const payload: Partial<FinanceRecord> = {
          eventId: formRecord.eventId!,
          salespersonId: formRecord.salespersonId!,
          amount: Number(formRecord.amount),
          status: FinanceStatus.PENDING,
          updatedAt: new Date().toISOString()
        };
        const created = await DatabaseService.createFinance(payload);
        const createdView = { ...created, eventId: created.event_id, salespersonId: created.salesperson_id, updatedAt: created.updated_at };
        setFinance((prev: FinanceRecord[]) => [created, ...prev]);

        const eventName = events.find(e => e.id === payload.eventId)?.name;
        notifyUser(payload.salespersonId!, `Novo lançamento financeiro no valor de $ ${payload.amount?.toFixed(2)} referente ao evento "${eventName}".`);
        addLog('FINANCE_CREATED', `Lançamento de $ ${payload.amount?.toFixed(2)} criado para ${vendedores.find(v => v.id === payload.salespersonId)?.name}.`);
      }

      setShowModal(false);
      setSelectedRecord(null);
    } catch (error) {
      console.error("Error saving finance record:", error);
      alert("Erro ao salvar lançamento financeiro.");
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
        <p className="text-slate-400">Controle de comissões.</p>
        <button onClick={() => setShowModal(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center space-x-2 shadow-lg hover:bg-emerald-700 transition-colors">
          <Plus size={20} />
          <span>Lançar Pagamento</span>
        </button>
      </div>

      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-900 border-b border-slate-700">
            <tr>
              <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Evento</th>
              <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Vendedor</th>
              <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Valor</th>
              <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Status</th>
              <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {finance.map(f => (
              <tr key={f.id} onClick={() => { setSelectedRecord(f); setFormRecord({ ...f }); setShowModal(true); }} className="text-sm hover:bg-slate-700/50 cursor-pointer">
                <td className="px-6 py-4 font-bold text-white">{events.find(e => e.id === f.eventId)?.name}</td>
                <td className="px-6 py-4 text-slate-300">{vendedores.find(v => v.id === f.salespersonId)?.name}</td>
                <td className="px-6 py-4 font-black text-white tabular-nums text-lg">$ {f.amount.toFixed(2)}</td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${f.status === FinanceStatus.PENDING ? 'bg-amber-900/30 text-amber-400' :
                    f.status === FinanceStatus.PAID ? 'bg-blue-900/30 text-blue-400' : 'bg-emerald-900/30 text-emerald-400'
                    }`}>
                    {f.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {f.status === FinanceStatus.PENDING && (
                    <button onClick={(e) => handleMarkAsPaid(e, f)} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-blue-700 transition-colors">Marcar Pago</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-slate-800 rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 border border-slate-700">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">{selectedRecord ? 'Editar Lançamento' : 'Novo Lançamento'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X size={24} /></button>
            </div>
            <div className="p-6 space-y-4">
              <select className="w-full border border-slate-600 p-3 rounded-xl bg-slate-700 text-white focus:border-blue-500 outline-none" value={formRecord.eventId || ''} onChange={e => setFormRecord({ ...formRecord, eventId: e.target.value })}>
                <option value="">Evento</option>
                {events.map(e => <option key={e.id} value={e.id} className="bg-slate-800">{e.name}</option>)}
              </select>
              <select className="w-full border border-slate-600 p-3 rounded-xl bg-slate-700 text-white focus:border-blue-500 outline-none" value={formRecord.salespersonId || ''} onChange={e => setFormRecord({ ...formRecord, salespersonId: e.target.value })}>
                <option value="">Vendedor</option>
                {vendedores.map(v => <option key={v.id} value={v.id} className="bg-slate-800">{v.name}</option>)}
              </select>
              {/* Fix: Wrap e.target.value in Number() to avoid type mismatch on 'amount' field */}
              <input type="number" step="0.01" className="w-full border border-slate-600 p-3 rounded-xl bg-slate-700 text-white focus:border-blue-500 outline-none placeholder:text-slate-400" placeholder="Valor" value={formRecord.amount || ''} onChange={e => setFormRecord({ ...formRecord, amount: Number(e.target.value) })} />
              <button onClick={handleLaunchOrEdit} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-colors">Salvar Lançamento</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminReports: React.FC<{ visits: Visit[], academies: Academy[], events: Event[], vouchers: Voucher[], vendedores: User[] }> = ({ visits, academies, events, vouchers, vendedores }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [eventFilter, setEventFilter] = useState('');
  const [salesFilter, setSalesFilter] = useState('');

  const years = useMemo(() => Array.from(new Set(vouchers.map(v => new Date(v.createdAt).getFullYear()))).sort((a: number, b: number) => b - a), [vouchers]);

  const filteredVouchers = useMemo(() => {
    return vouchers.filter(v => {
      const visit = visits.find(vis => vis.id === v.visitId);
      const academy = academies.find(a => a.id === v.academyId);
      const event = events.find(e => e.id === v.eventId);

      const salespersonId = visit?.salespersonId || event?.salespersonId;

      const matchesSearch = !searchTerm ||
        (v.code?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (academy?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase());

      const matchesYear = !yearFilter || new Date(v.createdAt).getFullYear().toString() === yearFilter;
      const matchesEvent = !eventFilter || v.eventId === eventFilter;
      const matchesSales = !salesFilter || salespersonId === salesFilter;

      return matchesSearch && matchesYear && matchesEvent && matchesSales;
    });
  }, [vouchers, visits, academies, events, searchTerm, yearFilter, eventFilter, salesFilter]);

  const exportCSV = () => {
    const headers = "Código;Data;Academia;Evento;Vendedor\n";
    const rows = filteredVouchers.map(v => {
      const visit = visits.find(vis => vis.id === v.visitId);
      const academy = academies.find(a => a.id === v.academyId)?.name || '';
      const event = events.find(e => e.id === v.eventId)?.name || '';
      const seller = vendedores.find(u => u.id === (visit?.salespersonId || event?.salespersonId))?.name || '';
      return `${v.code};${new Date(v.createdAt).toLocaleDateString()};${academy};${event};${seller}`;
    }).join('\n');

    const blob = new Blob(["\uFEFF" + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `relatorio_vouchers_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-black text-white">Relatórios e KPIs</h2>
          <p className="text-slate-400">Análise de vouchers gerados e performance.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={exportCSV} className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold flex items-center space-x-2 shadow-lg hover:bg-emerald-700 transition-all">
            <Download size={18} />
            <span>Exportar CSV</span>
          </button>
          <button onClick={() => window.print()} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center space-x-2 shadow-lg hover:bg-blue-700 transition-all">
            <Printer size={18} />
            <span>Imprimir PDF</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-sm print:hidden">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Buscar código ou academia..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="bg-slate-900 border border-slate-700 rounded-xl text-white px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500/50 text-sm font-bold"
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
        >
          <option value="">Todos os Anos</option>
          {years.map(y => <option key={y} value={y.toString()}>{y}</option>)}
        </select>
        <select
          className="bg-slate-900 border border-slate-700 rounded-xl text-white px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500/50 text-sm font-bold"
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
        >
          <option value="">Todos os Eventos</option>
          {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <select
          className="bg-slate-900 border border-slate-700 rounded-xl text-white px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500/50 text-sm font-bold"
          value={salesFilter}
          onChange={(e) => setSalesFilter(e.target.value)}
        >
          <option value="">Todos os Vendedores</option>
          {vendedores.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
      </div>

      <div className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden shadow-2xl relative">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900/30">
          <h3 className="font-black text-white uppercase tracking-widest text-sm flex items-center">
            <Ticket size={18} className="mr-2 text-blue-500" />
            Lista de Vouchers ({filteredVouchers.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-900 border-b border-slate-700 text-slate-400 text-[10px] font-black uppercase tracking-tighter">
              <tr>
                <th className="px-6 py-4">Código</th>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Academia</th>
                <th className="px-6 py-4">Evento</th>
                <th className="px-6 py-4">Vendedor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredVouchers.length > 0 ? filteredVouchers.map(v => {
                const visit = visits.find(vis => vis.id === v.visitId);
                const academy = academies.find(a => a.id === v.academyId);
                const event = events.find(e => e.id === v.eventId);
                const seller = vendedores.find(u => u.id === (visit?.salespersonId || event?.salespersonId));

                return (
                  <tr key={v.code} className="text-xs hover:bg-slate-700/30 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-mono font-black text-blue-400 bg-blue-900/20 px-2 py-1 rounded-lg border border-blue-500/20 group-hover:border-blue-500/50 transition-all">
                        {v.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-medium">
                      {new Date(v.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">{academy?.name || '---'}</div>
                      <div className="text-[10px] text-slate-500">{academy?.city}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-300 font-medium">
                      {event?.name || '---'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2 text-slate-300">
                        <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-blue-400">
                          {seller?.name.charAt(0)}
                        </div>
                        <span className="font-semibold">{seller?.name || 'Sistêmico'}</span>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-500 italic">
                    Nenhum voucher encontrado com os filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const LogsTable: React.FC<{ logs: SystemLog[] }> = ({ logs }) => (
  <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-sm">
    <table className="w-full text-left text-sm">
      <thead className="bg-slate-900 border-b border-slate-700"><tr><th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Hora</th><th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Usuário</th><th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Ação</th></tr></thead>
      <tbody className="divide-y divide-slate-700">{logs.map(log => (<tr key={log.id} className="hover:bg-slate-700/50"><td className="px-6 py-4 text-slate-500 tabular-nums">{new Date(log.timestamp).toLocaleTimeString()}</td><td className="px-6 py-4 font-bold text-white">{log.userName}</td><td className="px-6 py-4 text-xs text-slate-300 font-medium">{log.action}: {log.details}</td></tr>))}</tbody>
    </table>
  </div>
);

const SalespersonEvents: React.FC<{ events: Event[], academies: Academy[], visits: Visit[], notifications: any, onDismissNotif: any, onSelectAcademy: any }> = ({ events, academies, visits, notifications, onDismissNotif, onSelectAcademy }) => {
  // Calculate global progress for the salesperson
  const totalAcademies = events.reduce((acc, e) => acc + e.academiesIds.length, 0);

  // Filter visits that belong to the passed events (which are already filtered by salesperson) AND are visited
  const completedVisitsCount = visits.filter(v =>
    events.some(e => e.id === v.eventId) && v.status === VisitStatus.VISITED
  ).length;

  return (
    <div className="space-y-6">
      <ProgressBar total={totalAcademies} completed={completedVisitsCount} />

      {events.map(e => {
        const allAcademies = e.academiesIds.map(aid => academies.find(a => a.id === aid)).filter(Boolean) as Academy[];
        const completedIds = visits.filter(v => v.eventId === e.id).map(v => v.academyId);
        const pendingAcademies = allAcademies.filter(a => !completedIds.includes(a.id));
        const finishedAcademies = allAcademies.filter(a => completedIds.includes(a.id));

        return (
          <div key={e.id} className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-sm">
            <div className="bg-slate-950 p-4 text-white font-bold flex items-center justify-between">
              <div className="flex items-center">
                <Calendar size={18} className="mr-2 text-blue-400" /> {e.name}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest bg-slate-800 px-2 py-1 rounded text-slate-300">{e.status}</span>
            </div>
            <div className="p-4 space-y-6">
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center">
                  <Clock size={14} className="mr-2" /> Academias Pendentes ({pendingAcademies.length})
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {pendingAcademies.map(a => (
                    <div key={a.id} onClick={() => onSelectAcademy(e.id, a.id)} className="p-4 flex justify-between items-center bg-slate-700/50 rounded-xl hover:bg-slate-700 cursor-pointer group transition-colors border border-slate-600/50">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 rounded-xl bg-slate-800 text-slate-400 group-hover:bg-blue-900/30 group-hover:text-blue-400">
                          <School size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">{a.name}</p>
                          <p className="text-[10px] text-slate-400">{a.city} - {a.responsible}</p>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-slate-500 group-hover:text-blue-400 transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
              {finishedAcademies.length > 0 && (
                <div className="pt-4 border-t border-slate-700">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center">
                    <CheckCircle2 size={14} className="mr-2 text-emerald-500" /> Academias Concluídas ({finishedAcademies.length})
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {finishedAcademies.map(a => {
                      const visit = visits.find(v => v.eventId === e.id && v.academyId === a.id);
                      return (
                        <div key={a.id} onClick={() => onSelectAcademy(e.id, a.id)} className="p-4 flex justify-between items-center bg-slate-800 rounded-xl hover:bg-slate-700 cursor-pointer group transition-colors border border-slate-700 opacity-75">
                          <div className="flex items-center space-x-4">
                            <div className="p-2 rounded-xl bg-emerald-900/20 text-emerald-500">
                              <CheckCircle2 size={20} />
                            </div>
                            <div>
                              <p className="font-bold text-white text-sm">{a.name}</p>
                              <div className="flex items-center space-x-2">
                                <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${visit?.temperature === AcademyTemperature.HOT ? 'bg-red-900/30 text-red-500' : 'bg-blue-900/30 text-blue-500'}`}>
                                  {visit?.temperature}
                                </span>
                                <p className="text-[10px] text-slate-400 tabular-nums">{visit?.vouchersGenerated?.length || 0} vouchers</p>
                              </div>
                            </div>
                          </div>
                          <Eye size={16} className="text-slate-500" />
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
    <div className="max-w-xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 transition-all">{toast && <div className="fixed top-20 right-8 bg-slate-900 text-white p-4 rounded-xl shadow-2xl animate-in slide-in-from-right z-50 flex items-center space-x-2 border border-slate-700"><CheckCircle2 size={18} className="text-emerald-400" /><span>{toast}</span></div>}
      <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-sm relative overflow-hidden">
        <div className="flex justify-between items-start mb-8 z-10 relative"><div><h3 className="text-2xl font-bold text-white">{academy.name}</h3><p className="text-slate-400 font-medium">{academy.city} - {academy.state}</p></div><button onClick={onCancel} className="text-slate-500 hover:text-slate-300 transition-colors"><X size={24} /></button></div>

        {step === 'START' && (
          <div className="text-center py-8 space-y-6 animate-in zoom-in-95">
            <div className="w-20 h-20 bg-blue-900/30 text-blue-500 rounded-full flex items-center justify-center mx-auto animate-pulse"><Clock size={40} /></div>
            <div className="space-y-1"><h4 className="font-bold text-white">Pronto para começar?</h4><p className="text-sm text-slate-400">Atendimento oficial para registro.</p></div>
            <button onClick={() => { setVisit(p => ({ ...p, startedAt: new Date().toISOString() })); setStep('ACTIVE'); }} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-blue-900/20 hover:bg-blue-700 transition-all">Iniciar Visita Agora</button>
          </div>
        )}

        {step === 'ACTIVE' && (
          <div className="space-y-6 animate-in fade-in">
            <textarea placeholder="Observações..." className="w-full h-32 border border-slate-600 bg-slate-700 text-white p-4 rounded-2xl text-sm outline-none transition-all placeholder:text-slate-500 focus:border-blue-500" value={visit.notes} onChange={e => setVisit(p => ({ ...p, notes: e.target.value }))} />
            <div className="grid grid-cols-3 gap-3">
              {[AcademyTemperature.COLD, AcademyTemperature.WARM, AcademyTemperature.HOT].map(t => (
                <button key={t} onClick={() => setVisit(p => ({ ...p, temperature: t }))} className={`py-3 rounded-xl font-bold transition-all border ${visit.temperature === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-700 text-slate-400 border-slate-600 hover:bg-slate-600'}`}>{t}</button>
              ))}
            </div>
            <button onClick={handleFinalize} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-colors">Gerar Vouchers</button>
          </div>
        )}

        {step === 'VOUCHERS' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 text-center">
            <div className="bg-slate-700 p-6 rounded-2xl flex items-center justify-center space-x-8 border border-slate-600">
              <button onClick={() => adjust(-1)} className="bg-slate-600 p-3 rounded-full border border-slate-500 shadow-sm active:scale-90 text-white hover:bg-slate-500"><Minus size={24} /></button>
              <span className="text-4xl font-black text-white tabular-nums">{visit.vouchersGenerated?.length || 0}</span>
              <button onClick={() => adjust(1)} className="bg-slate-600 p-3 rounded-full border border-slate-500 shadow-sm active:scale-90 text-white hover:bg-slate-500"><Plus size={24} /></button>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {visit.vouchersGenerated?.map((c, i) => (
                <span key={i} className="bg-blue-900/30 text-blue-400 border border-blue-800/50 px-3 py-1 rounded-lg font-mono font-bold">{c}</span>
              ))}
            </div>
            <button onClick={handleFinishWithQr} className="w-full bg-slate-950 text-white py-4 rounded-2xl font-bold shadow-xl flex items-center justify-center space-x-2 border border-slate-700">
              <QrCode size={20} />
              <span>Gerar QR Code para o Dono</span>
            </button>
          </div>
        )}

        {step === 'QR_CODE' && (
          <div className="space-y-6 animate-in zoom-in-95 text-center">
            <div className="space-y-2">
              <h4 className="font-bold text-white">Apresente para o Dono</h4>
              <p className="text-xs text-slate-400">Ele deve apontar a câmera do celular para este QR Code.</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 inline-block shadow-lg">
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
                className="flex-1 bg-slate-700 text-slate-300 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 text-sm hover:bg-slate-600"
              >
                <Copy size={16} />
                <span>Copiar Link</span>
              </button>
              <button
                onClick={() => window.open(generateShareLink(), '_blank')}
                className="flex-1 bg-blue-900/30 text-blue-400 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 text-sm hover:bg-blue-900/50"
              >
                <ExternalLink size={16} />
                <span>Visualizar Tela</span>
              </button>
            </div>
            <button onClick={() => onFinish(visit)} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold mt-4 hover:bg-blue-700 transition-colors">Concluir e Voltar</button>
          </div>
        )}

        {step === 'SUMMARY' && (
          <div className="space-y-6 animate-in zoom-in-95">
            <div className="bg-emerald-900/30 text-emerald-400 p-4 rounded-2xl font-bold text-center border border-emerald-800/50">VISITA REGISTRADA</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-700 p-4 rounded-xl border border-slate-600"><span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Vouchers</span><span className="font-bold text-white tabular-nums">{visit.vouchersGenerated?.length}</span></div>
              <div className="bg-slate-700 p-4 rounded-xl border border-slate-600"><span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Interesse</span><span className={`font-bold ${visit.temperature === AcademyTemperature.HOT ? 'text-red-400' : 'text-blue-400'}`}>{visit.temperature}</span></div>
            </div>
            <div className="bg-slate-700 p-4 rounded-xl border border-slate-600 text-sm text-slate-300 italic">"{visit.notes}"</div>
            <div className="flex space-x-2">
              <button onClick={() => setStep('QR_CODE')} className="flex-1 bg-slate-950 text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 border border-slate-700"><QrCode size={18} /><span>Reexibir QR</span></button>
              <button onClick={() => setStep('ACTIVE')} className="flex-1 bg-slate-700 text-slate-300 py-4 rounded-2xl font-bold hover:bg-slate-600">Editar Relatório</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SalesFinance: React.FC<{ finance: FinanceRecord[], events: Event[], onConfirm: any }> = ({ finance, events, onConfirm }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {finance.length === 0 && <p className="col-span-2 text-center text-slate-400 font-medium py-10">Nenhum registro financeiro.</p>}
      {finance.map(f => (
        <div key={f.id} className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-sm flex flex-col justify-between">
          <div><div className="flex justify-between items-start mb-4"><div className="bg-emerald-900/30 text-emerald-500 p-3 rounded-2xl"><DollarSign size={24} /></div><span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full ${f.status === FinanceStatus.PAID ? 'bg-blue-900/30 text-blue-400' : f.status === FinanceStatus.RECEIVED ? 'bg-emerald-900/30 text-emerald-400' : 'bg-amber-900/30 text-amber-400'}`}>{f.status === FinanceStatus.RECEIVED ? 'CONCLUÍDO' : f.status}</span></div><h4 className="text-lg font-bold text-white mb-1">{events.find(e => e.id === f.eventId)?.name}</h4><p className="text-3xl font-black text-white mb-6 tabular-nums">$ {f.amount.toFixed(2)}</p></div>
          {f.status === FinanceStatus.PAID && (<button onClick={() => onConfirm(f.id)} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center space-x-2 hover:bg-blue-700 transition-colors"><CheckCircle2 size={18} /><span>Confirmar Recebimento</span></button>)}
          {f.status === FinanceStatus.RECEIVED && (<div className="w-full bg-slate-700 text-slate-400 py-3 rounded-xl font-bold text-center text-xs flex items-center justify-center space-x-2"><CheckCircle2 size={14} /><span>RECEBIDO E CONCLUÍDO</span></div>)}
          {f.status === FinanceStatus.PENDING && (<div className="w-full bg-amber-900/20 text-amber-500 py-3 rounded-xl font-bold text-center text-xs border border-amber-900/30 flex items-center justify-center space-x-2"><Clock size={14} /><span>AGUARDANDO PAGAMENTO...</span></div>)}
        </div>
      ))}
    </div>
  </div>
);


const AccessControlManager: React.FC<{ addLog: any }> = ({ addLog }) => {
  const [allowlist, setAllowlist] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'SALES' | 'ADMIN'>('SALES');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const al = await AuthService.getAllowlist();
    setAllowlist(al);
    const lg = await AuthService.getAuthLogs();
    setLogs(lg);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await AuthService.addToAllowlist(newEmail, newRole);
      setNewEmail('');
      loadData();
      addLog('ACCESS_GRANTED', `Acesso liberado para ${newEmail}`);
      alert('Usuário autorizado com sucesso!');
    } catch (error: any) {
      alert('Erro: ' + error.message);
    }
  };

  const toggleStatus = async (id: string, current: string) => {
    try {
      await AuthService.toggleAllowlistStatus(id, current);
      loadData();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Allowlist Section */}
        <div className="flex-1 space-y-4">
          <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-sm">
            <h3 className="text-xl font-bold text-white mb-4">Autorizar Novo Acesso</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <input
                type="email"
                required
                placeholder="E-mail do novo usuário"
                className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-white outline-none focus:border-blue-500"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
              />
              <div className="flex gap-4">
                <select
                  className="flex-1 bg-slate-900 border border-slate-700 p-3 rounded-xl text-white outline-none"
                  value={newRole}
                  onChange={e => setNewRole(e.target.value as any)}
                >
                  <option value="SALES">Vendedor</option>
                  <option value="ADMIN">Administrador</option>
                </select>
                <button type="submit" className="flex-1 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">
                  <UserPlus size={18} className="inline mr-2" />
                  Adicionar
                </button>
              </div>
            </form>
          </div>

          <div className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden">
            <div className="p-4 bg-slate-900/50 border-b border-slate-700">
              <h3 className="font-bold text-white text-sm uppercase tracking-wider">Usuários Autorizados</h3>
            </div>
            <div className="divide-y divide-slate-700 max-h-[400px] overflow-y-auto">
              {allowlist.map(item => (
                <div key={item.id} className="p-4 flex justify-between items-center hover:bg-slate-700/30">
                  <div>
                    <p className="text-white font-bold">{item.email}</p>
                    <span className="text-xs text-slate-500 font-bold uppercase">{item.role}</span>
                  </div>
                  <button
                    onClick={() => toggleStatus(item.id, item.status)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${item.status === 'ACTIVE' ? 'bg-emerald-900/30 text-emerald-400 hover:bg-red-900/30 hover:text-red-400' : 'bg-red-900/30 text-red-400 hover:bg-emerald-900/30 hover:text-emerald-400'}`}
                  >
                    {item.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Logs Section */}
        <div className="flex-1">
          <div className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden h-full flex flex-col">
            <div className="p-4 bg-slate-900/50 border-b border-slate-700 flex justify-between items-center">
              <h3 className="font-bold text-white text-sm uppercase tracking-wider">Logs de Autenticação</h3>
              <button onClick={loadData} className="text-blue-400 hover:text-white"><RefreshCw size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[600px] p-2 space-y-2">
              {logs.map(log => (
                <div key={log.id} className="p-3 bg-slate-900/50 rounded-xl border border-slate-700/50 text-xs">
                  <div className="flex justify-between mb-1">
                    <span className={`font-bold ${log.action.includes('SUCCESS') || log.action.includes('ACTIVATED') ? 'text-emerald-400' :
                      log.action.includes('FAILED') || log.action.includes('BLOCKED') ? 'text-red-400' : 'text-blue-400'
                      }`}>{log.action}</span>
                    <span className="text-slate-500 tabular-nums">{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-white font-medium mb-1">{log.email}</p>
                  <p className="text-slate-500 break-all bg-slate-950 p-2 rounded-lg font-mono">{log.details}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
