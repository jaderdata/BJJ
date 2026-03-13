import React, { useState } from 'react';
import {
    Plus,
    Trash2,
    X,
    Image as ImageIcon,
    Upload
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
import { toast } from 'sonner';
import { useLoading } from '../contexts/LoadingContext';

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
    const { withLoading } = useLoading();
    const [showModal, setShowModal] = useState(false);
    const [showAddVendorModal, setShowAddVendorModal] = useState(false);
    const [newEvent, setNewEvent] = useState<Partial<Event>>({
        status: EventStatus.UPCOMING,
        academiesIds: [],
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // States for sorting and filtering
    const [sortBy, setSortBy] = useState<'date' | 'alpha'>('date');
    const [hideFinished, setHideFinished] = useState(true);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Por favor, selecione apenas arquivos de imagem.');
                return;
            }
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('A imagem deve ter no máximo 5MB.');
                return;
            }
            setSelectedPhoto(file);
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemovePhoto = () => {
        setSelectedPhoto(null);
        setPhotoPreview(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEvent.name || !newEvent.address || !newEvent.city || !newEvent.state || !newEvent.startDate || !newEvent.endDate) {
            toast.error("Preencha todos os campos obrigatórios");
            return;
        }

        if (!selectedPhoto) {
            toast.error("Por favor, adicione uma foto do evento.");
            return;
        }

        await withLoading(async () => {
            try {
                setIsUploading(true);
                const loadingToast = toast.loading('Criando evento...');

                // Upload photo first
                let photoUrl: string | undefined;
                if (selectedPhoto) {
                    photoUrl = await DatabaseService.uploadEventPhoto(selectedPhoto);
                }

                // Create event with photo URL
                const created = await DatabaseService.createEvent({
                    ...newEvent,
                    photoUrl
                });
                setEvents((prev: Event[]) => [created, ...prev]);

                if (created.salespersonIds && created.salespersonIds.length > 0) {
                    created.salespersonIds.forEach(id => {
                        notifyUser(id, `Você foi atribuído ao novo evento "${created.name}".`);
                    });
                }

                toast.success('Evento criado com sucesso!', { id: loadingToast });
                setShowModal(false);
                setNewEvent({
                    status: EventStatus.UPCOMING,
                    academiesIds: [],
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: new Date().toISOString().split('T')[0]
                });
                setSelectedPhoto(null);
                setPhotoPreview(null);
            } catch (error: any) {
                console.error("Error creating event:", error);
                toast.error(`Erro ao criar evento: ${error.message}`);
            } finally {
                setIsUploading(false);
            }
        });
    };

    const handleAddVendor = (vendorId: string) => {
        if (!newEvent.salespersonIds?.includes(vendorId)) {
            setNewEvent({
                ...newEvent,
                salespersonIds: [...(newEvent.salespersonIds || []), vendorId]
            });
        }
        setShowAddVendorModal(false);
    };

    const handleRemoveVendor = (vendorId: string) => {
        setNewEvent({
            ...newEvent,
            salespersonIds: (newEvent.salespersonIds || []).filter(id => id !== vendorId)
        });
    };

    const handleDeleteEvent = async (e: React.MouseEvent, eventId: string, eventName: string) => {
        e.stopPropagation();
        if (window.confirm(`Deseja realmente excluir o evento "${eventName}"?`)) {
            await withLoading(async () => {
                try {
                    const loadingToast = toast.loading('Excluindo evento...');
                    const eventToDelete = events.find(ev => ev.id === eventId);
                    await DatabaseService.deleteEvent(eventId);
                    setEvents((prev: Event[]) => prev.filter(ev => ev.id !== eventId));

                    if (eventToDelete?.salespersonIds && eventToDelete.salespersonIds.length > 0) {
                        eventToDelete.salespersonIds.forEach(id => {
                            notifyUser(id, `O evento "${eventName}" foi removido pelo administrador.`);
                        });
                    }

                    toast.success(`Evento "${eventName}" excluído com sucesso!`, { id: loadingToast });
                } catch (error) {
                    console.error("Error deleting event:", error);
                    toast.error("Erro ao excluir evento");
                }
            });
        }
    };

    return (
        <div className="space-y-6 p-4">
            {/* Header */}
            <div className="relative overflow-hidden bg-neutral-900 border border-white/10 p-6 rounded-md shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent backdrop-blur-sm"></div>
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

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                        <div className="flex items-center space-x-2 bg-black/20 p-1.5 rounded-sm border border-white/10">
                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value as 'date' | 'alpha')}
                                className="bg-transparent text-white text-sm px-3 py-2 outline-none font-medium cursor-pointer"
                            >
                                <option value="date" className="bg-neutral-800">Mais Próximo</option>
                                <option value="alpha" className="bg-neutral-800">Ordem Alfabética</option>
                            </select>

                            <div className="w-px h-6 bg-white/10 mx-2"></div>

                            <label className="flex items-center space-x-2 px-3 py-2 cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={hideFinished}
                                        onChange={(e) => setHideFinished(e.target.checked)}
                                        className="sr-only"
                                    />
                                    <div className={`w-8 h-4 bg-white/10 rounded-full transition-colors ${hideFinished ? 'bg-amber-500/50' : ''}`}></div>
                                    <div className={`absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${hideFinished ? 'translate-x-4' : ''}`}></div>
                                </div>
                                <span className="text-white/80 text-xs font-bold uppercase tracking-wider group-hover:text-white transition-colors select-none">
                                    Ocultar Encerrados
                                </span>
                            </label>
                        </div>

                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-white/10 backdrop-blur-md border-2 border-white/20 text-white px-4 py-2 rounded-sm font-bold flex items-center justify-center space-x-2 hover:bg-white/20 transition-all"
                        >
                            <Plus size={18} strokeWidth={2} />
                            <span>Novo Evento</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {events
                    .filter(e => {
                        if (!hideFinished) return true;
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const endDate = new Date(e.endDate);
                        endDate.setHours(0, 0, 0, 0);
                        return today <= endDate; // Return only events that end today or in the future
                    })
                    .sort((a, b) => {
                        if (sortBy === 'date') {
                            return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
                        } else {
                            return a.name.localeCompare(b.name);
                        }
                    })
                    .map(e => {
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
                                className="group relative overflow-hidden rounded-md shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer h-64"
                            >
                                {/* Background Image */}
                                {e.photoUrl ? (
                                    <div
                                        className="absolute inset-0 bg-contain bg-center bg-no-repeat transition-transform duration-500 group-hover:scale-105"
                                        style={{ backgroundImage: `url(${e.photoUrl})` }}
                                    />
                                ) : (
                                    <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-900" />
                                )}

                                {/* Dark Overlay - Hidden by default on desktop, visible on hover. Always visible on mobile */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-black/40 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-500" />

                                {/* Glow effect */}
                                <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                {/* Top Badges - Always visible */}
                                <div className="absolute top-0 left-0 right-0 z-20 p-5 flex justify-between items-start">
                                    <span className={`text-xs font-black px-3 py-1.5 rounded-sm uppercase backdrop-blur-md ${isExpired ? 'bg-white/10 text-white/60 border border-white/20' :
                                        isOngoing ? 'bg-amber-500/30 text-amber-300 border border-amber-400/50' :
                                            'bg-blue-500/30 text-blue-300 border border-blue-400/50'
                                        }`}>
                                        {isExpired ? 'Encerrado' : isOngoing ? 'Em Andamento' : diffDays === 0 ? 'Hoje' : diffDays === 1 ? 'Amanhã' : `${diffDays} dias`}
                                    </span>
                                    <button
                                        onClick={(ev) => handleDeleteEvent(ev, e.id, e.name)}
                                        className="p-2 text-white/80 hover:text-red-400 hover:bg-red-500/30 backdrop-blur-md rounded-sm transition-all border border-white/20 hover:border-red-400/50"
                                    >
                                        <Trash2 size={16} strokeWidth={2.5} />
                                    </button>
                                </div>

                                {/* Event Info - Hidden on desktop, visible on hover. Always visible on mobile */}
                                <div className="absolute bottom-0 left-0 right-0 z-10 p-5 opacity-100 translate-y-0 md:opacity-0 md:translate-y-4 md:group-hover:opacity-100 md:group-hover:translate-y-0 transition-all duration-500">
                                    {/* Event Name */}
                                    <h4 className="text-xl font-black text-white mb-2 leading-tight drop-shadow-lg line-clamp-2">
                                        {e.name}
                                    </h4>

                                    {/* Location */}
                                    <div className="flex items-center space-x-2 text-sm text-white/90 mb-3 font-bold drop-shadow-md">
                                        <span>{e.city} - {e.state}</span>
                                    </div>

                                    {e.salespersonIds && e.salespersonIds.length > 0 && (
                                        <div className="flex flex-wrap gap-2 text-xs text-white/80 mb-2 font-bold drop-shadow-md">
                                            {e.salespersonIds.map(id => (
                                                <span key={id} className="bg-white/10 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
                                                    {vendedores.find(v => v.id === id)?.name || 'Vendedor Desconhecido'}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Date */}
                                    <div className="flex items-center space-x-2 text-xs font-bold text-white/80 mb-4 drop-shadow-md">
                                        <span>
                                            {e.startDate === e.endDate
                                                ? new Date(e.startDate).toLocaleDateString('pt-BR')
                                                : `${new Date(e.startDate).toLocaleDateString('pt-BR')} - ${new Date(e.endDate).toLocaleDateString('pt-BR')}`
                                            }
                                        </span>
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center justify-between text-xs mb-2">
                                        <div className="flex items-center space-x-1 text-white/90 font-bold drop-shadow-md">
                                            <span>{totalAcademies} Academias</span>
                                        </div>
                                        <span className="text-lg font-black text-white drop-shadow-lg">{progress}%</span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="h-2.5 bg-black/40 backdrop-blur-sm rounded-full overflow-hidden border border-white/20 shadow-lg">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 shadow-lg ${progress === 100
                                                ? 'bg-gradient-to-r from-amber-500 to-teal-500'
                                                : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                                                }`}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
                    <div className="bg-gradient-to-br from-white/10 to-white/[0.02] backdrop-blur-xl border border-white/20 rounded-md w-full max-w-2xl shadow-2xl overflow-hidden">
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
                                className="w-full px-4 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all text-sm font-medium"
                                onChange={e => setNewEvent({ ...newEvent, name: e.target.value })}
                            />

                            <input
                                type="text"
                                placeholder="Endereço do Evento"
                                className="w-full px-4 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all text-sm font-medium"
                                onChange={e => setNewEvent({ ...newEvent, address: e.target.value })}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/60 uppercase tracking-wider ml-1">Cidade</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Orlando"
                                        className="w-full px-4 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all text-sm font-medium"
                                        onChange={e => setNewEvent({ ...newEvent, city: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/60 uppercase tracking-wider ml-1">UF</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: FL"
                                        maxLength={2}
                                        className="w-full px-4 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all text-sm font-medium"
                                        onChange={e => setNewEvent({ ...newEvent, state: e.target.value.toUpperCase() })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/60 uppercase tracking-wider ml-1">Data Início</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-sm text-white focus:outline-none focus:ring-2 focus:ring-white/30 transition-all text-sm font-medium"
                                        value={newEvent.startDate}
                                        onChange={e => setNewEvent({ ...newEvent, startDate: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/60 uppercase tracking-wider ml-1">Data Fim</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-sm text-white focus:outline-none focus:ring-2 focus:ring-white/30 transition-all text-sm font-medium"
                                        value={newEvent.endDate}
                                        onChange={e => setNewEvent({ ...newEvent, endDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-white/60 uppercase tracking-wider ml-1">
                                        Vendedores Responsáveis (Opcional)
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddVendorModal(true)}
                                        className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold uppercase px-3 py-1.5 rounded-sm flex items-center transition-all border border-white/10"
                                    >
                                        <Plus size={14} strokeWidth={1.5} className="mr-1.5" /> Adicionar Vendedor
                                    </button>
                                </div>

                                <div className="bg-white/5 backdrop-blur-md rounded-sm border border-white/10 overflow-hidden">
                                    <div className="divide-y divide-white/5">
                                        {newEvent.salespersonIds && newEvent.salespersonIds.length > 0 ? (
                                            newEvent.salespersonIds.map(id => {
                                                const vendor = vendedores.find(v => v.id === id);
                                                return (
                                                    <div key={id} className="p-3 flex justify-between items-center bg-white/5 hover:bg-white/10 transition-colors">
                                                        <div>
                                                            <p className="font-bold text-white text-sm">{vendor?.name || 'Vendedor Desconhecido'}</p>
                                                            <p className="text-[10px] text-white/60">{vendor?.city ? `${vendor.city} - ` : ''}{vendor?.email}</p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveVendor(id)}
                                                            className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/20 rounded-sm transition-colors"
                                                            title="Remover Vendedor"
                                                        >
                                                            <Trash2 size={14} strokeWidth={1.5} />
                                                        </button>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="p-4 text-center text-white/40 text-xs italic">Nenhum vendedor selecionado.</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Photo Upload Section */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-white/60 uppercase tracking-wider ml-1">
                                    Foto do Evento *
                                </label>

                                {!photoPreview ? (
                                    <label className="w-full flex flex-col items-center justify-center px-4 py-8 bg-white/5 backdrop-blur-md border-2 border-dashed border-white/20 rounded-sm cursor-pointer hover:bg-white/10 hover:border-white/30 transition-all group">
                                        <div className="flex flex-col items-center space-y-2">
                                            <div className="p-3 bg-gradient-to-br from-blue-500/20 to-amber-500/20 rounded-sm group-hover:scale-110 transition-transform">
                                                <ImageIcon size={32} className="text-blue-400" strokeWidth={2} />
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Upload size={16} className="text-white/60" />
                                                <span className="text-sm font-bold text-white/80">Clique para adicionar foto</span>
                                            </div>
                                            <span className="text-xs text-white/40">PNG, JPG ou WEBP (máx. 5MB)</span>
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handlePhotoChange}
                                            className="hidden"
                                        />
                                    </label>
                                ) : (
                                    <div className="relative w-full h-48 bg-white/5 backdrop-blur-md border border-white/10 rounded-sm overflow-hidden group">
                                        <img
                                            src={photoPreview}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                                type="button"
                                                onClick={handleRemovePhoto}
                                                className="px-4 py-2 bg-red-500/90 hover:bg-red-600 text-white rounded-sm font-bold flex items-center space-x-2 transition-all"
                                            >
                                                <Trash2 size={16} />
                                                <span>Remover Foto</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isUploading}
                                className="w-full bg-gradient-to-r from-amber-600 to-teal-600 hover:from-amber-500 hover:to-teal-500 text-white px-4 py-3 rounded-sm font-bold transition-all shadow-lg hover:shadow-amber-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                            >
                                {isUploading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Enviando...</span>
                                    </>
                                ) : (
                                    <span>Criar Evento</span>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showAddVendorModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[110]">
                    <div className="bg-neutral-800 rounded-md w-full max-w-md shadow-2xl border border-neutral-700 overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="p-6 border-b border-neutral-700 flex justify-between items-center bg-neutral-800/50">
                            <div>
                                <h3 className="text-xl font-bold text-white">Selecionar Vendedor</h3>
                                <p className="text-xs text-neutral-400 mt-1">
                                    Quem será responsável por este evento?
                                </p>
                            </div>
                            <button
                                onClick={() => setShowAddVendorModal(false)}
                                className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded-sm transition-colors"
                            >
                                <X size={18} strokeWidth={1.5} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-neutral-900/20">
                            {vendedores.filter(v => !newEvent.salespersonIds?.includes(v.id)).length > 0 ? (
                                vendedores.filter(v => !newEvent.salespersonIds?.includes(v.id)).map(v => (
                                    <button
                                        key={v.id}
                                        type="button"
                                        onClick={() => handleAddVendor(v.id)}
                                        className="w-full p-4 flex justify-between items-center bg-neutral-800/50 border border-neutral-700 hover:border-amber-500 transition-all rounded-md group text-left"
                                    >
                                        <div>
                                            <p className="font-bold text-white">{v.name}</p>
                                            <p className="text-[10px] text-neutral-400 mt-1">{v.city ? `${v.city} - ` : ''}{v.email}</p>
                                        </div>
                                        <div className="bg-neutral-900 p-2 rounded-sm text-neutral-500 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                                            <Plus size={16} strokeWidth={2} />
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="p-8 text-center text-neutral-500 text-sm italic">Todos os vendedores já foram selecionados.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
