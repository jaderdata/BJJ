import React, { useState, useMemo } from 'react';
import {
    Plus,
    Trash2,
    X,
    Edit3,
    Search
} from 'lucide-react';
import { Academy, User, Event } from '../types';
import { DatabaseService } from '../lib/supabase';
import { useLoading } from '../contexts/LoadingContext';

interface AcademiesManagerProps {
    academies: Academy[];
    setAcademies: React.Dispatch<React.SetStateAction<Academy[]>>;
    currentUser: User;
    notifyUser: (uid: string, msg: string) => void;
    events: Event[];
}

export const AcademiesManager: React.FC<AcademiesManagerProps> = ({
    academies,
    setAcademies,
    currentUser,
    notifyUser,
    events
}) => {
    const { withLoading } = useLoading();
    const [showModal, setShowModal] = useState(false);
    const [editingAcademy, setEditingAcademy] = useState<Academy | null>(null);
    const [formData, setFormData] = useState<Partial<Academy>>({});
    const [selectedCountry, setSelectedCountry] = useState('BR');

    const [showInactive, setShowInactive] = useState(false);
    const [searchName, setSearchName] = useState('');
    const [filterState, setFilterState] = useState('');
    const [filterCountry, setFilterCountry] = useState('');

    const inferCountry = (phone: string) => {
        const clean = phone?.replace(/\D/g, '') || '';
        if (clean.length === 9) return 'PT';
        if (clean.length === 10) return 'US';
        return 'BR';
    };

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

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.city || !formData.state || !formData.address) {
            alert("Preencha todos os campos obrigatórios");
            return;
        }

        await withLoading(async () => {
            try {
                if (editingAcademy) {
                    const updated = await DatabaseService.updateAcademy(editingAcademy.id, formData);
                    setAcademies(prev => prev.map(a => a.id === updated.id ? updated : a));

                    // Notify salespeople of events where this academy is present
                    const relatedEvents = events.filter(e => e.academiesIds.includes(updated.id));
                    const salespeopleToNotify = new Set<string>();
                    relatedEvents.forEach(e => {
                        e.salespersonIds?.forEach(id => salespeopleToNotify.add(id));
                    });

                    salespeopleToNotify.forEach(sid => {
                        notifyUser(sid, `Os dados da academia "${updated.name}" foram atualizados pelo administrador.`);
                    });
                } else {
                    const created = await DatabaseService.createAcademy(formData);
                    setAcademies(prev => [created, ...prev]);
                }

                setShowModal(false);
                setEditingAcademy(null);
                setFormData({});
            } catch (error: any) {
                console.error("Error saving academy:", error);
                alert(`Erro ao salvar academia: ${error.message}`);
            }
        });
    };

    const handleDelete = async (id: string, name: string) => {
        if (window.confirm(`Deseja realmente excluir DEFINITIVAMENTE a academia "${name}"? Esta ação não pode ser desfeita.`)) {
            await withLoading(async () => {
                try {
                    await DatabaseService.deleteAcademy(id);
                    setAcademies(prev => prev.filter(a => a.id !== id));
                } catch (error) {
                    console.error("Error deleting academy:", error);
                    alert("Erro ao excluir academia");
                }
            });
        }
    };

    const handleRestore = async (academy: Academy) => {
        await withLoading(async () => {
            try {
                const updated = await DatabaseService.updateAcademy(academy.id, { status: 'ACTIVE' });
                setAcademies(prev => prev.map(a => a.id === updated.id ? updated : a));
            } catch (error) {
                console.error("Error restoring academy:", error);
                alert("Erro ao restaurar academia");
            }
        });
    };

    const uniqueStates = useMemo(() => {
        const states = academies
            .filter(a => a.status === 'ACTIVE' || !a.status)
            .map(a => a.state)
            .filter(Boolean);
        return [...new Set(states)].sort();
    }, [academies]);

    const filteredAcademies = academies.filter(a => {
        const statusMatch = showInactive ? a.status === 'INACTIVE' : (a.status === 'ACTIVE' || !a.status);
        if (!statusMatch) return false;
        if (searchName && !a.name.toLowerCase().includes(searchName.toLowerCase())) return false;
        if (filterState && a.state !== filterState) return false;
        if (filterCountry && inferCountry(a.phone) !== filterCountry) return false;
        return true;
    });

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
        <div className="space-y-6 p-4">
            {/* Header */}
            <div className="relative overflow-hidden bg-neutral-900 border border-white/10 p-6 rounded-md shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent backdrop-blur-sm"></div>
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -ml-16 -mb-16"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-black text-white mb-1 tracking-tight">
                            Gerenciamento de Academias
                        </h1>
                        <p className="text-white/80 text-sm font-medium">
                            Cadastro e gestão de academias parceiras
                        </p>
                    </div>

                    {/* Academy Counter Badge */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-sm">
                            <div className="flex flex-col items-center">
                                <span className="text-2xl font-black text-amber-400 leading-none">
                                    {academies.filter(a => a.status === 'ACTIVE' || !a.status).length}
                                </span>
                                <span className="text-[9px] font-black text-white/30 uppercase tracking-widest mt-0.5">Ativas</span>
                            </div>
                            {academies.some(a => a.status === 'INACTIVE') && (
                                <>
                                    <div className="w-px h-8 bg-white/10" />
                                    <div className="flex flex-col items-center">
                                        <span className="text-2xl font-black text-amber-400 leading-none">
                                            {academies.filter(a => a.status === 'INACTIVE').length}
                                        </span>
                                        <span className="text-[9px] font-black text-white/30 uppercase tracking-widest mt-0.5">Inativas</span>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowInactive(!showInactive)}
                                className={`px-4 py-2 rounded-sm font-bold text-xs uppercase transition-all border ${showInactive
                                    ? 'bg-amber-500/20 border-amber-500/30 text-amber-500'
                                    : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
                                    }`}
                            >
                                {showInactive ? 'Ver Ativas' : 'Ver Inativas'}
                            </button>
                            <button
                                onClick={openNewModal}
                                className="bg-white/10 backdrop-blur-md border-2 border-white/20 text-white px-4 py-2 rounded-sm font-bold flex items-center space-x-2 hover:bg-white/20 transition-all"
                            >
                                <Plus size={18} strokeWidth={2} />
                                <span>Nova Academia</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="flex flex-col md:flex-row gap-3 mt-4">
                    <div className="relative flex-1">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                        <input
                            type="text"
                            placeholder="Pesquisar por nome..."
                            value={searchName}
                            onChange={e => setSearchName(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 text-sm font-medium transition-all"
                        />
                    </div>
                    <select
                        value={filterState}
                        onChange={e => setFilterState(e.target.value)}
                        className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20 text-sm font-medium transition-all min-w-[130px]"
                    >
                        <option value="" className="bg-neutral-900">Todos os estados</option>
                        {uniqueStates.map(s => (
                            <option key={s} value={s} className="bg-neutral-900">{s}</option>
                        ))}
                    </select>
                    <select
                        value={filterCountry}
                        onChange={e => setFilterCountry(e.target.value)}
                        className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20 text-sm font-medium transition-all min-w-[140px]"
                    >
                        <option value="" className="bg-neutral-900">Todos os países</option>
                        <option value="BR" className="bg-neutral-900">Brasil</option>
                        <option value="US" className="bg-neutral-900">Estados Unidos</option>
                        <option value="PT" className="bg-neutral-900">Portugal</option>
                    </select>
                </div>

                {/* Academies Grid */}
                {filteredAcademies.length === 0 && (
                    <div className="mt-6 text-center text-white/30 text-sm font-medium py-8">
                        Nenhuma academia encontrada com os filtros aplicados.
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {filteredAcademies.map(academy => (
                        <div
                            key={academy.id}
                            className={`group relative overflow-hidden bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border ${academy.status === 'INACTIVE' ? 'border-amber-500/30' : 'border-white/10'} rounded-md p-4 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2`}
                        >
                            {/* Glow effect */}
                            <div className={`absolute -top-24 -right-24 w-48 h-48 ${academy.status === 'INACTIVE' ? 'bg-amber-500/10' : 'bg-amber-500/20'} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

                            <div className="relative z-10">
                                {/* Header */}
                                <div className="flex justify-between items-start mb-3">
                                    {academy.status === 'INACTIVE' ? (
                                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-500 text-[10px] font-black rounded-sm uppercase tracking-widest">Inativa</span>
                                    ) : (
                                        <div />
                                    )}
                                    <div className="flex items-center space-x-1">
                                        {academy.status === 'INACTIVE' && (
                                            <button
                                                aria-label="Restaurar Academia"
                                                onClick={() => handleRestore(academy)}
                                                className="p-1.5 text-white/40 hover:text-amber-400 hover:bg-amber-500/20 rounded-sm transition-all"
                                                title="Restaurar Academia"
                                            >
                                                <Plus size={14} strokeWidth={2} />
                                            </button>
                                        )}
                                        <button
                                            aria-label="Editar Academia"
                                            onClick={() => openEditModal(academy)}
                                            className="p-1.5 text-white/40 hover:text-blue-400 hover:bg-blue-500/20 rounded-sm transition-all"
                                            title="Editar Academia"
                                        >
                                            <Edit3 size={14} strokeWidth={2} />
                                        </button>
                                        <button
                                            aria-label="Excluir Academia"
                                            onClick={() => handleDelete(academy.id, academy.name)}
                                            className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/20 rounded-sm transition-all"
                                            title="Excluir Academia"
                                        >
                                            <Trash2 size={14} strokeWidth={2} />
                                        </button>
                                    </div>
                                </div>

                                {/* Content */}
                                <h4 className={`text-lg font-black text-white mb-2 ${academy.status === 'INACTIVE' ? 'opacity-50' : ''}`}>{academy.name}</h4>

                                <div className="space-y-2 mb-3">
                                    {academy.address && (
                                        <div className="flex items-center space-x-2 text-xs text-white/60">
                                            <span className="font-bold">{academy.address}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center space-x-2 text-xs text-white/60">
                                        <span className="font-bold">{academy.city} - {academy.state}</span>
                                    </div>

                                    {academy.responsible && (
                                        <div className="flex items-center space-x-2 text-xs text-white/60">
                                            <span className="font-bold">{academy.responsible}</span>
                                        </div>
                                    )}

                                    {academy.phone && (
                                        <div className="flex items-center space-x-2 text-xs text-white/60">
                                            <span className="font-bold">{academy.phone}</span>
                                        </div>
                                    )}

                                    {academy.email && (
                                        <div className="flex items-center space-x-2 text-xs text-white/60">
                                            <span className="font-bold">{academy.email}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
                        <div className="bg-gradient-to-br from-white/10 to-white/[0.02] backdrop-blur-xl border border-white/20 rounded-md w-full max-w-2xl shadow-2xl overflow-hidden">
                            <div className="p-6 border-b border-white/10 flex justify-between items-center">
                                <h3 className="text-xl font-black text-white">
                                    {editingAcademy ? 'Editar Academia' : 'Nova Academia'}
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingAcademy(null);
                                        setFormData({});
                                    }}
                                    className="text-white/60 hover:text-white transition-colors"
                                >
                                    <X size={20} strokeWidth={2} />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="p-6 space-y-4">
                                <input
                                    type="text"
                                    placeholder="Nome da Academia"
                                    value={formData.name || ''}
                                    className="w-full px-4 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all text-sm font-medium"
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/60 uppercase tracking-wider ml-1">Endereço</label>
                                    <input
                                        type="text"
                                        placeholder="Endereço completo"
                                        value={formData.address || ''}
                                        className="w-full px-4 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all text-sm font-medium"
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-white/60 uppercase tracking-wider ml-1">Cidade</label>
                                        <input
                                            type="text"
                                            placeholder="Ex: Orlando"
                                            value={formData.city || ''}
                                            className="w-full px-4 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all text-sm font-medium"
                                            onChange={e => setFormData({ ...formData, city: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-white/60 uppercase tracking-wider ml-1">UF</label>
                                        <input
                                            type="text"
                                            placeholder="Ex: FL"
                                            maxLength={2}
                                            value={formData.state || ''}
                                            className="w-full px-4 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all text-sm font-medium"
                                            onChange={e => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/60 uppercase tracking-wider ml-1">Responsável</label>
                                    <input
                                        type="text"
                                        placeholder="Nome do responsável"
                                        value={formData.responsible || ''}
                                        className="w-full px-4 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all text-sm font-medium"
                                        onChange={e => setFormData({ ...formData, responsible: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/60 uppercase tracking-wider ml-1">E-mail</label>
                                    <input
                                        type="email"
                                        placeholder="contato@academia.com"
                                        value={formData.email || ''}
                                        className="w-full px-4 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all text-sm font-medium"
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/60 uppercase tracking-wider ml-1">País</label>
                                    <select
                                        className="w-full px-4 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-sm text-white focus:outline-none focus:ring-2 focus:ring-white/30 transition-all text-sm font-medium"
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

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/60 uppercase tracking-wider ml-1">Telefone</label>
                                    <input
                                        type="text"
                                        placeholder="Número de telefone"
                                        value={formData.phone || ''}
                                        className="w-full px-4 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all text-sm font-medium"
                                        onChange={(e) => {
                                            const val = applyPhoneMask(e.target.value, selectedCountry);
                                            setFormData({ ...formData, phone: val });
                                        }}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-amber-600 to-teal-600 hover:from-amber-500 hover:to-teal-500 text-white px-4 py-3 rounded-sm font-bold transition-all shadow-lg hover:shadow-amber-500/50"
                                >
                                    {editingAcademy ? 'Salvar Alterações' : 'Criar Academia'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
