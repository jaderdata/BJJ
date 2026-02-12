import React, { useState, useMemo } from 'react';
import {
    ChevronLeft,
    Edit3,
    Upload,
    Trash2,
    Image as ImageIcon,
    Loader2,
    Plus,
    Search,
    CheckCircle2,
    Info,
    X,
    ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { useLoading } from '../contexts/LoadingContext';

import {
    Event,
    Academy,
    Visit,
    User,
    EventStatus,
    VisitStatus,
    AcademyTemperature,
} from '../types';
import { DatabaseService } from '../lib/supabase';

interface EventDetailAdminProps {
    event: Event;
    academies: Academy[];
    visits: Visit[];
    vendedores: User[];
    onBack: () => void;
    onUpdateEvent: (event: Event) => Promise<void> | void;
    notifyUser: (uid: string, msg: string) => void;
    events: Event[];
}

export const EventDetailAdmin: React.FC<EventDetailAdminProps> = ({ event, academies, visits, vendedores, onBack, onUpdateEvent, notifyUser, events }) => {
    const { withLoading } = useLoading();
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [cityFilter, setCityFilter] = useState('');
    const [stateFilter, setStateFilter] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<Event>>({ ...event });
    const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(event.photoUrl || null);
    const [isUploading, setIsUploading] = useState(false);

    const eventAcademies = academies.filter(a => event.academiesIds.includes(a.id));

    const finishedVisitIds = visits.filter(v => v.eventId === event.id && v.status === VisitStatus.VISITED).map(v => v.academyId);
    const pendingAcademies = eventAcademies.filter(a => !finishedVisitIds.includes(a.id));

    // Finished academies are those currently in the event AND finished, 
    // PLUS those that finished a visit but are no longer in the active list (soft-deleted)
    const finishedAcademies = academies.filter(a => finishedVisitIds.includes(a.id));

    // Available = not in event AND matches search AND matches filters
    const availableAcademies = useMemo(() => {
        return academies.filter(a => {
            // Regra de Vínculo Único: Não pode estar no evento atual nem em NENHUM outro
            const isLinkedAnywhere = events.some(e => e.academiesIds.includes(a.id));
            if (isLinkedAnywhere) return false;

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
        // Garantir IDs únicos para evitar duplicidade acidental no estado local
        const newAcademiesIds = Array.from(new Set([...event.academiesIds, ...selectedIds]));
        onUpdateEvent({ ...event, academiesIds: newAcademiesIds });
        toast.success(`${selectedIds.length} academia(s) vinculada(s) com sucesso!`);
        setSelectedIds([]);
        setShowAddModal(false);
    };

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleRemoveAcademy = (academyId: string) => {
        const academy = academies.find(a => a.id === academyId);
        if (window.confirm(`Deseja remover "${academy?.name}" deste evento?`)) {
            onUpdateEvent({ ...event, academiesIds: event.academiesIds.filter(id => id !== academyId) });
            toast.success(`Academia "${academy?.name}" removida do evento.`);
        }
    };

    const handleSalespersonChange = (newSalespersonId: string) => {
        const oldSalespersonId = event.salespersonId;
        const newSalesperson = vendedores.find(v => v.id === newSalespersonId);

        onUpdateEvent({ ...event, salespersonId: newSalespersonId || undefined });

        if (newSalespersonId && newSalespersonId !== oldSalespersonId) {
            notifyUser(newSalespersonId, `Você foi atribuído ao evento "${event.name}".`);
            toast.success(`Vendedor "${newSalesperson?.name}" atribuído ao evento.`);
        } else if (!newSalespersonId && oldSalespersonId) {
            toast.info('Vendedor removido do evento.');
        }

        if (oldSalespersonId && oldSalespersonId !== newSalespersonId) {
            notifyUser(oldSalespersonId, `Você não é mais o responsável pelo evento "${event.name}".`);
        }
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error('Por favor, selecione apenas arquivos de imagem.');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error('A imagem deve ter no máximo 5MB.');
                return;
            }
            setSelectedPhoto(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
            toast.success('Foto selecionada com sucesso!');
        }
    };

    const handleRemovePhoto = () => {
        setSelectedPhoto(null);
        setPhotoPreview(event.photoUrl || null);
        toast.info('Foto removida. A foto original será mantida se você não selecionar outra.');
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editForm.name || !editForm.address || !editForm.city || !editForm.state || !editForm.startDate || !editForm.endDate) {
            toast.error("Preencha todos os campos obrigatórios");
            return;
        }

        setIsUploading(true);
        const loadingToast = toast.loading('Salvando alterações...');

        await withLoading(async () => {
            try {
                let photoUrl = editForm.photoUrl;

                // Upload new photo if selected
                if (selectedPhoto) {
                    photoUrl = await DatabaseService.uploadEventPhoto(selectedPhoto);
                    // Delete old photo if exists and is different
                    if (event.photoUrl && event.photoUrl !== photoUrl) {
                        await DatabaseService.deleteEventPhoto(event.photoUrl);
                    }
                }

                await onUpdateEvent({ ...editForm, photoUrl } as Event);
                toast.success('Evento atualizado com sucesso!', { id: loadingToast });
                setIsEditing(false);
                setSelectedPhoto(null);
            } catch (error: any) {
                console.error('Error updating event:', error);
                toast.error(`Erro ao atualizar evento: ${error.message}`, { id: loadingToast });
            } finally {
                setIsUploading(false);
            }
        });
    };

    const handleFinishVisitFromAdmin = async (visit: Visit) => {
        if (!visit.contactPerson || !visit.temperature) {
            toast.error("A visita precisa ter informações básicas preenchidas (contato e temperatura).");
            return;
        }

        await withLoading(async () => {
            try {
                const updatedVisit = {
                    ...visit,
                    status: VisitStatus.VISITED,
                    finishedAt: new Date().toISOString() // Sempre captura horário atual
                };

                await DatabaseService.upsertVisit(updatedVisit);
                toast.success('Visita finalizada com sucesso!');

                // Atualizar a lista de visitas localmente
                onUpdateEvent({ ...event }); // Trigger reload
                setSelectedVisit(null);
            } catch (error: any) {
                console.error('Error finishing visit:', error);
                toast.error(`Erro ao finalizar visita: ${error.message}`);
            }
        });
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
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-bold text-neutral-500 uppercase ml-1">Endereço</label>
                                    <input type="text" value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} className="w-full bg-neutral-900 border border-neutral-700 p-3 rounded-xl text-white outline-none focus:border-white" />
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

                                <div className="md:col-span-2 flex items-center bg-neutral-900 border border-neutral-700 p-4 rounded-xl mt-2">
                                    <input
                                        type="checkbox"
                                        id="isTest"
                                        checked={editForm.isTest}
                                        onChange={e => setEditForm({ ...editForm, isTest: e.target.checked })}
                                        className="w-5 h-5 rounded border-neutral-700 bg-neutral-800 text-blue-600 focus:ring-offset-neutral-900"
                                    />
                                    <label htmlFor="isTest" className="ml-3 cursor-pointer">
                                        <div className="text-sm font-bold text-white flex items-center gap-2">
                                            🧪 Modo Sandbox
                                        </div>
                                        <div className="text-[10px] text-neutral-500">
                                            Eventos de teste são ignorados nas métricas de tempo e contagem de vouchers.
                                        </div>
                                    </label>
                                </div>

                                {/* Photo Upload Section */}
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-bold text-neutral-500 uppercase ml-1 mb-2 block">
                                        Foto do Evento
                                    </label>

                                    {photoPreview ? (
                                        <div className="relative w-full h-64 bg-neutral-900 border border-neutral-700 rounded-xl overflow-hidden group">
                                            <img
                                                src={photoPreview}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                <label className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold flex items-center space-x-2 transition-all cursor-pointer">
                                                    <Upload size={16} />
                                                    <span>Alterar Foto</span>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handlePhotoChange}
                                                        className="hidden"
                                                    />
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={handleRemovePhoto}
                                                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold flex items-center space-x-2 transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                    <span>Remover</span>
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <label className="w-full flex flex-col items-center justify-center px-4 py-12 bg-neutral-900 border-2 border-dashed border-neutral-700 rounded-xl cursor-pointer hover:bg-neutral-800 hover:border-neutral-600 transition-all group">
                                            <div className="flex flex-col items-center space-y-2">
                                                <div className="p-3 bg-blue-900/30 rounded-xl group-hover:scale-110 transition-transform">
                                                    <ImageIcon size={32} className="text-blue-400" strokeWidth={2} />
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Upload size={16} className="text-neutral-400" />
                                                    <span className="text-sm font-bold text-neutral-300">Clique para adicionar foto</span>
                                                </div>
                                                <span className="text-xs text-neutral-500">PNG, JPG ou WEBP (máx. 5MB)</span>
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handlePhotoChange}
                                                className="hidden"
                                            />
                                        </label>
                                    )}
                                </div>

                                <div className="md:col-span-2 flex space-x-3 pt-4">
                                    <button
                                        type="submit"
                                        disabled={isUploading}
                                        className="flex-1 bg-white hover:bg-neutral-200 text-neutral-900 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                                    >
                                        {isUploading ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                <span>Salvando...</span>
                                            </>
                                        ) : (
                                            <span>Salvar Alterações</span>
                                        )}
                                    </button>
                                    <button type="button" onClick={() => { setIsEditing(false); setSelectedPhoto(null); setPhotoPreview(event.photoUrl || null); }} className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white py-3 rounded-xl font-bold transition-all">Cancelar</button>
                                </div>
                            </form>
                        ) : (
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 bg-neutral-900/50 px-2 py-1 rounded-full">{event.status}</span>
                                        {event.isTest && (
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-900/30 border border-amber-900/50 px-2 py-1 rounded-full flex items-center gap-1">
                                                🧪 Sandbox
                                            </span>
                                        )}
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
                                                    const isLinked = event.academiesIds.includes(a.id);
                                                    return (
                                                        <div
                                                            key={a.id}
                                                            onClick={() => visit && setSelectedVisit(visit)}
                                                            className={`p-4 flex justify-between items-center transition-colors cursor-pointer ${isLinked ? 'bg-neutral-800 hover:bg-neutral-700' : 'bg-neutral-900/50 hover:bg-neutral-800 opacity-80'}`}
                                                        >
                                                            <div>
                                                                <div className="flex items-center space-x-2">
                                                                    <p className="font-bold text-white text-sm">{a.name}</p>
                                                                    {!isLinked && (
                                                                        <span className="text-[8px] font-black bg-neutral-700 text-neutral-400 px-1.5 py-0.5 rounded uppercase tracking-tighter">Inativo</span>
                                                                    )}
                                                                </div>
                                                                <p className="text-[10px] text-neutral-400">{a.city} - Resp: {a.responsible}</p>
                                                            </div>
                                                            <div className="flex items-center space-x-3">
                                                                {visit && (
                                                                    <div className="flex items-center space-x-2">
                                                                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${visit.temperature === AcademyTemperature.HOT ? 'bg-red-900/30 text-red-400' : 'bg-neutral-900/30 text-neutral-400'}`}>{visit.temperature}</span>
                                                                        <span className="bg-emerald-900/30 text-emerald-400 p-1 rounded-full px-2 py-1 font-bold text-[10px]">OK</span>
                                                                    </div>
                                                                )}
                                                                {isLinked && (
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleRemoveAcademy(a.id); }}
                                                                        className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                                                                        title="Remover Vinculo"
                                                                    >
                                                                        <Trash2 size={14} strokeWidth={1.5} />
                                                                    </button>
                                                                )}
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

                            <div className="bg-neutral-900/50 p-4 rounded-2xl border border-neutral-700/50">
                                <p className="text-[10px] font-bold text-neutral-500 uppercase mb-1">Conversa com</p>
                                <span className="text-sm font-bold text-white">
                                    {selectedVisit.contactPerson || 'Não informado'}
                                </span>
                            </div>

                            {/* Materiais de Marketing */}
                            <div className="space-y-3">
                                <p className="text-[10px] font-bold text-neutral-500 uppercase ml-1">Materiais Deixados</p>
                                <div className="flex gap-3">
                                    <div className={`flex-1 p-3 rounded-xl border flex items-center space-x-2 ${selectedVisit.leftBanner ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-neutral-900/30 border-neutral-800 text-neutral-600'}`}>
                                        <span>??</span>
                                        <span className="text-xs font-bold uppercase tracking-widest">Banner</span>
                                    </div>
                                    <div className={`flex-1 p-3 rounded-xl border flex items-center space-x-2 ${selectedVisit.leftFlyers ? 'bg-sky-500/10 border-sky-500/20 text-sky-400' : 'bg-neutral-900/30 border-neutral-800 text-neutral-600'}`}>
                                        <span>??</span>
                                        <span className="text-xs font-bold uppercase tracking-widest">Flyers</span>
                                    </div>
                                </div>
                            </div>

                            {/* Resumo da Visita */}
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-neutral-500 uppercase ml-1">Resumo da Visita</p>
                                <div className="bg-neutral-900/50 p-4 rounded-2xl border border-neutral-700/50 text-sm text-neutral-300 leading-relaxed italic">
                                    {selectedVisit.summary || selectedVisit.notes || 'Nenhum resumo registrado.'}
                                </div>
                            </div>

                            {/* Fotos da Visita */}
                            {selectedVisit.photos && selectedVisit.photos.length > 0 && (
                                <div className="space-y-3">
                                    <p className="text-[10px] font-bold text-neutral-500 uppercase ml-1 text-sky-400">Fotos do Local</p>
                                    <div className="flex flex-wrap gap-3">
                                        {selectedVisit.photos.map((photo, idx) => (
                                            <div key={idx} className="w-20 h-20 rounded-xl overflow-hidden border border-white/5 shadow-lg group relative">
                                                <img src={photo} alt="" className="w-full h-full object-cover" />
                                                <a href={photo} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <ExternalLink size={14} className="text-white" />
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

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
                                <div className="flex space-x-3">
                                    {selectedVisit.status !== VisitStatus.VISITED && (
                                        <button
                                            onClick={() => handleFinishVisitFromAdmin(selectedVisit)}
                                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-xl font-bold transition-colors shadow-lg"
                                        >
                                            Finalizar Visita
                                        </button>
                                    )}
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
                </div>
            )}
        </div>
    );
};
