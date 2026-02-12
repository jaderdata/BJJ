import React, { useState } from 'react';
import {
    Plus,
    Trash2,
    X,
    Edit3
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
                    const salespeopleToNotify = new Set(relatedEvents.map(e => e.salespersonId).filter(Boolean) as string[]);

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
        if (window.confirm(`Deseja realmente excluir a academia "${name}"?`)) {
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

    const openEditModal = (academy: Academy) => {
        setEditingAcademy(academy);
        setFormData(academy);
        setShowModal(true);
    };

    const openNewModal = () => {
        setEditingAcademy(null);
        setFormData({});
        setShowModal(true);
    };

    return (
        <div className="space-y-6 p-4">
            {/* Header */}
            <div className="relative overflow-hidden bg-neutral-900 border border-white/10 p-6 rounded-2xl shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent backdrop-blur-sm"></div>
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

                    <button
                        onClick={openNewModal}
                        className="bg-white/10 backdrop-blur-md border-2 border-white/20 text-white px-4 py-2 rounded-xl font-bold flex items-center space-x-2 hover:bg-white/20 transition-all"
                    >
                        <Plus size={18} strokeWidth={2} />
                        <span>Nova Academia</span>
                    </button>
                </div>
            </div>

            {/* Academies Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {academies.map(academy => (
                    <div
                        key={academy.id}
                        className="group relative overflow-hidden bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                    >
                        {/* Glow effect */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                        <div className="relative z-10">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-3">
                                <div></div>
                                <div className="flex items-center space-x-1">
                                    <button
                                        aria-label="Editar Academia"
                                        onClick={() => openEditModal(academy)}
                                        className="p-1.5 text-white/40 hover:text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all"
                                    >
                                        <Edit3 size={14} strokeWidth={2} />
                                    </button>
                                    <button
                                        aria-label="Excluir Academia"
                                        onClick={() => handleDelete(academy.id, academy.name)}
                                        className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-all"
                                    >
                                        <Trash2 size={14} strokeWidth={2} />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <h4 className="text-lg font-black text-white mb-2">{academy.name}</h4>

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
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
                    <div className="bg-gradient-to-br from-white/10 to-white/[0.02] backdrop-blur-xl border border-white/20 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
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
                                className="w-full px-4 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all text-sm font-medium"
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-white/60 uppercase tracking-wider ml-1">Endereço</label>
                                <input
                                    type="text"
                                    placeholder="Endereço completo"
                                    value={formData.address || ''}
                                    className="w-full px-4 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all text-sm font-medium"
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
                                        className="w-full px-4 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all text-sm font-medium"
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
                                        className="w-full px-4 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all text-sm font-medium"
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
                                    className="w-full px-4 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all text-sm font-medium"
                                    onChange={e => setFormData({ ...formData, responsible: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-white/60 uppercase tracking-wider ml-1">Telefone</label>
                                <input
                                    type="text"
                                    placeholder="(000) 000-0000"
                                    value={formData.phone || ''}
                                    className="w-full px-4 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all text-sm font-medium"
                                    onChange={(e) => {
                                        let val = e.target.value.replace(/\D/g, '');
                                        if (val.length > 10) val = val.slice(0, 10);

                                        if (val.length > 6) {
                                            val = `(${val.slice(0, 3)}) ${val.slice(3, 6)}-${val.slice(6)}`;
                                        } else if (val.length > 3) {
                                            val = `(${val.slice(0, 3)}) ${val.slice(3)}`;
                                        } else if (val.length > 0) {
                                            val = `(${val}`;
                                        }
                                        setFormData({ ...formData, phone: val });
                                    }}
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-emerald-500/50"
                            >
                                {editingAcademy ? 'Salvar Alterações' : 'Criar Academia'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
