import React from 'react';
import { X } from 'lucide-react';
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
  followUpOverdueCount?: number;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  sidebarOpen,
  setSidebarOpen,
  logout,
  followUpOverdueCount = 0
}) => {

  const SidebarItem = ({ id, label, badge }: { id: string, label: string, badge?: number }) => {
    const isActive = activeTab === id || (id === 'events' && activeTab === 'event_detail_admin');

    return (
      <button
        onClick={() => { setActiveTab(id); setSidebarOpen(false); }}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-sm transition-colors ${isActive
          ? 'bg-white text-neutral-900 shadow-lg'
          : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
          }`}
      >
        <span className="text-sm font-medium">{label}</span>
        {badge != null && badge > 0 && (
          <span className="min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center leading-none">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
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
              <SidebarItem id="dashboard" label="Dashboard" />
              <SidebarItem id="academies" label="Academias" />
              <SidebarItem id="events" label="Eventos" />
              <SidebarItem id="admin_finance" label="Financeiro" />
              <SidebarItem id="reports" label="Relatórios" />
              <SidebarItem id="follow_up" label="Follow-Up" badge={followUpOverdueCount} />
              <SidebarItem id="vendors" label="Vendedores" />
              <SidebarItem id="access_control" label="Gestão de Acessos" />
            </>
          ) : (
            <>
              <SidebarItem id="my_events" label="Meus Eventos" />
              <SidebarItem id="sales_finance" label="Meu Financeiro" />
              <SidebarItem id="profile" label="Perfil" />
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
          {currentUser.role === UserRole.ADMIN && (
            <button onClick={logout} className="w-full flex items-center space-x-3 px-4 py-3 rounded-sm text-red-400 hover:bg-red-500/10 transition-colors">
              <span className="text-sm font-medium">Sair</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
