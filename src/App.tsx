
import React, { useState, useEffect, useMemo, useRef, Suspense, lazy } from 'react';

import {
  User,
  UserRole,
  Academy,
  type Event,
  EventStatus,
  Visit,
  VisitStatus,
  AcademyTemperature,
  ContactPerson,
  FinanceRecord,
  FinanceStatus,
  FollowUpStatus,
  Voucher,
  Notification,
} from './types';

import { useAcademies } from './hooks/useAcademies';
import { useEvents } from './hooks/useEvents';
import { useVisits } from './hooks/useVisits';
import { useFinance } from './hooks/useFinance';
import { useVouchers } from './hooks/useVouchers';
import { useQueryClient } from '@tanstack/react-query';

import { PublicVoucherLanding } from './components/PublicVoucherLanding';
// Lazy loaded page components
const EventDetailAdmin = lazy(() => import('./pages/EventDetailAdmin').then(m => ({ default: m.EventDetailAdmin })));
const VisitDetail = lazy(() => import('./pages/VisitDetail').then(m => ({ default: m.VisitDetail })));
const AdminFinance = lazy(() => import('./pages/AdminFinance').then(m => ({ default: m.AdminFinance })));
const SalespersonEvents = lazy(() => import('./pages/SalespersonEvents').then(m => ({ default: m.SalespersonEvents })));
const CustomAuth = lazy(() => import('./pages/CustomAuth'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const Reports = lazy(() => import('./pages/Reports').then(m => ({ default: m.Reports })));
const EventsManager = lazy(() => import('./pages/EventsManager').then(m => ({ default: m.EventsManager })));
const AcademiesManager = lazy(() => import('./pages/AcademiesManager').then(m => ({ default: m.AcademiesManager })));
const CallCenterAcademies = lazy(() => import('./pages/CallCenterAcademies').then(m => ({ default: m.CallCenterAcademies })));
const UsersManager = lazy(() => import('./pages/UsersManager').then(m => ({ default: m.UsersManager })));
const VendorList = lazy(() => import('./pages/VendorList').then(m => ({ default: m.VendorList })));
const VendorDetail = lazy(() => import('./pages/VendorDetail').then(m => ({ default: m.VendorDetail })));
const SalesFinance = lazy(() => import('./pages/SalesFinance').then(m => ({ default: m.SalesFinance })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const FollowUpPage = lazy(() => import('./pages/FollowUp').then(m => ({ default: m.FollowUpPage })));
const MeetingsPage = lazy(() => import('./pages/MeetingsPage').then(m => ({ default: m.MeetingsPage })));
import { SalesHeader } from './components/SalesHeader';
import { GlobalToast } from './components/GlobalToast';
import { SystemAlerts } from './components/SystemAlerts';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import ElevationPrompt from './components/ElevationPrompt';
import AdminModeIndicator from './components/AdminModeIndicator';
import { ElevationProvider, useElevation } from './contexts/ElevationContext';
import { supabase, DatabaseService, AuthService } from './lib/supabase';
import { cn, generateVoucherCode } from './lib/utils';
import { toast, Toaster } from 'sonner';
import { LoadingProvider, useLoading } from './contexts/LoadingContext';
import { LoadingOverlay } from './components/LoadingOverlay';

const AppContent: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Elevation state
  const [showElevationPrompt, setShowElevationPrompt] = useState(false);
  const { isElevated, session, requestElevation, revokeElevation } = useElevation();

  const queryClient = useQueryClient();

  // TanStack Queries (replacing local states)
  const { data: academies = [], refetch: refetchAcademies } = useAcademies();
  const { data: events = [], refetch: refetchEvents } = useEvents();
  const { data: visits = [], refetch: refetchVisits } = useVisits();
  const { data: finance = [], refetch: refetchFinance } = useFinance();
  const { data: vouchers = [], refetch: refetchVouchers } = useVouchers();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [sellers, setSellers] = useState<User[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [followUpOverdueCount, setFollowUpOverdueCount] = useState(0);

  const [selectedAcademyId, setSelectedAcademyId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [linkingEventId, setLinkingEventId] = useState<string | null>(null);
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
    const detailTabs = ['visit_detail', 'event_detail_admin', 'vendor_detail'];

    // Só limpamos se não estivermos indo para uma tela de detalhes
    if (!detailTabs.includes(activeTab)) {
      setSelectedEventId(null);
      setSelectedAcademyId(null);
      setSelectedVendorId(null);
    }

    // Verificação de Segurança de Perfil (Role Protection)
    if (currentUser) {
      // follow_up is accessible by ALL roles — do NOT include it here
      const adminRestrictedTabs = ['dashboard', 'access_control', 'admin_finance', 'reports', 'event_detail_admin', 'vendors', 'vendor_detail', 'events'];
      const isCallCenter = currentUser.role === UserRole.CALL_CENTER;

      if (currentUser.role !== UserRole.ADMIN) {
        if (adminRestrictedTabs.includes(activeTab)) {
          setActiveTab('my_events');
        }
        // Specific check for academies: if not admin AND not call center, block
        if (activeTab === 'academies' && !isCallCenter) {
          setActiveTab('my_events');
        }
      }

      if (currentUser.role === UserRole.ADMIN && activeTab === 'visit_detail') {
        setActiveTab('dashboard');
      }
    }
  }, [activeTab, currentUser?.role]);

  const { withLoading } = useLoading();

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
    let initialTab = 'my_events';
    if (user.role === UserRole.ADMIN) initialTab = 'dashboard';
    else if (user.role === UserRole.CALL_CENTER) initialTab = 'academies';
    setActiveTab(initialTab);
  };

  const loadData = React.useCallback(async () => {
    return withLoading(async () => {
      try {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['academies'] }),
          queryClient.invalidateQueries({ queryKey: ['events'] }),
          queryClient.invalidateQueries({ queryKey: ['visits'] }),
          queryClient.invalidateQueries({ queryKey: ['finance'] }),
          queryClient.invalidateQueries({ queryKey: ['vouchers'] })
        ]);

        if (currentUser) {
          const dbNotifications = await DatabaseService.getNotifications(currentUser.id);
          setNotifications(dbNotifications);
        }
      } catch (error) {
        console.error("Error refreshing data:", error);
      }
    });
  }, [currentUser, queryClient, withLoading]);

  // Carregar overdue follow-ups no login
  useEffect(() => {
    if (!currentUser) return;
    DatabaseService.getFollowUps().then(fus => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      setFollowUpOverdueCount(fus.filter(f => {
        if (!f.nextContactAt) return false;
        if (f.status === FollowUpStatus.NO_INTEREST || f.status === FollowUpStatus.CLOSED) return false;
        const d = new Date(f.nextContactAt); d.setHours(0, 0, 0, 0);
        return d < today;
      }).length);
    }).catch(() => {});
  }, [currentUser?.id]);

  // Real-time Notifications Subscription
  useEffect(() => {
    if (!currentUser) return;

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
        (payload: { new: any }) => {
          const newN = payload.new;
          const mapped: Notification = {
            id: newN.id,
            userId: newN.user_id,
            message: newN.message,
            read: newN.read,
            timestamp: newN.created_at
          };
          setNotifications((prev: Notification[]) => [mapped, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id]);

  // ?? Real-time Global Data Sync
  useEffect(() => {
    if (!currentUser) return;

    console.log('?? [DataSync] Setting up global realtime synchronization...');

    const channel = supabase
      .channel('global-data-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'academies' }, (p: any) => {
        console.log('?? [DataSync] academies changed:', p.eventType);
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, (p: any) => {
        console.log('?? [DataSync] events changed:', p.eventType);
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_academies' }, (p: any) => {
        console.log('?? [DataSync] event_academies changed:', p.eventType);
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visits' }, (p: any) => {
        console.log('?? [DataSync] visits changed:', p.eventType);
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vouchers' }, (p: any) => {
        console.log('?? [DataSync] vouchers changed:', p.eventType);
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'finance_records' }, (p: any) => {
        console.log('?? [DataSync] finance_records changed:', p.eventType);
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'follow_ups' }, () => {
        DatabaseService.getFollowUps().then(fus => {
          const today = new Date(); today.setHours(0, 0, 0, 0);
          setFollowUpOverdueCount(fus.filter(f => {
            if (!f.nextContactAt) return false;
            if (f.status === FollowUpStatus.NO_INTEREST || f.status === FollowUpStatus.CLOSED) return false;
            const d = new Date(f.nextContactAt); d.setHours(0, 0, 0, 0);
            return d < today;
          }).length);
        });
      })
      .subscribe((status: string) => {
        console.log('?? [DataSync] Subscription status:', status);
      });

    return () => {
      console.log('?? [DataSync] Cleaning up global synchronization');
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, loadData]);

  const fetchProfile = async (userId: string) => {
    try {
      const data = await DatabaseService.getProfile(userId);

      if (data) {
        // Construct the full user object from DB data
        const updatedUser: User = {
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role as UserRole,
          phone: data.phone,
          city: data.city,
          uf: data.uf,
          photoUrl: data.photoUrl // DatabaseService already maps photo_url to photoUrl
        };

        setCurrentUser(updatedUser);

        // Sync with local storage to keep it fresh
        localStorage.setItem('bjj_user', JSON.stringify(updatedUser));

        // Respect existing local state for tab if not forced
        if (data.role === UserRole.ADMIN && activeTab === 'my_events') {
          setActiveTab('dashboard');
        } else if (data.role !== UserRole.ADMIN && ['dashboard', 'academies', 'events'].includes(activeTab)) {
          setActiveTab('my_events');
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  // Refresh profile on load/login to ensure data consistency (Syncs LocalStorage with DB)
  useEffect(() => {
    if (currentUser?.id) {
      fetchProfile(currentUser.id);
    }
  }, [currentUser?.id]);

  const logout = async () => {
    localStorage.removeItem('bjj_user');
    setCurrentUser(null);
    window.location.reload();
  };

  // Handler de elevação
  const handleElevationRequest = async (password: string, reason: string) => {
    const result = await requestElevation(password, reason);
    if (result.success) {
      setShowElevationPrompt(false);
      setGlobalToast({ message: 'Privilégios elevados com sucesso!', type: 'success' });
    }
    return result;
  };

  const handleElevationRevoke = async () => {
    await revokeElevation();
    setGlobalToast({ message: 'Modo administrativo desativado', type: 'info' });
  };

  const fetchUsers = async () => {
    try {
      const salesData = await DatabaseService.getSalespersons();
      setSellers(salesData as User[]);

      const adminData = await DatabaseService.getAdmins();
      setAdmins(adminData as User[]);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser]);


  /* Restore notifyUser */
  const notifyUser = async (userId: string, message: string) => {
    console.log('?? [Notifications] Sending notification:', { userId, message, currentUserId: currentUser?.id });

    // Verificar se notificações estão habilitadas
    try {
      const notificationsEnabled = await DatabaseService.getSetting('admin_notifications_enabled');
      // Se a configuração não existe (null), assume que está habilitado (comportamento padrão)
      // Se existe, verifica se é true (pode ser boolean ou string)
      const isEnabled = notificationsEnabled === null ||
        notificationsEnabled === true ||
        notificationsEnabled === 'true' ||
        notificationsEnabled === '"true"';

      if (!isEnabled) {
        console.log('?? [Notifications] Notificações desabilitadas - ignorando:', message);
        return; // Não envia notificação
      }
    } catch (error) {
      console.error('?? [Notifications] Error checking notifications setting:', error);
      // Em caso de erro, continua e envia a notificação (fail-safe)
    }

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
      setNotifications((prev: Notification[]) => [newNotif, ...prev]);
    }

    // Persist to database
    try {
      await DatabaseService.createNotification(userId, message);
    } catch (error) {
      console.error('?? [Notifications] Error saving notification:', error);
    }
  };

  const handleUpdateEvent = async (updatedEvent: Event) => {
    try {
      const oldEvent = events.find((e: Event) => e.id === updatedEvent.id);

      // 1. Update the main event record
      await DatabaseService.updateEvent(updatedEvent.id, updatedEvent);

      // 2. Sync academies (Junction Table)
      if (oldEvent) {
        const added = updatedEvent.academiesIds.filter(id => !oldEvent.academiesIds.includes(id));
        const removed = oldEvent.academiesIds.filter((id: string) => !updatedEvent.academiesIds.includes(id));

        // Execute junction updates
        for (const id of added) await DatabaseService.addEventAcademy(updatedEvent.id, id);
        for (const id of removed) {
          await DatabaseService.removeEventAcademy(updatedEvent.id, id);
        }
      }

      // 3. Update local state (Invalidate to Refetch)
      queryClient.invalidateQueries({ queryKey: ['events'] });

      // 4. Notifications
      if (oldEvent) {
        const oldSalespersonIds = oldEvent.salespersonIds || [];
        const newSalespersonIds = updatedEvent.salespersonIds || [];

        const addedIds = newSalespersonIds.filter(id => !oldSalespersonIds.includes(id));
        const removedIds = oldSalespersonIds.filter(id => !newSalespersonIds.includes(id));

        addedIds.forEach(id => {
          notifyUser(id, `Você é o novo responsável pelo evento "${updatedEvent.name}".`);
        });

        removedIds.forEach(id => {
          notifyUser(id, `Você não é mais o responsável pelo evento "${oldEvent.name}".`);
        });

        // Notifications for existing salespersons (still linked) if event details changed or academies assigned
        const keptIds = newSalespersonIds.filter(id => oldSalespersonIds.includes(id));
        if (keptIds.length > 0) {
          const addedAcademies = updatedEvent.academiesIds.filter(id => !oldEvent.academiesIds.includes(id));

          if (addedAcademies.length > 0) {
            keptIds.forEach(id => {
              notifyUser(id, `${addedAcademies.length} novas academias atribuídas ao evento "${updatedEvent.name}".`);
            });
          }

          if (oldEvent.name !== updatedEvent.name || oldEvent.city !== updatedEvent.city || oldEvent.state !== updatedEvent.state) {
            keptIds.forEach(id => {
              notifyUser(id, `As informações do evento "${updatedEvent.name}" foram atualizadas.`);
            });
          }
        }
      }

      setGlobalToast({ message: "Evento atualizado com sucesso!", type: 'success' });
    } catch (error) {
      console.error("Error updating event:", error);
      alert("Erro ao atualizar evento.");
    }
  };

  // Conditional renders moved inside component scope
  if (hash.startsWith('#/public-voucher/')) {
    const rawHash = decodeURIComponent(hash.replace('#/public-voucher/', ''));
    let voucherData = rawHash.split('|');
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

  if (!currentUser) {
    return (
      <Suspense fallback={<div className="h-screen bg-neutral-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
      </div>}>
        <CustomAuth onLogin={handleLogin} />
      </Suspense>
    );
  }

  return (
    <div className="flex h-screen bg-neutral-900 font-sans text-neutral-100 overflow-hidden">
      {/* Elevation Prompt Modal */}
      {showElevationPrompt && currentUser && (
        <ElevationPrompt
          userName={currentUser.name}
          onElevate={handleElevationRequest}
          onCancel={() => setShowElevationPrompt(false)}
        />
      )}

      {/* Admin Mode Indicator */}
      {isElevated && session?.expiresAt && currentUser && (
        <AdminModeIndicator
          expiresAt={session.expiresAt}
          onRevoke={handleElevationRevoke}
          userName={currentUser.name}
        />
      )}

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
            followUpOverdueCount={followUpOverdueCount}
          />
        )
      }

      {/* Main Content Area */}
      <main className={cn(
        "flex-1 flex flex-col h-screen overflow-hidden relative transition-all duration-500",
        currentUser.role === UserRole.SALES ? "bg-[#0a0a0a]" : "bg-neutral-900",
        isElevated ? "pt-24" : ""
      )}>
        {/* Background Decorative Gradient - Mobile Only */}
        {currentUser.role === UserRole.SALES && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[40%] bg-amber-500/5 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[40%] bg-zinc-500/5 blur-[120px] rounded-full"></div>
          </div>
        )}

        {/* Header Logic */}
        {currentUser.role === UserRole.ADMIN ? (
          <Navbar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            activeTab={activeTab}
            onOpenElevationPrompt={() => setShowElevationPrompt(true)}
          />
        ) : activeTab !== 'visit_detail' ? (
          <SalesHeader user={currentUser} activeTab={activeTab} onNavigate={setActiveTab} />
        ) : null}

        <div className={cn(
          "flex-1 overflow-y-auto relative z-10 custom-scrollbar",
          (currentUser.role === UserRole.SALES || currentUser.role === UserRole.CALL_CENTER) ? "p-4 pb-48" : "p-4 md:p-6 lg:p-8"
        )}>
          <GlobalToast toast={globalToast} onClose={() => setGlobalToast(null)} />

          <SystemAlerts
            notifications={notifications}
            currentUser={currentUser}
            setNotifications={setNotifications}
          />

          <Suspense fallback={
            <div className="flex items-center justify-center p-20">
              <div className="w-8 h-8 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
            </div>
          }>

            {activeTab === 'dashboard' && currentUser.role === UserRole.ADMIN && <AdminDashboard events={events} academies={academies} visits={visits} vouchers={vouchers} finance={finance} vendedores={sellers} />}
            {activeTab === 'access_control' && currentUser.role === UserRole.ADMIN && (
              <UsersManager
                users={[...sellers, ...admins]}
                setUsers={(newUsersOrUpdater: User[] | ((prev: User[]) => User[])) => {
                  fetchUsers();
                }}
                currentUser={currentUser}
                notifyUser={notifyUser}
              />
            )}
            {activeTab === 'academies' && currentUser.role === UserRole.ADMIN && <AcademiesManager academies={academies} setAcademies={() => queryClient.invalidateQueries({ queryKey: ['academies'] })} currentUser={currentUser} notifyUser={notifyUser} events={events} />}
            {activeTab === 'academies' && (currentUser.role === UserRole.CALL_CENTER || currentUser.role === UserRole.SALES) && (
              <CallCenterAcademies
                academies={academies}
                setAcademies={() => queryClient.invalidateQueries({ queryKey: ['academies'] })}
                currentUser={currentUser}
                notifyUser={notifyUser}
                events={events}
                linkingEventId={linkingEventId}
                onLinkComplete={() => {
                  setLinkingEventId(null);
                  setActiveTab('my_events');
                  setGlobalToast({ message: 'Academia vinculada com sucesso!', type: 'success' });
                  loadData(); // This now invalidates all queries
                }}
                onCancelLinking={() => {
                  setLinkingEventId(null);
                  setActiveTab('my_events');
                }}
              />
            )}
            {activeTab === 'events' && currentUser.role === UserRole.ADMIN && <EventsManager events={events} visits={visits} setEvents={() => queryClient.invalidateQueries({ queryKey: ['events'] })} academies={academies} vendedores={sellers} onSelectEvent={(id: string) => { setSelectedEventId(id); setActiveTab('event_detail_admin'); }} notifyUser={notifyUser} />}
            {activeTab === 'event_detail_admin' && selectedEventId && currentUser.role === UserRole.ADMIN && (
              <EventDetailAdmin
                event={events.find(e => e.id === selectedEventId)!}
                academies={academies}
                visits={visits}
                vendedores={sellers}
                onBack={() => setActiveTab('events')}
                onUpdateEvent={handleUpdateEvent}
                notifyUser={notifyUser}
                events={events}
              />
            )}
            {activeTab === 'admin_finance' && currentUser.role === UserRole.ADMIN && (
              <AdminFinance
                finance={finance}
                setFinance={() => queryClient.invalidateQueries({ queryKey: ['finance'] })}
                events={events}
                vendedores={sellers}
                notifyUser={notifyUser}
              />
            )}
            {activeTab === 'reports' && currentUser.role === UserRole.ADMIN && <Reports visits={visits} academies={academies} events={events} vouchers={vouchers} vendedores={sellers} finance={finance} />}

            {activeTab === 'vendors' && currentUser.role === UserRole.ADMIN && (
              <VendorList
                vendors={sellers}
                visits={visits}
                onSelect={(id) => {
                  setSelectedVendorId(id);
                  setActiveTab('vendor_detail');
                }}
              />
            )}

            {activeTab === 'vendor_detail' && selectedVendorId && currentUser.role === UserRole.ADMIN && (
              <VendorDetail
                vendor={sellers.find(s => s.id === selectedVendorId)!}
                visits={visits}
                events={events}
                academies={academies}
                vouchers={vouchers}
                finance={finance}
                onBack={() => setActiveTab('vendors')}
              />
            )}

            {activeTab === 'my_events' && (
              <SalespersonEvents
                events={events.filter((e: Event) => e.salespersonIds && e.salespersonIds.includes(currentUser.id))}
                academies={academies}
                visits={visits}
                notifications={notifications.filter((n: Notification) => n.userId === currentUser.id && !n.read)}
                onDismissNotif={(id: string) => setNotifications((prev: Notification[]) => prev.map((n: Notification) => n.id === id ? { ...n, read: true } : n))}
                onSelectAcademy={(eventId: string, academyId: string) => { setSelectedEventId(eventId); setSelectedAcademyId(academyId); setActiveTab('visit_detail'); }}
                currentUserId={currentUser.id}
                userRole={currentUser.role}
                onRefreshData={loadData}
                onNavigateToAcademies={(eventId) => {
                  setLinkingEventId(eventId);
                  setActiveTab('academies');
                }}
              />
            )}
            {activeTab === 'visit_detail' && selectedEventId && selectedAcademyId && (
              <VisitDetail
                eventId={selectedEventId}
                academy={academies.find((a: Academy) => a.id === selectedAcademyId)!}
                event={events.find((e: Event) => e.id === selectedEventId)!}
                existingVisit={visits.find((v: Visit) => v.eventId === selectedEventId && v.academyId === selectedAcademyId)}
                userRole={currentUser.role}
                onStart={async (visit: Visit) => {
                  try {
                    const saved = await DatabaseService.upsertVisit(visit);
                    queryClient.invalidateQueries({ queryKey: ['visits'] });
                    return saved;
                  } catch (e) {
                    console.error("Error start visit:", e);
                    throw e;
                  }
                }}
                onFinish={async (visit: Visit) => {
                  await withLoading(async () => {
                    try {
                      // Preparar Vouchers
                      const currentVoucherCodes = new Set(vouchers.map((v: Voucher) => v.code));
                      const newVoucherObjects: Voucher[] = (visit.vouchersGenerated || [])
                        .filter((code: string) => !currentVoucherCodes.has(code))
                        .map((code: string) => ({
                          code,
                          eventId: visit.eventId,
                          academyId: visit.academyId,
                          visitId: visit.id!, // Será corrigido dentro da transação se necessário
                          createdAt: new Date().toISOString()
                        }));

                      // Executar Transação Atômica (Visita + Vouchers)
                      const savedVisit = await DatabaseService.finalizeVisitTransaction(visit, newVoucherObjects);

                      // Atualizar Estado Local
                      queryClient.invalidateQueries({ queryKey: ['visits'] });
                      if (newVoucherObjects.length > 0) {
                        queryClient.invalidateQueries({ queryKey: ['vouchers'] });
                      }

                      // Notify Admins (Only if transitioning to VISITED for the first time)
                      const previousVisitState = visits.find((v: Visit) => v.eventId === visit.eventId && v.academyId === visit.academyId);
                      const isTransitioningToVisited = visit.status === VisitStatus.VISITED && (!previousVisitState || previousVisitState.status !== VisitStatus.VISITED);

                      if (isTransitioningToVisited) {
                        admins.forEach((admin: User) => {
                          notifyUser(admin.id, `O vendedor ${currentUser.name} concluiu uma visita na academia "${academies.find((a: Academy) => a.id === selectedAcademyId)?.name}".`);
                        });
                      }

                      setActiveTab('my_events');
                    } catch (error) {
                      console.error("Error saving visit:", error);
                      alert("Erro ao salvar visita.");
                    }
                  });
                }}
                onCancel={async () => {
                  if (selectedEventId && selectedAcademyId) {
                    // Proteção Frontend: Só deletamos se a visita NÃO estiver concluída
                    const currentVisit = visits.find((v: Visit) => v.eventId === selectedEventId && v.academyId === selectedAcademyId);

                    if (currentVisit && currentVisit.status === VisitStatus.VISITED) {
                      console.log("🔒 [App] Visita concluída. Fechando modal sem deletar.");
                      // Apenas fecha o modal
                    } else {
                      console.log("🗑️ [App] Visita pendente ou inexistente. Limpando rascunho...");
                      try {
                        await DatabaseService.deleteVisitByEventAndAcademy(selectedEventId, selectedAcademyId);
                        queryClient.invalidateQueries({ queryKey: ['visits'] });
                      } catch (error) {
                        console.error("Error cancelling visit:", error);
                      }
                    }
                  }
                  setActiveTab('my_events');
                }}
              />
            )}
            {activeTab === 'sales_finance' && (
              <SalesFinance
                finance={finance.filter((f: FinanceRecord) => f.salespersonId === currentUser.id)}
                events={events}
                onConfirm={async (recordId: string) => {
                  const record = finance.find((f: FinanceRecord) => f.id === recordId);
                  if (record) {
                    try {
                      const updated = await DatabaseService.updateFinance(record.id, { ...record, status: FinanceStatus.RECEIVED, updatedAt: new Date().toISOString() });
                      queryClient.invalidateQueries({ queryKey: ['finance'] });

                      // Notificar admins que o vendedor recebeu o dinheiro
                      const eventName = events.find((e: Event) => e.id === record.eventId)?.name;
                      admins.forEach((admin: User) => {
                        notifyUser(admin.id, `O vendedor ${currentUser?.name} confirmou o recebimento de $ ${record.amount.toFixed(2)} referente ao evento "${eventName}".`);
                      });
                    } catch (error) {
                      console.error("Error confirming finance:", error);
                    }
                  }
                }}
              />
            )}
            {activeTab === 'profile' && currentUser && (
              <Profile
                user={currentUser}
                onUpdate={(updatedUser) => {
                  setCurrentUser(updatedUser);
                  // Update both state and storage
                  localStorage.setItem('bjj_user', JSON.stringify(updatedUser));
                }}
                onLogout={() => {
                  setCurrentUser(null);
                  localStorage.removeItem('bjj_user');
                }}
                onBack={() => setActiveTab('dashboard')}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )}
            {activeTab === 'follow_up' && currentUser && (
              <FollowUpPage
                academies={academies}
                visits={visits}
                events={events}
                vendedores={sellers}
                currentUser={currentUser}
                onAcademyCreated={() => queryClient.invalidateQueries({ queryKey: ['academies'] })}
              />
            )}
            {activeTab === 'meetings' && currentUser && (
              <MeetingsPage
                academies={academies}
                currentUser={currentUser}
              />
            )}


          </Suspense>
        </div>
      </main>

      {/* Mobile Bottom Nav - Only for Salesperson & Call-Center */}
      {
        (currentUser.role === UserRole.SALES || currentUser.role === UserRole.CALL_CENTER) && (
          <MobileBottomNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            userRole={currentUser.role}
            followUpOverdueCount={followUpOverdueCount}
          />
        )
      }

      {/* Global Loading Overlay */}
      <LoadingOverlay />

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          style: {
            background: '#1f2937',
            color: '#fff',
            border: '1px solid #374151',
          },
        }}
      />
    </div>
  );
};

// Wrapper principal com ElevationProvider
const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Carregar usuário do localStorage
  useEffect(() => {
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

  return (
    <LoadingProvider>
      <ElevationProvider userId={currentUser?.id || null}>
        <AppContent />
      </ElevationProvider>
    </LoadingProvider>
  );
};

export default App;