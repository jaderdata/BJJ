import React, { useState, useMemo } from 'react';
import {
    Plus,
    Edit3,
    X,
    MapPin,
    Phone,
    Mail,
    User as UserIcon,
    Building2,
    Search,
    Link,
    ArrowLeft,
    CheckCircle2,
    Loader2
} from 'lucide-react';
import { Academy, User, Event } from '../types';
import { DatabaseService } from '../lib/supabase';
import { useLoading } from '../contexts/LoadingContext';

interface CallCenterAcademiesProps {
    academies: Academy[];
    setAcademies: React.Dispatch<React.SetStateAction<Academy[]>>;
    currentUser: User;
    notifyUser: (uid: string, msg: string) => void;
    events: Event[];
    linkingEventId?: string | null;
    onLinkComplete?: () => void;
    onCancelLinking?: () => void;
}

export const CallCenterAcademies: React.FC<CallCenterAcademiesProps> = ({
    academies,
    setAcademies,
    currentUser,
    notifyUser,
    events,
    linkingEventId,
    onLinkComplete,
    onCancelLinking
}) => {
    const { withLoading } = useLoading();
    const [showModal, setShowModal] = useState(false);
    const [editingAcademy, setEditingAcademy] = useState<Academy | null>(null);
    const [formData, setFormData] = useState<Partial<Academy>>({});
    const [selectedCountry, setSelectedCountry] = useState('BR');

    const applyPhoneMask = (val: string, country: string) => {
        val = val.replace(/\D/g, '');
        if (country === 'BR') {
            if (val.length > 11) val = val.slice(0, 11);
            if (val.length > 10) {
                val = `(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7)}`;
            } else if (val.length > 6) {
                val = `(${val.slice(0, 2)}) ${val.slice(2, 6)}-${val.slice(6)}`;
            } else if (val.length > 2) {
                val = `(${val.slice(0, 2)}) ${val.slice(2)}`;
            } else if (val.length > 0) {
                val = `(${val}`;
            }
        } else if (country === 'US') {
            if (val.length > 10) val = val.slice(0, 10);
            if (val.length > 6) {
                val = `(${val.slice(0, 3)}) ${val.slice(3, 6)}-${val.slice(6)}`;
            } else if (val.length > 3) {
                val = `(${val.slice(0, 3)}) ${val.slice(3)}`;
            } else if (val.length > 0) {
                val = `(${val}`;
            }
        } else if (country === 'PT') {
            if (val.length > 9) val = val.slice(0, 9);
            if (val.length > 6) {
                val = `${val.slice(0, 3)} ${val.slice(3, 6)} ${val.slice(6)}`;
            } else if (val.length > 3) {
                val = `${val.slice(0, 3)} ${val.slice(3)}`;
            }
        }
        return val;
    };

    // Filtering State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCity, setFilterCity] = useState('');
    const [filterState, setFilterState] = useState('');
    const [filterPhone, setFilterPhone] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const linkingEvent = useMemo(() => {
        return linkingEventId ? events.find(e => e.id === linkingEventId) : null;
    }, [linkingEventId, events]);

    const filteredAcademies = useMemo(() => {
        return academies.filter(a =>
            (a.status === 'ACTIVE' || !a.status) && // Show active or legacy without status
            (a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                a.responsible?.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (filterCity ? a.city.toLowerCase().includes(filterCity.toLowerCase()) : true) &&
            (filterState ? a.state.toLowerCase().includes(filterState.toLowerCase()) : true) &&
            (filterPhone ? a.phone?.includes(filterPhone) : true)
        );
    }, [academies, searchTerm, filterCity, filterState, filterPhone]);

    const handleSoftDelete = async (academy: Academy) => {
        if (!confirm(`Tem certeza que deseja desativar a academia "${academy.name}"? Ela será enviada para revisão do administrador.`)) {
            return;
        }

        await withLoading(async () => {
            try {
                await DatabaseService.softDeleteAcademy(academy.id);
                setAcademies(prev => prev.filter(a => a.id !== academy.id));
                // Notify admin? (Optional but good)
            } catch (error) {
                console.error("Error soft deleting academy:", error);
                alert("Erro ao desativar academia.");
            }
        });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.city || !formData.state || !formData.address) {
            alert("Preencha todos os campos obrigatórios");
            return;
        }

        setIsSubmitting(true);
        try {
            let savedAcademy: Academy;
            if (editingAcademy) {
                const updated = await DatabaseService.updateAcademy(editingAcademy.id, formData);
                setAcademies(prev => prev.map(a => a.id === updated.id ? updated : a));
                savedAcademy = updated;

                // Notify salespeople associated with events at this academy
                const relatedEvents = events.filter(e => e.academiesIds.includes(updated.id));
                const salespeopleToNotify = new Set(relatedEvents.flatMap(e => e.salespersonIds || []));
                salespeopleToNotify.forEach(sid => {
                    notifyUser(sid, `A academia "${updated.name}" foi atualizada pelo Call-Center.`);
                });
            } else {
                const created = await DatabaseService.createAcademy(formData);
                setAcademies(prev => [created, ...prev]);
                savedAcademy = created;
            }

            // If we are in linking mode and just created a new academy, ask if they want to link automatically
            if (linkingEventId && !editingAcademy && confirm(`Deseja vincular a nova academia "${savedAcademy.name}" ao evento "${linkingEvent?.name}"?`)) {
                await handleLinkAcademy(savedAcademy.id);
            }

            setShowModal(false);
            setEditingAcademy(null);
            setFormData({});
        } catch (error: any) {
            console.error("Error saving academy:", error);
            alert(`Erro ao salvar academia: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLinkAcademy = async (academyId: string) => {
        if (!linkingEventId) return;

        // Check if already linked
        if (linkingEvent?.academiesIds.includes(academyId)) {
            alert("Esta academia já está vinculada a este evento.");
            return;
        }

        await withLoading(async () => {
            try {
                await DatabaseService.addEventAcademy(linkingEventId, academyId);
                onLinkComplete?.();
            } catch (error) {
                console.error("Error linking academy:", error);
                alert("Erro ao vincular academia.");
            }
        });
    };

    const openEditModal = (academy: Academy) => {
        setEditingAcademy(academy);
        setFormData(academy);
        // Infer country from phone
        let country = 'BR';
        if (academy.phone) {
            const clean = academy.phone.replace(/\D/g, '');
            if (clean.length === 9) country = 'PT';
            else if (clean.length === 10 && academy.phone.startsWith('(') && academy.phone.substring(4, 5) === ')') country = 'US'; // (XXX) XXX
        }
        setSelectedCountry(country);
        setShowModal(true);
    };

    const openNewModal = () => {
        setEditingAcademy(null);
        setFormData({});
        setSelectedCountry('BR');
        setShowModal(true);
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Context Banner for Linking */}
            {linkingEventId && (
                <div className="bg-indigo-600/20 border border-indigo-500/30 p-4 rounded-2xl flex items-center justify-between mb-2 animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500 rounded-lg shadow-lg shadow-indigo-500/20">
                            <Link size={20} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold flex items-center gap-2">
                                Modo de Vinculação
                                <span className="text-[10px] bg-indigo-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">Ativo</span>
                            </h3>
                            <p className="text-indigo-200 text-sm">Selecione uma academia para adicionar ao evento <strong className="text-white">{linkingEvent?.name}</strong></p>
                        </div>
                    </div>
                    <button
                        onClick={onCancelLinking}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/60 hover:text-white transition-colors text-sm font-bold active:scale-95"
                    >
                        <ArrowLeft size={16} /> Cancelar
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="relative overflow-hidden bg-neutral-900 border border-white/10 p-6 rounded-2xl shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent backdrop-blur-sm"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-black text-white mb-1 tracking-tight flex items-center gap-2">
                            Academias
                        </h1>
                        <p className="text-white/80 text-sm font-medium">
                            {linkingEventId ? 'Busque e selecione a academia para vincular' : 'Base de clientes e prospecção'}
                        </p>
                    </div>

                    <button
                        onClick={openNewModal}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-xl font-bold flex items-center space-x-2 transition-all shadow-lg shadow-indigo-900/20 active:scale-95 hover:shadow-indigo-500/40"
                    >
                        <Plus size={18} strokeWidth={3} />
                        <span>Nova Academia</span>
                    </button>
                </div>

                {/* Filters */}
                <div className="mt-8 space-y-4 relative z-10">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-400 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nome, responsável ou endereço..."
                            className="w-full pl-12 pr-4 h-14 bg-black/40 border border-white/5 rounded-2xl text-white placeholder:text-white/20 focus:border-indigo-500/50 focus:bg-indigo-500/5 focus:outline-none transition-all font-medium shadow-inner"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-black text-white/30 tracking-widest ml-1">Cidade</label>
                            <input
                                type="text"
                                placeholder="Orlando"
                                className="w-full h-11 px-4 bg-black/40 border border-white/5 rounded-xl text-sm text-white focus:border-white/20 focus:outline-none transition-all placeholder:text-white/10"
                                value={filterCity}
                                onChange={e => setFilterCity(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-black text-white/30 tracking-widest ml-1">Estado</label>
                            <input
                                type="text"
                                placeholder="UF"
                                className="w-full h-11 px-4 bg-black/40 border border-white/5 rounded-xl text-sm text-white focus:border-white/20 focus:outline-none transition-all placeholder:text-white/10 uppercase"
                                maxLength={2}
                                value={filterState}
                                onChange={e => setFilterState(e.target.value.toUpperCase())}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-black text-white/30 tracking-widest ml-1">Telefone</label>
                            <input
                                type="text"
                                placeholder="Digitos..."
                                className="w-full h-11 px-4 bg-black/40 border border-white/5 rounded-xl text-sm text-white focus:border-white/20 focus:outline-none transition-all placeholder:text-white/10"
                                value={filterPhone}
                                onChange={e => setFilterPhone(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-between px-2">
                <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Resultados Encontrados</h4>
                <span className="text-[10px] font-bold text-white/20">{filteredAcademies.length} academias</span>
            </div>

            {/* Academies Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAcademies.map(academy => {
                    const isLinked = linkingEvent?.academiesIds.includes(academy.id);
                    const isOwner = academy.createdBy === currentUser.id;

                    return (
                        <div
                            key={academy.id}
                            className={`group relative overflow-hidden bg-neutral-800/40 backdrop-blur-xl border ${isLinked && linkingEventId ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-white/5'} rounded-2xl p-5 hover:bg-neutral-800/60 transition-all duration-300 hover:shadow-xl hover:shadow-black/20 flex flex-col justify-between`}
                        >
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div />
                                    <div className="flex gap-2">
                                        {isOwner ? (
                                            <div className="flex gap-1 opacity-100 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => openEditModal(academy)}
                                                    className="p-2 text-neutral-500 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                                                    title="Editar dados"
                                                >
                                                    <Edit3 size={16} strokeWidth={2} />
                                                </button>
                                                <button
                                                    onClick={() => handleSoftDelete(academy)}
                                                    className="p-2 text-neutral-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                                    title="Excluir academia"
                                                >
                                                    <X size={16} strokeWidth={2} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="px-2 py-1 bg-white/5 rounded-lg text-[10px] font-bold text-white/20 uppercase tracking-widest">
                                                Leitura
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <h4 className="text-lg font-bold text-white mb-4 leading-tight">{academy.name}</h4>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-start space-x-3 text-xs text-neutral-400">
                                        <MapPin size={14} className="mt-0.5 shrink-0 text-neutral-500" />
                                        <span className="font-medium leading-relaxed">
                                            {academy.address ? `${academy.address}, ` : ''}
                                            {academy.city} - {academy.state}
                                        </span>
                                    </div>

                                    {academy.responsible && (
                                        <div className="flex items-center space-x-3 text-xs text-neutral-400">
                                            <UserIcon size={14} className="shrink-0 text-neutral-500" />
                                            <span className="font-medium">{academy.responsible}</span>
                                        </div>
                                    )}

                                    {academy.phone && (
                                        <div className="flex items-center space-x-3 text-xs text-neutral-400">
                                            <Phone size={14} className="shrink-0 text-neutral-500" />
                                            <span className="font-medium">{academy.phone}</span>
                                        </div>
                                    )}

                                    {academy.email && (
                                        <div className="flex items-center space-x-3 text-xs text-neutral-400">
                                            <Mail size={14} className="shrink-0 text-neutral-500" />
                                            <span className="font-medium">{academy.email}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {linkingEventId ? (
                                <button
                                    onClick={() => !isLinked && handleLinkAcademy(academy.id)}
                                    disabled={isLinked}
                                    className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${isLinked
                                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 cursor-default'
                                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 active:scale-95 hover:shadow-indigo-500/40'
                                        }`}
                                >
                                    {isLinked ? (
                                        <>Vinculada <CheckCircle2 size={16} /></>
                                    ) : (
                                        <>Vincular ao Evento <Link size={16} /></>
                                    )}
                                </button>
                            ) : (
                                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                                    <span className="text-[9px] text-white/10 uppercase tracking-widest font-bold">
                                        {isOwner ? 'Sua Academia' : 'Base Global'}
                                    </span>
                                    <button
                                        onClick={() => openEditModal(academy)}
                                        className="text-xs font-bold text-neutral-500 hover:text-white transition-colors"
                                    >
                                        {isOwner ? 'Editar' : 'Ver Detalhes'}
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {filteredAcademies.length === 0 && (
                <div className="text-center py-20 space-y-4 opacity-50">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto text-white/20">
                        <Search size={32} />
                    </div>
                    <p className="text-white/40 font-medium">Nenhuma academia encontrada com os filtros atuais.</p>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02] shrink-0">
                            <h3 className="text-xl font-black text-white flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                    {editingAcademy ? <Edit3 size={20} /> : <Plus size={20} />}
                                </div>
                                {editingAcademy ? (editingAcademy.createdBy === currentUser.id ? 'Editar Academia' : 'Detalhes da Academia') : 'Cadastrar Nova Academia'}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setEditingAcademy(null);
                                    setFormData({});
                                }}
                                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all active:scale-95"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                            <fieldset disabled={editingAcademy ? (editingAcademy.createdBy !== currentUser.id) : false} className="space-y-6 group-disabled:opacity-60">
                                <div>
                                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1 mb-1.5 block">Nome da Academia</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Gracie Barra Centro"
                                        value={formData.name || ''}
                                        className="w-full h-14 px-5 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-indigo-500/50 focus:bg-indigo-500/5 focus:outline-none transition-all text-base font-bold placeholder:text-white/10 placeholder:font-normal disabled:opacity-50 disabled:cursor-not-allowed"
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        autoFocus={!editingAcademy || (editingAcademy.createdBy === currentUser.id)}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1 mb-1.5 block">Cidade</label>
                                        <input
                                            type="text"
                                            placeholder="Ex: Orlando"
                                            value={formData.city || ''}
                                            className="w-full h-12 px-5 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-indigo-500/50 focus:outline-none transition-all text-sm font-medium placeholder:text-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                            onChange={e => setFormData({ ...formData, city: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1 mb-1.5 block">Estado (UF)</label>
                                        <input
                                            type="text"
                                            placeholder="FL"
                                            maxLength={2}
                                            value={formData.state || ''}
                                            className="w-full h-12 px-5 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-indigo-500/50 focus:outline-none transition-all text-sm font-medium placeholder:text-white/10 uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                                            onChange={e => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1 mb-1.5 block">Endereço Completo</label>
                                    <input
                                        type="text"
                                        placeholder="Rua, Número, Bairro, CEP"
                                        value={formData.address || ''}
                                        className="w-full h-12 px-5 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-indigo-500/50 focus:outline-none transition-all text-sm font-medium placeholder:text-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1 mb-1.5 block">Responsável</label>
                                        <input
                                            type="text"
                                            placeholder="Nome do contato principal"
                                            value={formData.responsible || ''}
                                            className="w-full h-12 px-5 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-indigo-500/50 focus:outline-none transition-all text-sm font-medium placeholder:text-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                            onChange={e => setFormData({ ...formData, responsible: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1 mb-1.5 block">País</label>
                                        <select
                                            className="w-full h-12 px-5 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-indigo-500/50 focus:outline-none transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                            value={selectedCountry}
                                            onChange={(e) => {
                                                const newCountry = e.target.value;
                                                setSelectedCountry(newCountry);
                                                // Re-apply mask to existing phone number
                                                const masked = applyPhoneMask(formData.phone || '', newCountry);
                                                setFormData({ ...formData, phone: masked });
                                            }}
                                        >
                                            <option value="BR" className="bg-neutral-900">Brasil</option>
                                            <option value="US" className="bg-neutral-900">Estados Unidos</option>
                                            <option value="PT" className="bg-neutral-900">Portugal</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1 mb-1.5 block">Telefone / WhatsApp</label>
                                        <input
                                            type="text"
                                            placeholder="Número"
                                            value={formData.phone || ''}
                                            className="w-full h-12 px-5 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-indigo-500/50 focus:outline-none transition-all text-sm font-medium placeholder:text-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                            onChange={(e) => {
                                                const val = applyPhoneMask(e.target.value, selectedCountry);
                                                setFormData({ ...formData, phone: val });
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1 mb-1.5 block">E-mail</label>
                                        <input
                                            type="email"
                                            placeholder="contato@academia.com"
                                            value={formData.email || ''}
                                            className="w-full h-12 px-5 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-indigo-500/50 focus:outline-none transition-all text-sm font-medium placeholder:text-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </fieldset>

                            <div className="pt-6 border-t border-white/5 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingAcademy(null);
                                        setFormData({});
                                        setSelectedCountry('BR'); // Reset country on modal close
                                    }}
                                    className="px-8 py-4 bg-transparent hover:bg-white/5 text-white/40 hover:text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-all"
                                >
                                    {(!editingAcademy || editingAcademy.createdBy === currentUser.id) ? 'Cancelar' : 'Fechar'}
                                </button>
                                {(!editingAcademy || editingAcademy.createdBy === currentUser.id) && (
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="min-w-[200px] bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-indigo-500/20 active:scale-95 uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : (
                                            <>
                                                {editingAcademy ? 'Salvar Alterações' : 'Cadastrar Academia'}
                                                {!editingAcademy && <CheckCircle2 size={18} />}
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

