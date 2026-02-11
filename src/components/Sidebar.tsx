import React from 'react';
import {
  Menu,
  Building2,
  BarChart3,
  CalendarDays,
  Wallet,
  FileBarChart,
  Shield,
  LogOut,
  X
} from 'lucide-react';
import { User, UserRole } from '../types';
import pkg from '../../package.json';

const { version } = pkg;

interface SidebarProps {
  currentUser: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  logout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  sidebarOpen,
  setSidebarOpen,
  logout
}) => {

  const SidebarItem = ({ id, icon: Icon, label }: { id: string, icon: any, label: string }) => {
    // Logic for 'events' highlighting when in detail view moved here or kept simple
    // Original: const isActive = activeTab === id || (id === 'events' && activeTab === 'event_detail_admin');
    // We will pass the exact activeTab, so we can keep the logic simple or duplicate it.
    // Let's replicate the logic from App.tsx loosely or expect the parent to manage 'active' state purely on id.
    // HACK: To maintain the "events" highlighing when inside "event_detail_admin", we check it here.
    const isActive = activeTab === id || (id === 'events' && activeTab === 'event_detail_admin');

    return (
      <button
        onClick={() => { setActiveTab(id); setSidebarOpen(false); }}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive
          ? 'bg-white text-neutral-900 shadow-lg'
          : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
          }`}
      >
        <Icon size={16} strokeWidth={1.5} />
        <span className="text-sm font-medium">{label}</span>
      </button>
    );
  };

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-neutral-900 text-white transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} print:hidden`}>
      <div className="flex flex-col h-full p-4">
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center space-x-3">
            <img src="/oss_logo1.png" alt="Logo" className="w-10 h-10 object-contain mix-blend-screen" />
            <span className="text-lg font-semibold tracking-tight">BJJVisits</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden"><X size={20} strokeWidth={1.5} /></button>
        </div>
        <nav className="flex-1 space-y-1">
          {currentUser.role === UserRole.ADMIN ? (
            <>
              <SidebarItem id="dashboard" icon={BarChart3} label="Dashboard" />
              <SidebarItem id="academies" icon={Building2} label="Academias" />
              <SidebarItem id="events" icon={CalendarDays} label="Eventos" />
              <SidebarItem id="admin_finance" icon={Wallet} label="Financeiro" />
              <SidebarItem id="reports" icon={FileBarChart} label="Relatórios" />
              <SidebarItem id="access_control" icon={Shield} label="Gestão de Acessos" />
            </>
          ) : (
            <>
              <SidebarItem id="my_events" icon={CalendarDays} label="Meus Eventos" />
              <SidebarItem id="sales_finance" icon={Wallet} label="Meu Financeiro" />
            </>
          )}
        </nav>
        <div className="pt-4 border-t border-neutral-800 space-y-4">
          <div className="px-4 py-2">
            <p className="text-xs text-neutral-400 font-medium uppercase tracking-wider mb-1">Logado como</p>
            <p className="text-sm font-semibold truncate">{currentUser.name}</p>
            <p className="text-[10px] text-neutral-400 font-bold">{currentUser.role}</p>
            <p className="text-[10px] text-neutral-500 font-mono mt-1" title={`Version ${version}`}>v{version}</p>
          </div>
          <button onClick={logout} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut size={16} strokeWidth={1.5} />
            <span className="text-sm font-medium">Sair</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
