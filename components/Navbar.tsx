import React from 'react';
import { Menu } from 'lucide-react';

interface NavbarProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    activeTab: string;
}

const Navbar: React.FC<NavbarProps> = ({ setSidebarOpen, activeTab }) => {
    return (
        <header className="h-16 bg-neutral-800 border-b border-neutral-700 flex items-center justify-between px-6 shrink-0 print:hidden text-white">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-neutral-400 hover:text-white"><Menu size={20} strokeWidth={1.5} /></button>
            <h2 className="text-lg font-bold text-white">
                {activeTab === 'dashboard' && 'Visão Geral'}
                {activeTab === 'academies' && 'Gerenciar Academias'}
                {activeTab === 'events' && 'Gerenciar Eventos'}
                {activeTab === 'admin_finance' && 'Controle Financeiro'}
                {activeTab === 'reports' && 'Relatórios e KPIs'}
                {activeTab === 'logs' && 'Logs do Sistema'}
                {activeTab === 'my_events' && 'Meus Eventos Atribuídos'}
                {activeTab === 'sales_finance' && 'Meu Extrato'}
                {activeTab === 'visit_detail' && 'Execução de Visita'}
                {activeTab === 'event_detail_admin' && 'Detalhes do Evento'}
            </h2>
            <div className="flex items-center space-x-4">
                <span className="hidden sm:block text-xs font-medium text-neutral-400">
                    {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
            </div>
        </header>
    );
};

export default Navbar;
