import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
    Plus, X, Phone, MessageCircle, Users, Search, Calendar,
    Edit3, Trash2, ChevronDown, LayoutList, Columns, Clock,
    TrendingUp, AlertCircle, CheckCircle, Loader2, Building2,
    History, ArrowRight, Pencil, Sparkles, Mail, CalendarPlus,
    ChevronLeft, ChevronRight, Video, Send
} from 'lucide-react';
import { Academy, User, Visit, Event, EventStatus, FollowUp, FollowUpLog, FollowUpStatus, ContactChannel, UserRole, Meeting, MeetingDuration } from '../types';
import { DatabaseService } from '../lib/supabase';
import { supabase } from '../lib/supabase-client';

interface FollowUpPageProps {
    academies: Academy[];
    visits: Visit[];
    events: Event[];
    vendedores: User[];
    currentUser: User;
    onAcademyCreated?: () => void;
}

// ─────────────────────────────── constants ───────────────────────────────

const STATUS_CONFIG: Record<FollowUpStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
    [FollowUpStatus.WAITING]: { label: 'Aguardando', color: 'text-neutral-400', bg: 'bg-neutral-500/10', border: 'border-neutral-500/20', dot: 'bg-neutral-400' },
    [FollowUpStatus.HIGH]: { label: 'Interesse Alto', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', dot: 'bg-amber-400' },
    [FollowUpStatus.MEDIUM]: { label: 'Interesse Médio', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', dot: 'bg-yellow-400' },
    [FollowUpStatus.LOW]: { label: 'Interesse Baixo', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', dot: 'bg-orange-400' },
    [FollowUpStatus.NO_INTEREST]: { label: 'Sem Interesse', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', dot: 'bg-red-400' },
    [FollowUpStatus.CLOSED]: { label: 'Fechado', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', dot: 'bg-blue-400' },
};

const CHANNEL_CONFIG: Record<ContactChannel, { label: string; icon: React.FC<any> }> = {
    [ContactChannel.CALL]: { label: 'Ligação', icon: Phone },
    [ContactChannel.WHATSAPP]: { label: 'WhatsApp', icon: MessageCircle },
    [ContactChannel.PRESENCIAL]: { label: 'Presencial', icon: Users },
};

const KANBAN_ORDER = [
    FollowUpStatus.WAITING,
    FollowUpStatus.HIGH,
    FollowUpStatus.MEDIUM,
    FollowUpStatus.LOW,
    FollowUpStatus.NO_INTEREST,
    FollowUpStatus.CLOSED,
];

// ─────────────────────────────── helpers ─────────────────────────────────

function isOverdue(followUp: FollowUp) {
    if (!followUp.nextContactAt) return false;
    if (followUp.status === FollowUpStatus.CLOSED || followUp.status === FollowUpStatus.NO_INTEREST) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const contactDate = new Date(followUp.nextContactAt);
    contactDate.setHours(0, 0, 0, 0);
    
    return contactDate < today;
}

function formatDate(iso?: string) {
    if (!iso) return null;
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(new Date(iso));
}

function formatRelative(iso: string) {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return 'agora';
    if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
    return `${Math.floor(diff / 86400)}d atrás`;
}

// ─────────────────────────── FollowUpStat ────────────────────────────────

function StatBadge({ count, status }: { count: number; status: FollowUpStatus }) {
    const cfg = STATUS_CONFIG[status];
    return (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-white/[0.02] rounded-sm">
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            <span className="text-[11px] font-bold text-neutral-400">{cfg.label}</span>
            <span className="text-[11px] font-black text-white ml-0.5">{count}</span>
        </div>
    );
}

// ─────────────────────────── FollowUp Card ───────────────────────────────

function FollowUpCard({
    followUp, academy, creator, onEdit, onDelete, onViewLog
}: {
    followUp: FollowUp;
    academy?: Academy;
    creator?: User;
    onEdit: () => void;
    onDelete: () => void;
    onViewLog: () => void;
}) {
    const cfg = STATUS_CONFIG[followUp.status];
    const channelCfg = CHANNEL_CONFIG[followUp.contactChannel];
    const ChannelIcon = channelCfg.icon;
    const overdue = isOverdue(followUp);

    return (
        <div className={`group relative bg-[#0f0f11] border ${overdue ? 'border-red-500/40 shadow-red-900/10 shadow-lg' : 'border-transparent'} rounded-md p-4 hover:bg-[#141416] transition-all duration-200`}>
            {/* Status pill */}
            <div className="flex items-center gap-1.5 mb-2">
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                <span className={`text-[10px] font-bold uppercase tracking-widest ${cfg.color}`}>{cfg.label}</span>
            </div>

            {/* Academy name */}
            <h4 className="text-sm font-bold text-white mb-1 leading-tight">
                {academy?.name ?? 'Academia desconhecida'}
            </h4>
            <p className="text-xs text-neutral-500 mb-3">{academy?.city}, {academy?.state}</p>

            {/* Meta row */}
            <div className="flex items-center gap-3 flex-wrap mb-3">
                <div className="flex items-center gap-1.5 text-neutral-500">
                    <ChannelIcon size={12} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{channelCfg.label}</span>
                </div>
                {followUp.contactPerson && (
                    <span className="text-[10px] text-neutral-600 font-medium">{followUp.contactPerson}</span>
                )}
                {creator && (
                    <span className="text-[10px] text-neutral-600 flex items-center gap-1">
                        <span className="w-3.5 h-3.5 rounded-full bg-amber-500/30 text-amber-400 flex items-center justify-center text-[8px] font-black shrink-0">
                            {creator.name.charAt(0).toUpperCase()}
                        </span>
                        {creator.name.split(' ')[0]}
                    </span>
                )}
            </div>

            {/* Notes */}
            {followUp.notes && (
                <p className="text-xs text-neutral-400 mb-3 leading-relaxed line-clamp-2">{followUp.notes}</p>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <div className="flex items-center gap-2">
                    {followUp.nextContactAt ? (
                        <div className={`flex items-center gap-1.5 ${overdue ? 'text-red-400' : 'text-neutral-500'}`}>
                            {overdue ? <AlertCircle size={12} /> : <Calendar size={12} />}
                            <span className="text-[10px] font-bold">
                                {overdue ? 'Vencido: ' : 'Próximo: '}
                                {formatDate(followUp.nextContactAt)}
                            </span>
                        </div>
                    ) : (
                        <span className="text-[10px] text-neutral-600">
                            <Clock size={10} className="inline mr-1" />
                            {formatRelative(followUp.updatedAt)}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={onViewLog}
                        className="p-1.5 text-neutral-500 hover:text-amber-400 hover:bg-amber-400/10 rounded-sm transition-all"
                        title="Ver histórico de atividades"
                    >
                        <History size={12} />
                    </button>
                    <button
                        onClick={onEdit}
                        className="p-1.5 text-neutral-500 hover:text-white hover:bg-white/10 rounded-sm transition-all"
                    >
                        <Edit3 size={12} />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-400/10 rounded-sm transition-all"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────── Log Modal ───────────────────────────────────

function FollowUpLogModal({ followUp, academy, onClose }: {
    followUp: FollowUp;
    academy?: Academy;
    onClose: () => void;
}) {
    const [logs, setLogs] = useState<FollowUpLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        DatabaseService.getFollowUpLogs(followUp.id)
            .then(setLogs)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [followUp.id]);

    function actionIcon(action: FollowUpLog['action']) {
        if (action === 'CRIADO') return <Sparkles size={12} />;
        if (action === 'STATUS_ALTERADO') return <ArrowRight size={12} />;
        return <Pencil size={12} />;
    }

    function actionColor(action: FollowUpLog['action']) {
        if (action === 'CRIADO') return 'text-amber-400 bg-amber-500/15 border-amber-500/20';
        if (action === 'STATUS_ALTERADO') return 'text-amber-400 bg-amber-500/15 border-amber-500/20';
        return 'text-neutral-400 bg-white/5 border-white/10';
    }

    function actionLabel(log: FollowUpLog) {
        if (log.action === 'CRIADO') {
            const statusLabel = log.toStatus ? STATUS_CONFIG[log.toStatus as FollowUpStatus]?.label : '';
            return `Criou o follow-up${statusLabel ? ` com status "${statusLabel}"` : ''}`;
        }
        if (log.action === 'STATUS_ALTERADO') {
            const from = log.fromStatus ? STATUS_CONFIG[log.fromStatus as FollowUpStatus]?.label : log.fromStatus;
            const to = log.toStatus ? STATUS_CONFIG[log.toStatus as FollowUpStatus]?.label : log.toStatus;
            return `Alterou de "${from}" → "${to}"`;
        }
        return log.note || 'Atualizou informações';
    }

    return createPortal(
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[130] animate-in fade-in duration-200">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-md w-full max-w-md shadow-2xl flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-5 border-b border-white/5 flex justify-between items-start shrink-0">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-7 h-7 rounded-sm bg-amber-500/20 flex items-center justify-center text-amber-400">
                                <History size={14} />
                            </div>
                            <h3 className="text-sm font-black text-white">Histórico de Atividades</h3>
                        </div>
                        <p className="text-xs text-neutral-500 pl-9">{academy?.name ?? 'Academia'}</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-sm bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all shrink-0">
                        <X size={16} />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto custom-scrollbar p-5">
                    {loading && (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 size={24} className="animate-spin text-amber-500/40" />
                        </div>
                    )}

                    {!loading && logs.length === 0 && (
                        <div className="text-center py-12 space-y-2">
                            <History size={28} className="mx-auto text-white/10" />
                            <p className="text-xs text-neutral-600">Nenhuma atividade registrada ainda.</p>
                        </div>
                    )}

                    {!loading && logs.length > 0 && (
                        <div className="relative">
                            {/* Timeline line */}
                            <div className="absolute left-[18px] top-4 bottom-4 w-px bg-white/5" />

                            <div className="space-y-4">
                                {logs.map((log) => (
                                    <div key={log.id} className="flex gap-3 relative">
                                        {/* Icon */}
                                        <div className={`w-9 h-9 rounded-sm border flex items-center justify-center shrink-0 ${actionColor(log.action)}`}>
                                            {actionIcon(log.action)}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0 pt-1">
                                            <p className="text-xs text-white/80 leading-snug">{actionLabel(log)}</p>
                                            {log.note && log.action !== 'ATUALIZADO' && (
                                                <p className="text-[10px] text-neutral-500 mt-0.5 italic">{log.note}</p>
                                            )}
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400">
                                                    <span className="w-3.5 h-3.5 rounded-full bg-amber-500/30 flex items-center justify-center text-[8px] font-black">
                                                        {log.userName.charAt(0).toUpperCase()}
                                                    </span>
                                                    {log.userName}
                                                </span>
                                                <span className="text-[10px] text-neutral-600">·</span>
                                                <span className="text-[10px] text-neutral-600">{formatRelative(log.createdAt)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}

// ─────────────────────────── Modal ───────────────────────────────────────

interface ModalProps {
    academies: Academy[];
    visits: Visit[];
    events: Event[];
    currentUser: User;
    editing: FollowUp | null;
    onSave: (data: Partial<FollowUp>) => Promise<void>;
    onClose: () => void;
    isAdmin: boolean;
    vendedores: User[];
    onAcademyCreated?: (academy: Academy) => void;
}

function FollowUpModal({ academies, visits, events, currentUser, editing, onSave, onClose, isAdmin, vendedores, onAcademyCreated }: ModalProps) {
    const [academySearch, setAcademySearch] = useState('');
    const [selectedAcademyId, setSelectedAcademyId] = useState(editing?.academyId ?? '');
    const [status, setStatus] = useState<FollowUpStatus>(editing?.status ?? FollowUpStatus.WAITING);
    const [channel, setChannel] = useState<ContactChannel>(editing?.contactChannel ?? ContactChannel.CALL);
    const [contactPerson, setContactPerson] = useState(editing?.contactPerson ?? '');
    const [notes, setNotes] = useState(editing?.notes ?? '');
    const [nextContactAt, setNextContactAt] = useState(editing?.nextContactAt ? editing.nextContactAt.split('T')[0] : '');
    const [visitId, setVisitId] = useState(editing?.visitId ?? '');
    const [selectedEventIds, setSelectedEventIds] = useState<string[]>(editing?.eventIds ?? []);
    const [eventSearch, setEventSearch] = useState('');
    const [showEventDropdown, setShowEventDropdown] = useState(false);
    const [saving, setSaving] = useState(false);

    // Nova Academia sub-form
    const [showNewAcademy, setShowNewAcademy] = useState(false);
    const [newAcademyData, setNewAcademyData] = useState<Partial<Academy>>({});
    const [savingAcademy, setSavingAcademy] = useState(false);
    const [localAcademies, setLocalAcademies] = useState<Academy[]>([]);

    const allAcademies = useMemo(() => {
        const combined = [...academies, ...localAcademies];
        const seen = new Set<string>();
        return combined.filter(a => { if (seen.has(a.id)) return false; seen.add(a.id); return true; });
    }, [academies, localAcademies]);

    const filteredAcademies = useMemo(() =>
        allAcademies
            .filter(a => a.status === 'ACTIVE' || !a.status)
            .filter(a => a.name.toLowerCase().includes(academySearch.toLowerCase()))
            .slice(0, 8),
        [allAcademies, academySearch]
    );

    const selectedAcademy = allAcademies.find(a => a.id === selectedAcademyId);

    const handleCreateAcademy = async () => {
        if (!newAcademyData.name || !newAcademyData.city || !newAcademyData.state) {
            alert('Preencha Nome, Cidade e Estado.');
            return;
        }
        setSavingAcademy(true);
        try {
            const created = await DatabaseService.createAcademy({ ...newAcademyData, address: newAcademyData.address || '' });
            setLocalAcademies(prev => [created, ...prev]);
            setSelectedAcademyId(created.id);
            setAcademySearch('');
            setShowNewAcademy(false);
            setNewAcademyData({});
            onAcademyCreated?.(created);
        } catch (err: any) {
            alert(`Erro ao cadastrar academia: ${err.message}`);
        } finally {
            setSavingAcademy(false);
        }
    };

    // Visits related to this academy for linking
    const relatedVisits = visits.filter(v => v.academyId === selectedAcademyId);

    // Active events (UPCOMING or IN_PROGRESS, not test)
    const activeEvents = useMemo(() =>
        events.filter(e => !e.isTest && (e.status === EventStatus.UPCOMING || e.status === EventStatus.IN_PROGRESS)),
        [events]
    );

    const toggleEvent = (id: string) =>
        setSelectedEventIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAcademyId) return alert('Selecione uma academia.');
        setSaving(true);
        try {
            await onSave({
                academyId: selectedAcademyId,
                status,
                contactChannel: channel,
                contactPerson: contactPerson || undefined,
                notes: notes || undefined,
                nextContactAt: nextContactAt ? new Date(nextContactAt + 'T12:00:00').toISOString() : undefined,
                visitId: visitId || undefined,
                eventIds: selectedEventIds.length > 0 ? selectedEventIds : undefined,
                createdBy: editing?.createdBy ?? currentUser.id,
                ...(editing ? { id: editing.id } : {})
            });
        } finally {
            setSaving(false);
        }
    };
    return createPortal(
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[120] animate-in fade-in duration-200">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-md w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-7 py-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02] shrink-0">
                    <h3 className="text-lg font-black text-white flex items-center gap-3">
                        <div className="w-9 h-9 rounded-sm bg-amber-500/20 flex items-center justify-center text-amber-400">
                            {editing ? <Edit3 size={18} /> : <Plus size={18} />}
                        </div>
                        {editing ? 'Editar Follow-Up' : 'Novo Follow-Up'}
                    </h3>
                    <button onClick={onClose} className="w-9 h-9 rounded-sm bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="overflow-y-auto custom-scrollbar">
                    {/* Nova Academia sub-form — full width when open */}
                    {showNewAcademy && (
                        <div className="px-7 pt-5">
                            <div className="bg-white/[0.03] border border-amber-500/20 rounded-sm p-4 space-y-3">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                                        <Building2 size={13} />
                                        Cadastrar Nova Academia
                                    </span>
                                    <button type="button" onClick={() => { setShowNewAcademy(false); setNewAcademyData({}); }} className="text-neutral-600 hover:text-white transition-colors">
                                        <X size={14} />
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Nome da Academia *"
                                    required
                                    value={newAcademyData.name || ''}
                                    onChange={e => setNewAcademyData(p => ({ ...p, name: e.target.value }))}
                                    className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-sm text-white text-sm focus:border-amber-500/50 focus:outline-none transition-all placeholder:text-white/20"
                                />
                                <div className="grid grid-cols-4 gap-2">
                                    <div className="col-span-2">
                                        <input
                                            type="text"
                                            placeholder="Cidade *"
                                            required
                                            value={newAcademyData.city || ''}
                                            onChange={e => setNewAcademyData(p => ({ ...p, city: e.target.value }))}
                                            className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-sm text-white text-sm focus:border-amber-500/50 focus:outline-none transition-all placeholder:text-white/20"
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Estado *"
                                        required
                                        maxLength={2}
                                        value={newAcademyData.state || ''}
                                        onChange={e => setNewAcademyData(p => ({ ...p, state: e.target.value.toUpperCase() }))}
                                        className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-sm text-white text-sm focus:border-amber-500/50 focus:outline-none transition-all placeholder:text-white/20"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Telefone"
                                        value={newAcademyData.phone || ''}
                                        onChange={e => setNewAcademyData(p => ({ ...p, phone: e.target.value }))}
                                        className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-sm text-white text-sm focus:border-amber-500/50 focus:outline-none transition-all placeholder:text-white/20"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="text"
                                        placeholder="Responsável"
                                        value={newAcademyData.responsible || ''}
                                        onChange={e => setNewAcademyData(p => ({ ...p, responsible: e.target.value }))}
                                        className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-sm text-white text-sm focus:border-amber-500/50 focus:outline-none transition-all placeholder:text-white/20"
                                    />
                                    <input
                                        type="email"
                                        placeholder="E-mail"
                                        value={newAcademyData.email || ''}
                                        onChange={e => setNewAcademyData(p => ({ ...p, email: e.target.value }))}
                                        className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-sm text-white text-sm focus:border-amber-500/50 focus:outline-none transition-all placeholder:text-white/20"
                                    />
                                </div>
                                <button
                                    type="button"
                                    disabled={savingAcademy}
                                    onClick={handleCreateAcademy}
                                    className="w-full h-10 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-sm font-bold text-sm flex items-center justify-center gap-2 transition-all"
                                >
                                    {savingAcademy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                    {savingAcademy ? 'Cadastrando...' : 'Cadastrar e Selecionar'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 2-column body */}
                    <div className="grid grid-cols-2 gap-x-6 px-7 py-5 space-y-0">
                        {/* ── LEFT COLUMN ── */}
                        <div className="space-y-5">
                            {/* Academy */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Academia *</label>
                                    {!showNewAcademy && !selectedAcademy && (
                                        <button
                                            type="button"
                                            onClick={() => { setShowNewAcademy(true); setAcademySearch(''); }}
                                            className="flex items-center gap-1 text-[10px] font-bold text-amber-400 hover:text-amber-300 transition-colors"
                                        >
                                            <Plus size={12} />
                                            Nova Academia
                                        </button>
                                    )}
                                </div>
                                {!showNewAcademy && (
                                    <>
                                        {selectedAcademy ? (
                                            <div className="flex items-center justify-between px-4 py-3 bg-white/5 border border-amber-500/30 rounded-sm">
                                                <div>
                                                    <p className="text-sm font-bold text-white">{selectedAcademy.name}</p>
                                                    <p className="text-xs text-neutral-500">{selectedAcademy.city}, {selectedAcademy.state}</p>
                                                </div>
                                                <button type="button" onClick={() => { setSelectedAcademyId(''); setVisitId(''); }} className="text-neutral-500 hover:text-red-400 transition-colors">
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                                                <input
                                                    type="text"
                                                    placeholder="Buscar academia..."
                                                    className="w-full pl-10 pr-4 h-11 bg-white/5 border border-white/10 rounded-sm text-white text-sm focus:border-amber-500/50 focus:outline-none transition-all placeholder:text-white/20"
                                                    value={academySearch}
                                                    onChange={e => setAcademySearch(e.target.value)}
                                                    autoFocus
                                                />
                                                {academySearch && (
                                                    <div className="absolute top-full mt-1 w-full bg-neutral-900 border border-white/10 rounded-sm overflow-hidden z-10 shadow-2xl">
                                                        {filteredAcademies.length === 0 && (
                                                            <div className="px-4 py-3 text-xs text-neutral-500">Nenhuma academia encontrada</div>
                                                        )}
                                                        {filteredAcademies.map(a => (
                                                            <button
                                                                key={a.id}
                                                                type="button"
                                                                onClick={() => { setSelectedAcademyId(a.id); setAcademySearch(''); }}
                                                                className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                                                            >
                                                                <p className="text-sm font-bold text-white">{a.name}</p>
                                                                <p className="text-xs text-neutral-500">{a.city}, {a.state}</p>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Events */}
                            {activeEvents.length > 0 && (
                                <div>
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1.5 block">Eventos Vinculados</label>
                                    {selectedEventIds.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mb-2">
                                            {selectedEventIds.map(id => {
                                                const ev = activeEvents.find(e => e.id === id);
                                                if (!ev) return null;
                                                return (
                                                    <span key={id} className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/15 border border-amber-500/30 rounded-sm text-xs font-bold text-amber-300">
                                                        {ev.name}
                                                        <button type="button" onClick={() => toggleEvent(id)} className="text-amber-400/60 hover:text-red-400 transition-colors">
                                                            <X size={11} />
                                                        </button>
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    )}
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={15} />
                                        <input
                                            type="text"
                                            placeholder="Buscar evento..."
                                            value={eventSearch}
                                            onChange={e => { setEventSearch(e.target.value); setShowEventDropdown(true); }}
                                            onFocus={() => setShowEventDropdown(true)}
                                            onBlur={() => setTimeout(() => setShowEventDropdown(false), 150)}
                                            className="w-full pl-9 pr-4 h-11 bg-white/5 border border-white/10 rounded-sm text-white text-sm focus:border-amber-500/50 focus:outline-none transition-all placeholder:text-white/20"
                                        />
                                        {showEventDropdown && (
                                            <div className="absolute top-full mt-1 w-full bg-neutral-900 border border-white/10 rounded-sm overflow-hidden z-10 shadow-2xl max-h-48 overflow-y-auto custom-scrollbar">
                                                {activeEvents
                                                    .filter(ev => ev.name.toLowerCase().includes(eventSearch.toLowerCase()))
                                                    .map(ev => {
                                                        const selected = selectedEventIds.includes(ev.id);
                                                        return (
                                                            <button
                                                                key={ev.id}
                                                                type="button"
                                                                onMouseDown={() => { toggleEvent(ev.id); setEventSearch(''); }}
                                                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left border-b border-white/5 last:border-0 transition-colors ${selected ? 'bg-amber-500/10' : 'hover:bg-white/5'}`}
                                                            >
                                                                <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${selected ? 'bg-amber-500 border-amber-500' : 'border-white/20'}`}>
                                                                    {selected && <CheckCircle size={10} className="text-white" />}
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <p className={`text-sm font-bold truncate ${selected ? 'text-amber-300' : 'text-white'}`}>{ev.name}</p>
                                                                    <p className="text-xs text-neutral-500 truncate">{ev.city}, {ev.state}</p>
                                                                </div>
                                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-sm shrink-0 ${ev.status === EventStatus.IN_PROGRESS ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                                                    {ev.status === EventStatus.IN_PROGRESS ? 'Em andamento' : 'Próximo'}
                                                                </span>
                                                            </button>
                                                        );
                                                    })}
                                                {activeEvents.filter(ev => ev.name.toLowerCase().includes(eventSearch.toLowerCase())).length === 0 && (
                                                    <div className="px-4 py-3 text-xs text-neutral-500">Nenhum evento encontrado</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            <div>
                                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1.5 block">Observações</label>
                                <textarea
                                    rows={4}
                                    placeholder="Ex: Professor mostrou interesse em pacote anual..."
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-sm text-white text-sm focus:border-amber-500/50 focus:outline-none transition-all resize-none placeholder:text-white/20"
                                />
                            </div>
                        </div>

                        {/* ── RIGHT COLUMN ── */}
                        <div className="space-y-5">
                            {/* Status */}
                            <div>
                                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1.5 block">Status de Interesse</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {KANBAN_ORDER.map(s => {
                                        const cfg = STATUS_CONFIG[s];
                                        return (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => setStatus(s)}
                                                className={`py-2.5 px-2 rounded-sm border text-center transition-all ${status === s ? `${cfg.bg} ${cfg.border} ${cfg.color}` : 'bg-white/5 border-white/5 text-neutral-500 hover:bg-white/10'}`}
                                            >
                                                <div className={`w-2 h-2 rounded-full mx-auto mb-1 ${status === s ? cfg.dot : 'bg-neutral-600'}`} />
                                                <span className="text-[10px] font-black uppercase tracking-wide block">{cfg.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Channel */}
                            <div>
                                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1.5 block">Canal de Contato</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {Object.entries(CHANNEL_CONFIG).map(([key, cfg]) => {
                                        const Icon = cfg.icon;
                                        const isActive = channel === key;
                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => setChannel(key as ContactChannel)}
                                                className={`py-3 rounded-sm border flex flex-col items-center gap-1.5 transition-all ${isActive ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : 'bg-white/5 border-white/5 text-neutral-500 hover:bg-white/10'}`}
                                            >
                                                <Icon size={16} />
                                                <span className="text-[10px] font-bold uppercase tracking-wide">{cfg.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Contact Person + Next Contact side by side */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1.5 block">Contato (nome)</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Prof. João"
                                        value={contactPerson}
                                        onChange={e => setContactPerson(e.target.value)}
                                        className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-sm text-white text-sm focus:border-amber-500/50 focus:outline-none transition-all placeholder:text-white/20"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1.5 block">Próximo Contato</label>
                                    <input
                                        type="date"
                                        value={nextContactAt}
                                        onChange={e => setNextContactAt(e.target.value)}
                                        className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-sm text-white text-sm focus:border-amber-500/50 focus:outline-none transition-all [color-scheme:dark]"
                                    />
                                </div>
                            </div>

                            {/* Link to visit */}
                            {selectedAcademyId && relatedVisits.length > 0 && (
                                <div>
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1.5 block">Vincular a uma Visita (opcional)</label>
                                    <select
                                        value={visitId}
                                        onChange={e => setVisitId(e.target.value)}
                                        className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-sm text-white text-sm focus:border-amber-500/50 focus:outline-none transition-all"
                                    >
                                        <option value="">Nenhuma visita vinculada</option>
                                        {relatedVisits.map(v => (
                                            <option key={v.id} value={v.id}>
                                                {v.finishedAt ? formatDate(v.finishedAt) : 'Visita pendente'} — {v.status}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 px-7 py-4 border-t border-white/5">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 text-neutral-400 hover:text-white transition-colors text-sm font-bold">
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving || !selectedAcademyId}
                            className="min-w-[160px] bg-amber-600 hover:bg-amber-500 text-white px-6 py-2.5 rounded-sm font-bold text-sm transition-all shadow-lg hover:shadow-amber-500/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                            {editing ? 'Salvar Alterações' : 'Criar Follow-Up'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}

// ─────────────────────────── Delete Confirm Modal ────────────────────────

function DeleteConfirmModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
    return createPortal(
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[140] animate-in fade-in duration-150">
            <div className="bg-[#111] border border-white/10 rounded-md w-full max-w-xs shadow-2xl animate-in zoom-in-95 duration-150 overflow-hidden">
                <div className="p-6 space-y-3">
                    <div className="w-10 h-10 rounded-sm bg-red-500/10 flex items-center justify-center text-red-400 mx-auto">
                        <Trash2 size={18} />
                    </div>
                    <h3 className="text-sm font-black text-white text-center">Remover Follow-Up?</h3>
                    <p className="text-xs text-neutral-500 text-center leading-relaxed">Esta ação não pode ser desfeita. O histórico de atividades também será apagado.</p>
                </div>
                <div className="grid grid-cols-2 border-t border-white/5">
                    <button
                        onClick={onCancel}
                        className="py-4 text-xs font-black text-neutral-400 hover:text-white hover:bg-white/5 transition-all border-r border-white/5"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        className="py-4 text-xs font-black text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all active:scale-95"
                    >
                        Remover
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

// ─────────────────────────── Meeting Calendar ────────────────────────────

const WEEKDAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function buildCalendarGrid(year: number, month: number): Date[] {
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay(); // 0=Sun
    const start = new Date(year, month, 1 - startOffset);
    return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
}

function isSameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function MeetingCalendar({
    meetings, academies, onNewMeeting, onMeetingClick, loading
}: {
    meetings: Meeting[];
    academies: Academy[];
    onNewMeeting: () => void;
    onMeetingClick: (m: Meeting) => void;
    loading: boolean;
}) {
    const [expanded, setExpanded] = useState(false);
    const [showPast, setShowPast] = useState(false);

    const now = new Date();

    const sorted = useMemo(() =>
        [...meetings].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()),
        [meetings]
    );

    const upcoming = sorted.filter(m => new Date(m.scheduledAt) >= now);
    const past = sorted.filter(m => new Date(m.scheduledAt) < now).reverse();

    const nextMeeting = upcoming[0];

    function formatMeetingDate(iso: string) {
        const d = new Date(iso);
        const diffMs = d.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / 86400000);
        const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const date = d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
        if (diffDays === 0) return `Hoje · ${time}`;
        if (diffDays === 1) return `Amanhã · ${time}`;
        return `${date} · ${time}`;
    }

    function MeetingRow({ m }: { m: Meeting }) {
        const academy = academies.find(a => a.id === m.academyId);
        const isPast = new Date(m.scheduledAt) < now;
        return (
            <button
                type="button"
                onClick={() => onMeetingClick(m)}
                className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-sm border transition-all group
                    ${isPast ? 'bg-white/[0.02] border-white/5 opacity-60 hover:opacity-100' : 'bg-white/5 border-white/5 hover:bg-amber-500/10 hover:border-amber-500/20'}`}
            >
                <div className={`w-8 h-8 rounded-sm flex items-center justify-center shrink-0 ${isPast ? 'bg-white/5' : 'bg-amber-500/10'}`}>
                    <Clock size={14} className={isPast ? 'text-white/30' : 'text-amber-400'} />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white truncate">{m.title}</p>
                    <p className="text-xs text-neutral-500 truncate">{academy?.name} · {formatMeetingDate(m.scheduledAt)} · {m.durationMin}min</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    {m.emailSent && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-sm text-[10px] font-bold text-green-400">
                            <CheckCircle size={10} />
                            Email
                        </span>
                    )}
                    <ArrowRight size={14} className="text-white/20 group-hover:text-amber-400 transition-colors" />
                </div>
            </button>
        );
    }

    return (
        <div className="bg-neutral-900 border border-white/10 rounded-md overflow-hidden">
            {/* Compact header — always visible */}
            <div
                role="button"
                tabIndex={0}
                onClick={() => setExpanded(p => !p)}
                onKeyDown={e => e.key === 'Enter' && setExpanded(p => !p)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.02] transition-colors cursor-pointer select-none"
            >
                <div className="w-8 h-8 rounded-sm bg-amber-500/15 flex items-center justify-center shrink-0">
                    <Video size={15} className="text-amber-400" />
                </div>
                <div className="flex-1 text-left">
                    <span className="text-sm font-black text-white">Reuniões Agendadas</span>
                    {!expanded && (
                        <span className="ml-2 text-xs text-white/30">
                            {loading ? '...' : upcoming.length > 0
                                ? `${upcoming.length} próxima${upcoming.length > 1 ? 's' : ''} · ${formatMeetingDate(upcoming[0].scheduledAt)}`
                                : 'Nenhuma reunião próxima'}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {upcoming.length > 0 && (
                        <span className="px-2 py-0.5 bg-amber-500/15 border border-amber-500/20 rounded-sm text-[10px] font-black text-amber-400">
                            {upcoming.length}
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={e => { e.stopPropagation(); onNewMeeting(); }}
                        className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded-sm font-bold text-xs transition-all active:scale-95"
                    >
                        <CalendarPlus size={13} />
                        Nova
                    </button>
                    <ChevronDown size={16} className={`text-white/30 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {/* Expanded content */}
            {expanded && (
                <div className="border-t border-white/5 p-4 space-y-3">
                    {loading ? (
                        <div className="py-6 flex justify-center">
                            <Loader2 size={20} className="animate-spin text-amber-500/40" />
                        </div>
                    ) : (
                        <>
                            {/* Upcoming */}
                            {upcoming.length === 0 ? (
                                <div className="py-6 text-center">
                                    <Calendar size={24} className="mx-auto text-white/10 mb-2" />
                                    <p className="text-white/30 text-xs">Nenhuma reunião agendada</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest px-1">Próximas</p>
                                    {upcoming.map(m => <MeetingRow key={m.id} m={m} />)}
                                </div>
                            )}

                            {/* Past meetings toggle */}
                            {past.length > 0 && (
                                <div>
                                    <button
                                        type="button"
                                        onClick={() => setShowPast(p => !p)}
                                        className="flex items-center gap-1.5 text-[11px] font-bold text-white/30 hover:text-white/60 transition-colors py-1"
                                    >
                                        <ChevronDown size={13} className={`transition-transform duration-200 ${showPast ? 'rotate-180' : ''}`} />
                                        {showPast ? 'Ocultar passadas' : `Ver ${past.length} passada${past.length > 1 ? 's' : ''}`}
                                    </button>
                                    {showPast && (
                                        <div className="space-y-2 mt-2">
                                            {past.map(m => <MeetingRow key={m.id} m={m} />)}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

// ─────────────────────────── New Meeting Modal ───────────────────────────

const DURATION_OPTIONS: MeetingDuration[] = [15, 30, 45, 60, 90, 120];

function TimePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const parts = value ? value.split(':') : ['', ''];
    const h = parts[0] || '';
    const m = parts[1] || '';
    const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
    const minutes = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
    const selClass = 'flex-1 bg-[#111] border border-white/10 rounded-sm text-white text-sm font-bold focus:border-amber-500/50 focus:outline-none transition-all appearance-none cursor-pointer hover:border-white/20 px-3 h-11 text-center [color-scheme:dark]';
    return (
        <div className="flex items-center gap-2">
            <select value={h} onChange={e => onChange(`${e.target.value}:${m || '00'}`)} className={selClass}>
                <option value="" disabled>-- h</option>
                {hours.map(hh => <option key={hh} value={hh}>{hh}h</option>)}
            </select>
            <span className="text-white/30 font-black text-lg select-none">:</span>
            <select value={m} onChange={e => onChange(`${h || '00'}:${e.target.value}`)} className={selClass}>
                <option value="" disabled>-- min</option>
                {minutes.map(mm => <option key={mm} value={mm}>{mm}min</option>)}
            </select>
        </div>
    );
}

function formatDuration(min: number) {
    if (min < 60) return `${min}min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m === 0 ? `${h}h` : `${h}h${m}`;
}

function NewMeetingModal({
    academies, currentUser, editing, onSave, onClose
}: {
    academies: Academy[];
    currentUser: User;
    editing: Meeting | null;
    onSave: (data: Partial<Meeting>, lang: 'pt' | 'en') => Promise<void>;
    onClose: () => void;
}) {
    const [selectedAcademyId, setSelectedAcademyId] = useState(editing?.academyId || '');
    const [academySearch, setAcademySearch] = useState('');
    const [title, setTitle] = useState(editing?.title || '');
    const [dateStr, setDateStr] = useState(editing ? editing.scheduledAt.slice(0, 10) : '');
    const [timeStr, setTimeStr] = useState(editing ? new Date(editing.scheduledAt).toTimeString().slice(0, 5) : '');
    const [durationMin, setDurationMin] = useState<MeetingDuration>(editing?.durationMin || 30);
    const [meetingLink, setMeetingLink] = useState(editing?.meetingLink || '');
    const [attendeeEmail, setAttendeeEmail] = useState(editing?.attendeeEmail || '');
    const [attendeeName, setAttendeeName] = useState(editing?.attendeeName || '');
    const [organizerEmail, setOrganizerEmail] = useState(editing?.organizerEmail || currentUser.email);
    const [extraEmails, setExtraEmails] = useState<string[]>(
        editing?.extraEmails ? editing.extraEmails.split(',').map(e => e.trim()).filter(Boolean) : []
    );
    const [lang, setLang] = useState<'pt' | 'en'>('pt');
    const [notes, setNotes] = useState(editing?.notes || '');
    const [saving, setSaving] = useState(false);

    const selectedAcademy = academies.find(a => a.id === selectedAcademyId);
    const filteredAcademies = useMemo(() =>
        academies.filter(a => a.name.toLowerCase().includes(academySearch.toLowerCase())).slice(0, 8),
        [academies, academySearch]
    );

    // Auto-fill attendee when academy changes
    const handleAcademySelect = (id: string) => {
        setSelectedAcademyId(id);
        setAcademySearch('');
        const academy = academies.find(a => a.id === id);
        if (academy) {
            if (!attendeeEmail) setAttendeeEmail(academy.email || '');
            if (!attendeeName) setAttendeeName(academy.responsible || '');
        }
    };

    const addExtraEmail = () => setExtraEmails(prev => [...prev, '']);
    const updateExtraEmail = (idx: number, val: string) =>
        setExtraEmails(prev => prev.map((e, i) => i === idx ? val : e));
    const removeExtraEmail = (idx: number) =>
        setExtraEmails(prev => prev.filter((_, i) => i !== idx));

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!title.trim() || !dateStr || !timeStr) return;
        setSaving(true);
        try {
            const scheduledAt = new Date(`${dateStr}T${timeStr}:00`).toISOString();
            const validExtras = extraEmails.filter(e => e.trim());
            await onSave({
                id: editing?.id,
                academyId: selectedAcademyId,
                createdBy: currentUser.id,
                title: title.trim(),
                scheduledAt,
                durationMin,
                meetingLink: meetingLink.trim() || undefined,
                notes: notes.trim() || undefined,
                attendeeEmail: attendeeEmail.trim() || undefined,
                attendeeName: attendeeName.trim() || undefined,
                organizerEmail: organizerEmail.trim() || currentUser.email,
                organizerName: currentUser.name,
                extraEmails: validExtras.length > 0 ? validExtras.join(',') : undefined,
            }, lang);
        } finally {
            setSaving(false);
        }
    }

    return createPortal(
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[120] animate-in fade-in duration-150">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-md w-full max-w-3xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-7 py-5 border-b border-white/5 flex justify-between items-center shrink-0">
                    <h3 className="text-base font-black text-white flex items-center gap-3">
                        <div className="w-9 h-9 rounded-sm bg-amber-500/20 flex items-center justify-center text-amber-400">
                            <CalendarPlus size={18} />
                        </div>
                        {editing ? 'Editar Reunião' : 'Nova Reunião'}
                    </h3>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-white/5 border border-white/10 rounded-sm p-1">
                            <button type="button" onClick={() => setLang('pt')} className={`px-3 py-1.5 rounded-sm text-xs font-black transition-all ${lang === 'pt' ? 'bg-amber-600 text-white' : 'text-neutral-500 hover:text-white'}`}>PT</button>
                            <button type="button" onClick={() => setLang('en')} className={`px-3 py-1.5 rounded-sm text-xs font-black transition-all ${lang === 'en' ? 'bg-amber-600 text-white' : 'text-neutral-500 hover:text-white'}`}>EN</button>
                        </div>
                        <button onClick={onClose} className="w-9 h-9 rounded-sm bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-2 gap-x-6 px-7 py-5">

                        {/* ── LEFT: meeting details ── */}
                        <div className="space-y-4">
                            {/* Academy */}
                            <div>
                                <label className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1.5 block">Academia</label>
                                {selectedAcademy ? (
                                    <div className="flex items-center justify-between px-4 py-3 bg-white/5 border border-amber-500/30 rounded-sm">
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-white">{selectedAcademy.name}</p>
                                            <p className="text-xs text-neutral-500">{selectedAcademy.city}, {selectedAcademy.state}</p>
                                            {selectedAcademy.email && (
                                                <p className="text-xs text-amber-500/70 mt-0.5 flex items-center gap-1">
                                                    <Mail size={10} />{selectedAcademy.email}
                                                </p>
                                            )}
                                        </div>
                                        <button type="button" onClick={() => setSelectedAcademyId('')} className="text-neutral-500 hover:text-red-400 transition-colors ml-2 shrink-0">
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Buscar academia..."
                                            className="w-full pl-10 pr-4 h-11 bg-white/5 border border-white/10 rounded-sm text-white text-sm focus:border-amber-500/50 focus:outline-none transition-all placeholder:text-white/20"
                                            value={academySearch}
                                            onChange={e => setAcademySearch(e.target.value)}
                                            autoFocus
                                        />
                                        {academySearch && (
                                            <div className="absolute top-full mt-1 w-full bg-neutral-900 border border-white/10 rounded-sm overflow-hidden z-10 shadow-2xl">
                                                {filteredAcademies.length === 0 && <div className="px-4 py-3 text-xs text-neutral-500">Nenhuma academia encontrada</div>}
                                                {filteredAcademies.map(a => (
                                                    <button key={a.id} type="button" onClick={() => handleAcademySelect(a.id)} className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                                                        <p className="text-sm font-bold text-white">{a.name}</p>
                                                        <p className="text-xs text-neutral-500">{a.city}, {a.state}{a.email ? ` · ${a.email}` : ''}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Title */}
                            <div>
                                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1.5 block">Assunto *</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Apresentação de proposta comercial"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-sm text-white text-sm focus:border-amber-500/50 focus:outline-none transition-all placeholder:text-white/20"
                                />
                            </div>

                            {/* Date & Time */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1.5 block">Data *</label>
                                    <input type="date" value={dateStr} onChange={e => setDateStr(e.target.value)} className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-sm text-white text-sm focus:border-amber-500/50 focus:outline-none transition-all [color-scheme:dark]" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1.5 block">Horário *</label>
                                    <TimePicker value={timeStr} onChange={setTimeStr} />
                                </div>
                            </div>

                            {/* Duration */}
                            <div>
                                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1.5 block">Duração estimada</label>
                                <div className="grid grid-cols-6 gap-1.5">
                                    {DURATION_OPTIONS.map(opt => (
                                        <button key={opt} type="button" onClick={() => setDurationMin(opt)} className={`py-2 rounded-sm border text-center text-[11px] font-black transition-all ${durationMin === opt ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : 'bg-white/5 border-white/5 text-neutral-500 hover:bg-white/10'}`}>
                                            {formatDuration(opt)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Meeting Link */}
                            <div>
                                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1.5 block">Link da Reunião (opcional)</label>
                                <div className="relative">
                                    <Video className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                                    <input type="url" placeholder="Ex: https://meet.google.com/abc-xyz" value={meetingLink} onChange={e => setMeetingLink(e.target.value)} className="w-full pl-10 pr-4 h-11 bg-white/5 border border-white/10 rounded-sm text-white text-sm focus:border-amber-500/50 focus:outline-none transition-all placeholder:text-white/20" />
                                </div>
                            </div>
                        </div>

                        {/* ── RIGHT: participants + notes ── */}
                        <div className="space-y-4">
                            {/* Participants */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Participantes</label>
                                    <button type="button" onClick={addExtraEmail} className="flex items-center gap-1 text-[10px] font-bold text-amber-400 hover:text-amber-300 transition-colors">
                                        <Plus size={11} />
                                        Adicionar
                                    </button>
                                </div>

                                {/* Main attendee */}
                                <div className="bg-white/[0.03] border border-white/[0.08] rounded-sm p-3 space-y-2">
                                    <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Convidado Principal</p>
                                    <input type="text" placeholder="Nome" value={attendeeName} onChange={e => setAttendeeName(e.target.value)} className="w-full h-9 px-3 bg-white/5 border border-white/10 rounded-sm text-white text-xs focus:border-amber-500/50 focus:outline-none transition-all placeholder:text-white/20" />
                                    <input type="email" placeholder="Email" value={attendeeEmail} onChange={e => setAttendeeEmail(e.target.value)} className="w-full h-9 px-3 bg-white/5 border border-white/10 rounded-sm text-white text-xs focus:border-amber-500/50 focus:outline-none transition-all placeholder:text-white/20" />
                                </div>

                                {/* Organizer */}
                                <div className="bg-white/[0.03] border border-white/[0.08] rounded-sm p-3 space-y-2">
                                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Seu Email (organizador)</p>
                                    <input type="email" value={organizerEmail} onChange={e => setOrganizerEmail(e.target.value)} className="w-full h-9 px-3 bg-white/5 border border-white/10 rounded-sm text-white text-xs focus:border-amber-500/50 focus:outline-none transition-all" />
                                </div>

                                {/* Extra recipients */}
                                {extraEmails.map((email, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <input type="email" placeholder={`Email adicional ${idx + 1}`} value={email} onChange={e => updateExtraEmail(idx, e.target.value)} className="flex-1 h-9 px-3 bg-white/5 border border-white/10 rounded-sm text-white text-xs focus:border-amber-500/50 focus:outline-none transition-all placeholder:text-white/20" />
                                        <button type="button" onClick={() => removeExtraEmail(idx)} className="w-9 h-9 rounded-sm bg-white/5 hover:bg-red-500/10 flex items-center justify-center text-white/30 hover:text-red-400 transition-all shrink-0">
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1.5 block">Observações (opcional)</label>
                                <textarea
                                    rows={4}
                                    placeholder="Ex: Trazer material de apresentação..."
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-sm text-white text-sm focus:border-amber-500/50 focus:outline-none transition-all resize-none placeholder:text-white/20"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 px-7 py-4 border-t border-white/5">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 text-neutral-400 hover:text-white transition-colors text-sm font-bold">
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving || !title.trim() || !dateStr || !timeStr}
                            className="min-w-[160px] bg-amber-600 hover:bg-amber-500 text-white px-5 py-2.5 rounded-sm font-bold text-sm transition-all shadow-lg hover:shadow-amber-500/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                            {editing ? 'Salvar Alterações' : 'Confirmar Reunião'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}

// ─────────────────────────── Email Confirmation Modal ────────────────────

function buildEmailBody(meeting: Meeting & { academyName: string }, lang: 'pt' | 'en'): string {
    const date = new Date(meeting.scheduledAt);
    const dateFormatted = date.toLocaleDateString(lang === 'pt' ? 'pt-BR' : 'en-US', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    const timeFormatted = date.toLocaleTimeString(lang === 'pt' ? 'pt-BR' : 'en-US', {
        hour: '2-digit', minute: '2-digit'
    });
    const dur = meeting.durationMin;
    const durStr = lang === 'pt'
        ? (dur < 60 ? `${dur} minutos` : (dur % 60 === 0 ? `${dur / 60}h` : `${Math.floor(dur / 60)}h${dur % 60}min`))
        : (dur < 60 ? `${dur} minutes` : (dur % 60 === 0 ? `${dur / 60}h` : `${Math.floor(dur / 60)}h${dur % 60}min`));
    const linkBlock = meeting.meetingLink
        ? (lang === 'pt'
            ? `<p><strong>Link da Reunião:</strong> <a href="${meeting.meetingLink}">${meeting.meetingLink}</a></p>`
            : `<p><strong>Meeting Link:</strong> <a href="${meeting.meetingLink}">${meeting.meetingLink}</a></p>`)
        : '';

    if (lang === 'pt') {
        return `<p>Olá, <strong>${meeting.attendeeName || 'Professor(a)'}</strong>!</p>
<p>Sua reunião com <strong>${meeting.organizerName}</strong> foi confirmada.</p>
<br>
<p><strong>Assunto:</strong> ${meeting.title}</p>
<p><strong>Data:</strong> ${dateFormatted}</p>
<p><strong>Horário:</strong> ${timeFormatted} (${durStr})</p>
<p><strong>Academia:</strong> ${meeting.academyName}</p>
${linkBlock}
<br>
<p>Em caso de dúvidas, responda este e-mail.</p>
<p>Atenciosamente,<br><strong>${meeting.organizerName}</strong></p>`;
    }
    return `<p>Hello, <strong>${meeting.attendeeName || 'Professor'}</strong>!</p>
<p>Your meeting with <strong>${meeting.organizerName}</strong> has been confirmed.</p>
<br>
<p><strong>Subject:</strong> ${meeting.title}</p>
<p><strong>Date:</strong> ${dateFormatted}</p>
<p><strong>Time:</strong> ${timeFormatted} (${durStr})</p>
<p><strong>Academy:</strong> ${meeting.academyName}</p>
${linkBlock}
<br>
<p>If you have any questions, please reply to this email.</p>
<p>Best regards,<br><strong>${meeting.organizerName}</strong></p>`;
}

function buildSubject(meeting: Meeting, lang: 'pt' | 'en'): string {
    const date = new Date(meeting.scheduledAt).toLocaleDateString(lang === 'pt' ? 'pt-BR' : 'en-US', {
        day: 'numeric', month: 'short'
    });
    return lang === 'pt'
        ? `Confirmação de Reunião: ${meeting.title} — ${date}`
        : `Meeting Confirmation: ${meeting.title} — ${date}`;
}

function EmailConfirmationModal({
    meeting, academyName, initialLang, onClose, onSent
}: {
    meeting: Meeting;
    academyName: string;
    initialLang?: 'pt' | 'en';
    onClose: () => void;
    onSent: (id: string) => void;
}) {
    const [lang, setLang] = useState<'pt' | 'en'>(initialLang ?? 'pt');
    const [bodyHtml, setBodyHtml] = useState(() => buildEmailBody({ ...meeting, academyName }, initialLang ?? 'pt'));
    const [sending, setSending] = useState(false);

    function handleLangChange(newLang: 'pt' | 'en') {
        setLang(newLang);
        setBodyHtml(buildEmailBody({ ...meeting, academyName }, newLang));
    }

    const subject = buildSubject(meeting, lang);

    async function handleSend() {
        setSending(true);
        try {
            const { supabase: sb } = await import('../lib/supabase-client');
            const res = await sb.functions.invoke('send-meeting-email', {
                body: {
                    meetingId: meeting.id,
                    meetingTitle: meeting.title,
                    scheduledAt: meeting.scheduledAt,
                    durationMin: meeting.durationMin,
                    academyName,
                    attendeeName: meeting.attendeeName || '',
                    attendeeEmail: meeting.attendeeEmail || '',
                    organizerName: meeting.organizerName || '',
                    organizerEmail: meeting.organizerEmail || '',
                    extraEmails: meeting.extraEmails || '',
                    subject,
                    bodyHtml,
                },
            });
            if (res.error || res.data?.error) {
                throw new Error(res.data?.error ?? res.error?.message ?? 'Erro desconhecido');
            }
            await DatabaseService.markMeetingEmailSent(meeting.id);
            onSent(meeting.id);
            const msg = lang === 'pt' ? 'Email de confirmação enviado!' : 'Confirmation email sent!';
            // Sonner toast
            const { toast } = await import('sonner');
            toast.success(msg);
            onClose();
        } catch (err: any) {
            const { toast } = await import('sonner');
            toast.error(`${lang === 'pt' ? 'Erro ao enviar' : 'Error sending'}: ${err.message}`);
        } finally {
            setSending(false);
        }
    }

    return createPortal(
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-[140] animate-in fade-in duration-150">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-t-3xl sm:rounded-md w-full sm:max-w-lg shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
                {/* Header */}
                <div className="p-5 border-b border-white/5 flex justify-between items-center shrink-0">
                    <h3 className="text-base font-black text-white flex items-center gap-3">
                        <div className="w-9 h-9 rounded-sm bg-amber-500/20 flex items-center justify-center text-amber-400">
                            <Mail size={18} />
                        </div>
                        {lang === 'pt' ? 'Enviar Confirmação' : 'Send Confirmation'}
                    </h3>
                    <div className="flex items-center gap-2">
                        {/* Language toggle */}
                        <div className="flex items-center bg-white/5 border border-white/10 rounded-sm p-1">
                            <button
                                type="button"
                                onClick={() => handleLangChange('pt')}
                                className={`px-3 py-1.5 rounded-sm text-xs font-black transition-all ${lang === 'pt' ? 'bg-amber-600 text-white' : 'text-neutral-500 hover:text-white'}`}
                            >
                                PT
                            </button>
                            <button
                                type="button"
                                onClick={() => handleLangChange('en')}
                                className={`px-3 py-1.5 rounded-sm text-xs font-black transition-all ${lang === 'en' ? 'bg-amber-600 text-white' : 'text-neutral-500 hover:text-white'}`}
                            >
                                EN
                            </button>
                        </div>
                        <button onClick={onClose} className="w-9 h-9 rounded-sm bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar">
                    {/* Recipients info */}
                    <div className="bg-white/[0.03] border border-white/8 rounded-sm p-4 space-y-2">
                        <div className="flex items-start gap-2">
                            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest w-14 shrink-0 mt-0.5">{lang === 'pt' ? 'Para' : 'To'}</span>
                            <span className="text-xs text-white/70">{meeting.attendeeName ? `${meeting.attendeeName} ` : ''}&lt;{meeting.attendeeEmail || '—'}&gt;</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest w-14 shrink-0 mt-0.5">CC</span>
                            <span className="text-xs text-white/70">
                                {[meeting.organizerEmail, ...(meeting.extraEmails ? meeting.extraEmails.split(',') : [])].filter(Boolean).join(', ') || '—'}
                            </span>
                        </div>
                        <div className="flex items-start gap-2 border-t border-white/5 pt-2">
                            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest w-14 shrink-0 mt-0.5">{lang === 'pt' ? 'Assunto' : 'Subject'}</span>
                            <span className="text-xs text-white/70">{subject}</span>
                        </div>
                    </div>

                    {!meeting.attendeeEmail && (
                        <div className="flex items-center gap-2 px-3 py-2.5 bg-orange-500/10 border border-orange-500/20 rounded-sm">
                            <AlertCircle size={14} className="text-orange-400 shrink-0" />
                            <p className="text-xs text-orange-300">
                                {lang === 'pt'
                                    ? 'Nenhum email cadastrado para esta academia. O email será enviado apenas para você.'
                                    : 'No email registered for this academy. The email will be sent only to you.'}
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/5">
                        <button type="button" onClick={onClose} className="px-5 py-3 text-neutral-400 hover:text-white transition-colors text-sm font-bold">
                            {lang === 'pt' ? 'Agora não' : 'Not now'}
                        </button>
                        <button
                            type="button"
                            onClick={handleSend}
                            disabled={sending}
                            className="min-w-[180px] bg-amber-600 hover:bg-amber-500 text-white px-5 py-3 rounded-sm font-bold text-sm transition-all shadow-lg hover:shadow-amber-500/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            {sending
                                ? (lang === 'pt' ? 'Enviando...' : 'Sending...')
                                : (lang === 'pt' ? 'Enviar Confirmação' : 'Send Confirmation')
                            }
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

// ─────────────────────────── Main Page ───────────────────────────────────

export const FollowUpPage: React.FC<FollowUpPageProps> = ({ academies, visits, events, vendedores, currentUser, onAcademyCreated }) => {
    const isAdmin = currentUser.role === UserRole.ADMIN;

    // ── Meetings state ──
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [meetingsLoading, setMeetingsLoading] = useState(true);
    const [showMeetingModal, setShowMeetingModal] = useState(false);
    const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
    const [emailMeeting, setEmailMeeting] = useState<Meeting | null>(null);
    const [emailMeetingLang, setEmailMeetingLang] = useState<'pt' | 'en'>('pt');

    // ── Follow-ups state ──
    const [followUps, setFollowUps] = useState<FollowUp[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingFollowUp, setEditingFollowUp] = useState<FollowUp | null>(null);
    const [logModalFollowUp, setLogModalFollowUp] = useState<FollowUp | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<FollowUpStatus | ''>('');
    const [filterChannel, setFilterChannel] = useState<ContactChannel | ''>('');
    const [filterOwner, setFilterOwner] = useState<string>('');

    const loadMeetings = useCallback(async () => {
        setMeetingsLoading(true);
        try {
            const data = await DatabaseService.getMeetings();
            setMeetings(data);
        } catch (err) {
            console.error('[Meetings] Error loading:', err);
        } finally {
            setMeetingsLoading(false);
        }
    }, []);

    useEffect(() => { loadMeetings(); }, [loadMeetings]);

    useEffect(() => {
        const ch = supabase
            .channel('meetings-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'meetings' }, () => {
                loadMeetings();
            })
            .subscribe();
        return () => { supabase.removeChannel(ch); };
    }, [loadMeetings]);

    const handleSaveMeeting = async (data: Partial<Meeting>, lang: 'pt' | 'en' = 'pt') => {
        if (data.id) {
            const updated = await DatabaseService.updateMeeting(data.id, data);
            setMeetings(prev => prev.map(m => m.id === updated.id ? updated : m));
            setShowMeetingModal(false);
            setEditingMeeting(null);
        } else {
            const created = await DatabaseService.createMeeting(data);
            setMeetings(prev => [created, ...prev]);
            setShowMeetingModal(false);
            setEditingMeeting(null);
            setEmailMeetingLang(lang);
            setEmailMeeting(created);
        }
    };

    const loadFollowUps = useCallback(async () => {
        setLoading(true);
        try {
            const data = await DatabaseService.getFollowUps();
            setFollowUps(data);
        } catch (err) {
            console.error('[FollowUp] Error loading:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadFollowUps(); }, [loadFollowUps]);

    // Realtime: sincroniza follow-ups entre todos os membros da equipe
    useEffect(() => {
        const channel = supabase
            .channel('follow-ups-realtime')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'follow_ups' }, async () => {
                // Re-fetch para obter o registro completo com todos os campos mapeados
                const data = await DatabaseService.getFollowUps();
                setFollowUps(data);
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'follow_ups' }, async () => {
                const data = await DatabaseService.getFollowUps();
                setFollowUps(data);
            })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'follow_ups' }, (payload: any) => {
                setFollowUps(prev => prev.filter(f => f.id !== payload.old?.id));
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    function buildUpdateNote(existing: FollowUp, data: Partial<FollowUp>): string {
        const changes: string[] = [];
        if (data.contactChannel && data.contactChannel !== existing.contactChannel)
            changes.push(`canal → ${CHANNEL_CONFIG[data.contactChannel].label}`);
        if (data.contactPerson !== undefined && data.contactPerson !== existing.contactPerson)
            changes.push(`contato → ${data.contactPerson || 'sem nome'}`);
        if (data.nextContactAt !== existing.nextContactAt)
            changes.push(data.nextContactAt ? `próximo contato → ${formatDate(data.nextContactAt)}` : 'data de contato removida');
        if (data.notes !== existing.notes)
            changes.push('observações atualizadas');
        return changes.join(', ') || 'informações atualizadas';
    }

    const handleSave = async (data: Partial<FollowUp>) => {
        if (data.id) {
            const existing = followUps.find(f => f.id === data.id);
            const updated = await DatabaseService.updateFollowUp(data.id, data);
            setFollowUps(prev => prev.map(f => f.id === updated.id ? updated : f));

            const statusChanged = existing && data.status && data.status !== existing.status;
            await DatabaseService.createFollowUpLog({
                followUpId: data.id,
                userId: currentUser.id,
                userName: currentUser.name,
                action: statusChanged ? 'STATUS_ALTERADO' : 'ATUALIZADO',
                fromStatus: existing?.status,
                toStatus: data.status as FollowUpStatus,
                note: existing && !statusChanged ? buildUpdateNote(existing, data) : undefined,
            });
        } else {
            const created = await DatabaseService.createFollowUp({ ...data, createdBy: currentUser.id });
            setFollowUps(prev => [created, ...prev]);

            await DatabaseService.createFollowUpLog({
                followUpId: created.id,
                userId: currentUser.id,
                userName: currentUser.name,
                action: 'CRIADO',
                toStatus: created.status,
            });
        }
        setShowModal(false);
        setEditingFollowUp(null);
    };

    const handleDelete = (id: string) => setDeleteConfirmId(id);

    const confirmDelete = async () => {
        if (!deleteConfirmId) return;
        await DatabaseService.deleteFollowUp(deleteConfirmId);
        setFollowUps(prev => prev.filter(f => f.id !== deleteConfirmId));
        setDeleteConfirmId(null);
    };

    // ── Filtering ──
    const filtered = useMemo(() => {
        return followUps.filter(f => {
            const academy = academies.find(a => a.id === f.academyId);
            const matchSearch = !searchTerm ||
                academy?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                f.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                f.notes?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchStatus = !filterStatus || f.status === filterStatus;
            const matchChannel = !filterChannel || f.contactChannel === filterChannel;
            const matchOwner = !filterOwner || f.createdBy === filterOwner;
            return matchSearch && matchStatus && matchChannel && matchOwner;
        });
    }, [followUps, academies, searchTerm, filterStatus, filterChannel, filterOwner]);

    // ── Stats ──
    const stats = useMemo(() => {
        const counts: Record<string, number> = {};
        KANBAN_ORDER.forEach(s => { counts[s] = followUps.filter(f => f.status === s).length; });
        return counts;
    }, [followUps]);

    const overdueCount = useMemo(() => followUps.filter(f => isOverdue(f)).length, [followUps]);

    // ── Kanban groups ──
    const kanbanGroups = useMemo(() => {
        return KANBAN_ORDER.map(status => ({
            status,
            items: filtered.filter(f => f.status === status)
        }));
    }, [filtered]);

    // ── Open modal ──
    const openNew = () => { setEditingFollowUp(null); setShowModal(true); };
    const openEdit = (fu: FollowUp) => { setEditingFollowUp(fu); setShowModal(true); };

    const getCreator = (fu: FollowUp) => vendedores.find(v => v.id === fu.createdBy);

    return (
        <div className="space-y-6 pb-24">
            {/* ── Meetings Calendar ── */}
            <MeetingCalendar
                meetings={meetings}
                academies={academies}
                onNewMeeting={() => { setEditingMeeting(null); setShowMeetingModal(true); }}
                onMeetingClick={(m) => { setEditingMeeting(m); setShowMeetingModal(true); }}
                loading={meetingsLoading}
            />

            {/* ── Header ── */}
            <div className="pb-6 border-b border-white/5 mb-6">
                <div className="hidden" />
                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <div>
                            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                                Follow-Up
                            </h1>
                            <p className="text-white/50 text-sm mt-0.5">Monitoramento de retorno dos professores</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* View toggle */}
                            <div className="flex bg-white/5 border border-white/10 rounded-sm p-1">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-sm transition-all ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-neutral-500 hover:text-white'}`}
                                    title="Visão Lista"
                                >
                                    <LayoutList size={16} />
                                </button>
                                <button
                                    onClick={() => setViewMode('kanban')}
                                    className={`p-2 rounded-sm transition-all ${viewMode === 'kanban' ? 'bg-white/10 text-white' : 'text-neutral-500 hover:text-white'}`}
                                    title="Visão Kanban"
                                >
                                    <Columns size={16} />
                                </button>
                            </div>

                            <button
                                onClick={openNew}
                                className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2.5 rounded-sm font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95 text-sm"
                            >
                                <Plus size={16} strokeWidth={3} />
                                Novo Follow-Up
                            </button>
                        </div>
                    </div>

                    {/* Stats row */}
                    <div className="flex gap-2 flex-wrap mb-5">
                        {KANBAN_ORDER.map(s => stats[s] > 0 && <StatBadge key={s} status={s} count={stats[s]} />)}
                        {overdueCount > 0 && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/5 rounded-sm">
                                <AlertCircle size={12} className="text-red-400" />
                                <span className="text-[11px] font-bold text-red-400">{overdueCount} vencidos</span>
                            </div>
                        )}
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="relative md:col-span-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar academia, contato..."
                                className="w-full pl-10 pr-4 h-11 bg-black/40 border border-white/5 rounded-sm text-white text-sm placeholder:text-white/20 focus:border-amber-500/50 focus:outline-none transition-all"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <select
                                value={filterStatus}
                                onChange={e => setFilterStatus(e.target.value as any)}
                                className="w-full h-11 pl-4 pr-8 bg-black/40 border border-white/5 rounded-sm text-white text-sm focus:border-amber-500/50 focus:outline-none transition-all appearance-none"
                            >
                                <option value="">Todos os status</option>
                                {KANBAN_ORDER.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                        </div>
                        <div className="relative">
                            <select
                                value={filterChannel}
                                onChange={e => setFilterChannel(e.target.value as any)}
                                className="w-full h-11 pl-4 pr-8 bg-black/40 border border-white/5 rounded-sm text-white text-sm focus:border-amber-500/50 focus:outline-none transition-all appearance-none"
                            >
                                <option value="">Todos os canais</option>
                                {Object.entries(CHANNEL_CONFIG).map(([key, cfg]) => <option key={key} value={key}>{cfg.label}</option>)}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                        </div>
                        {isAdmin && (
                            <div className="relative md:col-span-4">
                                <select
                                    value={filterOwner}
                                    onChange={e => setFilterOwner(e.target.value)}
                                    className="w-full md:w-auto h-11 pl-4 pr-8 bg-black/40 border border-white/5 rounded-sm text-white text-sm focus:border-amber-500/50 focus:outline-none transition-all appearance-none"
                                >
                                    <option value="">Todos os usuários</option>
                                    {vendedores.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                </select>
                                <ChevronDown size={14} className="absolute right-[calc(100%-2rem)] md:right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Loading ── */}
            {loading && (
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={32} className="animate-spin text-amber-500/50" />
                </div>
            )}

            {/* ── Empty ── */}
            {!loading && filtered.length === 0 && (
                <div className="text-center py-20 space-y-4">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                        <TrendingUp size={32} className="text-white/20" />
                    </div>
                    <div>
                        <p className="text-white/30 font-bold">Nenhum follow-up encontrado</p>
                        <p className="text-white/20 text-sm mt-1">Clique em "Novo Follow-Up" para começar a monitorar.</p>
                    </div>
                    <button onClick={openNew} className="inline-flex items-center gap-2 bg-amber-600/40 hover:bg-amber-600/60 border border-amber-500/30 text-amber-400 px-5 py-2.5 rounded-sm font-bold text-sm transition-all">
                        <Plus size={16} /> Criar o primeiro Follow-Up
                    </button>
                </div>
            )}

            {/* ── List view ── */}
            {!loading && filtered.length > 0 && viewMode === 'list' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map(fu => (
                        <FollowUpCard
                            key={fu.id}
                            followUp={fu}
                            academy={academies.find(a => a.id === fu.academyId)}
                            creator={getCreator(fu)}
                            onEdit={() => openEdit(fu)}
                            onDelete={() => handleDelete(fu.id)}
                            onViewLog={() => setLogModalFollowUp(fu)}
                        />
                    ))}
                </div>
            )}

            {/* ── Kanban view ── */}
            {!loading && filtered.length > 0 && viewMode === 'kanban' && (
                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                    {kanbanGroups.map(({ status, items }) => {
                        const cfg = STATUS_CONFIG[status];
                        return (
                            <div key={status} className="flex-shrink-0 w-72">
                                {/* Column header */}
                                <div className="flex items-center gap-2 px-2 py-1 mb-3">
                                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">{cfg.label}</span>
                                    <span className="ml-auto text-[11px] font-black text-neutral-500 bg-white/5 px-2 py-0.5 rounded-md">{items.length}</span>
                                </div>

                                {/* Cards */}
                                <div className="space-y-3">
                                    {items.map(fu => (
                                        <FollowUpCard
                                            key={fu.id}
                                            followUp={fu}
                                            academy={academies.find(a => a.id === fu.academyId)}
                                            creator={getCreator(fu)}
                                            onEdit={() => openEdit(fu)}
                                            onDelete={() => handleDelete(fu.id)}
                                            onViewLog={() => setLogModalFollowUp(fu)}
                                        />
                                    ))}
                                    {items.length === 0 && (
                                        <div className="py-8 text-center">
                                            <Building2 size={24} className="mx-auto text-white/10 mb-2" />
                                            <p className="text-white/20 text-xs">Nenhum aqui</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Delete Confirm ── */}
            {deleteConfirmId && (
                <DeleteConfirmModal
                    onConfirm={confirmDelete}
                    onCancel={() => setDeleteConfirmId(null)}
                />
            )}

            {/* ── Log Modal ── */}
            {logModalFollowUp && (
                <FollowUpLogModal
                    followUp={logModalFollowUp}
                    academy={academies.find(a => a.id === logModalFollowUp.academyId)}
                    onClose={() => setLogModalFollowUp(null)}
                />
            )}

            {/* ── Edit/Create Follow-Up Modal ── */}
            {showModal && (
                <FollowUpModal
                    academies={academies}
                    visits={visits}
                    events={events}
                    currentUser={currentUser}
                    editing={editingFollowUp}
                    onSave={handleSave}
                    onClose={() => { setShowModal(false); setEditingFollowUp(null); }}
                    isAdmin={isAdmin}
                    vendedores={vendedores}
                    onAcademyCreated={onAcademyCreated}
                />
            )}

            {/* ── New/Edit Meeting Modal ── */}
            {showMeetingModal && (
                <NewMeetingModal
                    academies={academies}
                    currentUser={currentUser}
                    editing={editingMeeting}
                    onSave={handleSaveMeeting}
                    onClose={() => { setShowMeetingModal(false); setEditingMeeting(null); }}
                />
            )}

            {/* ── Email Confirmation Modal ── */}
            {emailMeeting && (
                <EmailConfirmationModal
                    meeting={emailMeeting}
                    academyName={academies.find(a => a.id === emailMeeting.academyId)?.name || ''}
                    initialLang={emailMeetingLang}
                    onClose={() => setEmailMeeting(null)}
                    onSent={(id) => {
                        setMeetings(prev => prev.map(m => m.id === id ? { ...m, emailSent: true } : m));
                        setEmailMeeting(null);
                    }}
                />
            )}
        </div>
    );
};
