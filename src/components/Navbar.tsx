import React from 'react';
import { Menu, Shield, Unlock } from 'lucide-react';
import { useElevation } from '../contexts/ElevationContext';

interface NavbarProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    activeTab: string;
    onOpenElevationPrompt: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ setSidebarOpen, activeTab, onOpenElevationPrompt }) => {
    const { isElevated } = useElevation();

    return (
        <header className="h-16 bg-neutral-800 border-b border-neutral-700 flex items-center justify-between px-6 shrink-0 print:hidden text-white transition-colors">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-neutral-400 hover:text-white"><Menu size={20} strokeWidth={1.5} /></button>
            <h2 className="text-lg font-bold text-white flex items-center">
                {activeTab === 'dashboard' && 'Visão Geral'}
                {activeTab === 'access_control' && 'Gestão de Acessos'}
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
                {!isElevated && (
                    <button
                        onClick={onOpenElevationPrompt}
                        className="flex items-center space-x-2 px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-neutral-300 rounded-lg text-xs font-bold transition-all border border-neutral-600 hover:border-neutral-500"
                        title="Ativar privilégios administrativos temporários"
                    >
                        <Shield size={14} />
                        <span className="hidden sm:inline">Modo Admin</span>
                    </button>
                )}

                <span className="hidden sm:block text-xs font-medium text-neutral-400 border-l border-neutral-700 pl-4">
                    {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
            </div>
        </header>
    );
};

export default Navbar;
