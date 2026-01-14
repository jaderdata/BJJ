import React, { useState } from 'react';
import {
    CalendarDays,
    Plus,
    Trash2,
    X,
    MapPin,
    Users as UsersIcon,
    TrendingUp
} from 'lucide-react';
import {
    Event,
    EventStatus,
    Visit,
    VisitStatus,
    Academy,
    User
} from '../types';
import { DatabaseService } from '../lib/supabase';

interface EventsManagerProps {
    events: Event[];
    visits: Visit[];
    setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
    academies: Academy[];
    vendedores: User[];
    onSelectEvent: (eventId: string) => void;
    notifyUser: (uid: string, msg: string) => void;
}

export const EventsManager: React.FC<EventsManagerProps> = ({
    events,
    visits,
    setEvents,
    academies,
    vendedores,
    onSelectEvent,
    notifyUser
}) => {
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
            alert("Preencha todos os campos obrigatórios");
            return;
        }

        try {
            const created = await DatabaseService.createEvent(newEvent);
            setEvents((prev: Event[]) => [created, ...prev]);

            if (created.salespersonId) {
                notifyUser(created.salespersonId, `Você foi atribuído ao novo evento "${created.name}".`);
            }

            setShowModal(false);
            setNewEvent({
                status: EventStatus.UPCOMING,
                academiesIds: [],
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0]
            });
        } catch (error: any) {
            console.error("Error creating event:", error);
            alert(`Erro ao criar evento: ${error.message}`);
        }
    };

    const handleDeleteEvent = async (e: React.MouseEvent, eventId: string, eventName: string) => {
        e.stopPropagation();
        if (window.confirm(`Deseja realmente excluir o evento "${eventName}"?`)) {
            try {
                await DatabaseService.deleteEvent(eventId);
                setEvents((prev: Event[]) => prev.filter(ev => ev.id !== eventId));
            } catch (error) {
                console.error("Error deleting event:", error);
                alert("Erro ao excluir evento");
            }
        }
    };

    return (
        <div className="space-y-6 p-4">
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[hsl(262,83%,58%)] via-[hsl(262,83%,48%)] to-[hsl(262,83%,38%)] p-6 rounded-2xl shadow-2xl">
                <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -ml-16 -mb-16"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-black text-white mb-1 tracking-tight">
                            Gerenciamento de Eventos
                        </h1>
                        <p className="text-white/80 text-sm font-medium">
                            Gestão de eventos e distribuição de vendedores
                        </p>
                    </div>

                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-white/10 backdrop-blur-md border-2 border-white/20 text-white px-4 py-2 rounded-xl font-bold flex items-center space-x-2 hover:bg-white/20 transition-all"
                    >
                        <Plus size={18} strokeWidth={2} />
                        <span>Novo Evento</span>
                    </button>
                </div>
            </div>

            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {events.map(e => {
                    const totalAcademies = e.academiesIds.length;
                    const completedVisits = e.academiesIds.filter(aid =>
                        visits.some(v => v.eventId === e.id && v.academyId === aid && v.status === VisitStatus.VISITED)
                    ).length;
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
                        <div
                            key={e.id}
                            onClick={() => onSelectEvent(e.id)}
                            className="group relative overflow-hidden bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer"
                        >
                            {/* Glow effect */}
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                            <div className="relative z-10">
                                {/* Header */}
                                <div className="flex justify-between items-start mb-3">
                                    <span className={`text-xs font-black px-2 py-1 rounded-lg uppercase ${isExpired ? 'bg-white/10 text-white/40' :
                                        isOngoing ? 'bg-emerald-500/20 text-emerald-400' :
                                            'bg-blue-500/20 text-blue-400'
                                        }`}>
                                        {isExpired ? 'Encerrado' : isOngoing ? 'Em Andamento' : 'Próximo'}
                                    </span>
                                    <button
                                        onClick={(ev) => handleDeleteEvent(ev, e.id, e.name)}
                                        className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-all"
                                    >
                                        <Trash2 size={14} strokeWidth={2} />
                                    </button>
                                </div>

                                {/* Content */}
                                <h4 className="text-lg font-black text-white mb-1">{e.name}</h4>

                                <div className="flex items-center space-x-2 text-xs text-white/60 mb-3">
                                    <span className="font-bold">{e.city} - {e.state}</span>
                                </div>

                                <div className="flex items-center space-x-2 text-xs font-bold text-white/60 mb-4">
                                    <span>
                                        {e.startDate === e.endDate
                                            ? new Date(e.startDate).toLocaleDateString('pt-BR')
                                            : `${new Date(e.startDate).toLocaleDateString('pt-BR')} - ${new Date(e.endDate).toLocaleDateString('pt-BR')}`
                                        }
                                    </span>
                                </div>

                                {/* Stats */}
                                <div className="flex items-center justify-between text-xs mb-2">
                                    <div className="flex items-center space-x-1 text-white/60">
                                        <span className="font-bold">{totalAcademies} Academias</span>
                                    </div>
                                    <span className="text-base font-black text-white">{progress}%</span>
                                </div>

                                {/* Progress Bar */}
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-1000"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
                    <div className="bg-gradient-to-br from-white/10 to-white/[0.02] backdrop-blur-xl border border-white/20 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center">
                            <h3 className="text-xl font-black text-white">Novo Evento</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-white/60 hover:text-white transition-colors"
                            >
                                <X size={20} strokeWidth={2} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <input
                                type="text"
                                placeholder="Nome do Evento"
                                className="w-full px-4 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all text-sm font-medium"
                                onChange={e => setNewEvent({ ...newEvent, name: e.target.value })}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/60 uppercase tracking-wider ml-1">Cidade</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Orlando"
                                        className="w-full px-4 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all text-sm font-medium"
                                        onChange={e => setNewEvent({ ...newEvent, city: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/60 uppercase tracking-wider ml-1">UF</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: FL"
                                        maxLength={2}
                                        className="w-full px-4 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all text-sm font-medium"
                                        onChange={e => setNewEvent({ ...newEvent, state: e.target.value.toUpperCase() })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/60 uppercase tracking-wider ml-1">Data Início</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/30 transition-all text-sm font-medium"
                                        value={newEvent.startDate}
                                        onChange={e => setNewEvent({ ...newEvent, startDate: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/60 uppercase tracking-wider ml-1">Data Fim</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/30 transition-all text-sm font-medium"
                                        value={newEvent.endDate}
                                        onChange={e => setNewEvent({ ...newEvent, endDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-white/60 uppercase tracking-wider ml-1">Vendedor Responsável (Opcional)</label>
                                <select
                                    className="w-full px-4 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/30 transition-all text-sm font-medium"
                                    onChange={e => setNewEvent({ ...newEvent, salespersonId: e.target.value || undefined })}
                                >
                                    <option value="" className="bg-[hsl(222,47%,15%)]">Vincular depois...</option>
                                    {vendedores.map(v => (
                                        <option key={v.id} value={v.id} className="bg-[hsl(222,47%,15%)]">
                                            {v.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-emerald-500/50"
                            >
                                Criar Evento
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
