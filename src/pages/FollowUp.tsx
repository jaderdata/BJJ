import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
    Plus, X, Phone, MessageCircle, Users, Search, Calendar,
    Edit3, Trash2, ChevronDown, LayoutList, Columns, Clock,
    TrendingUp, AlertCircle, CheckCircle, Loader2, Building2,
    History, ArrowRight, Pencil, Sparkles
} from 'lucide-react';
import { Academy, User, Visit, FollowUp, FollowUpLog, FollowUpStatus, ContactChannel, UserRole } from '../types';
import { DatabaseService } from '../lib/supabase';

interface FollowUpPageProps {
    academies: Academy[];
    visits: Visit[];
    vendedores: User[];
    currentUser: User;
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
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${cfg.bg} border ${cfg.border}`}>
            <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
            <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
            <span className={`text-xs font-black ${cfg.color}`}>{count}</span>
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
        <div className={`group relative bg-neutral-800/50 border ${overdue ? 'border-red-500/40 shadow-red-900/10 shadow-lg' : 'border-white/5'} rounded-2xl p-4 hover:bg-neutral-800/70 transition-all duration-200 hover:border-white/10`}>
            {/* Status pill */}
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${cfg.bg} border ${cfg.border} mb-3`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                <span className={`text-[10px] font-black uppercase tracking-widest ${cfg.color}`}>{cfg.label}</span>
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
                        <span className="w-3.5 h-3.5 rounded-full bg-indigo-500/30 text-indigo-400 flex items-center justify-center text-[8px] font-black shrink-0">
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
                        className="p-1.5 text-neutral-500 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-all"
                        title="Ver histórico de atividades"
                    >
                        <History size={12} />
                    </button>
                    <button
                        onClick={onEdit}
                        className="p-1.5 text-neutral-500 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                    >
                        <Edit3 size={12} />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
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
        if (action === 'STATUS_ALTERADO') return 'text-indigo-400 bg-indigo-500/15 border-indigo-500/20';
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
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-5 border-b border-white/5 flex justify-between items-start shrink-0">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                <History size={14} />
                            </div>
                            <h3 className="text-sm font-black text-white">Histórico de Atividades</h3>
                        </div>
                        <p className="text-xs text-neutral-500 pl-9">{academy?.name ?? 'Academia'}</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all shrink-0">
                        <X size={16} />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto custom-scrollbar p-5">
                    {loading && (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 size={24} className="animate-spin text-indigo-500/40" />
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
                                        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${actionColor(log.action)}`}>
                                            {actionIcon(log.action)}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0 pt-1">
                                            <p className="text-xs text-white/80 leading-snug">{actionLabel(log)}</p>
                                            {log.note && log.action !== 'ATUALIZADO' && (
                                                <p className="text-[10px] text-neutral-500 mt-0.5 italic">{log.note}</p>
                                            )}
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-400">
                                                    <span className="w-3.5 h-3.5 rounded-full bg-indigo-500/30 flex items-center justify-center text-[8px] font-black">
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
    currentUser: User;
    editing: FollowUp | null;
    onSave: (data: Partial<FollowUp>) => Promise<void>;
    onClose: () => void;
    isAdmin: boolean;
    vendedores: User[];
}

function FollowUpModal({ academies, visits, currentUser, editing, onSave, onClose, isAdmin, vendedores }: ModalProps) {
    const [academySearch, setAcademySearch] = useState('');
    const [selectedAcademyId, setSelectedAcademyId] = useState(editing?.academyId ?? '');
    const [status, setStatus] = useState<FollowUpStatus>(editing?.status ?? FollowUpStatus.WAITING);
    const [channel, setChannel] = useState<ContactChannel>(editing?.contactChannel ?? ContactChannel.CALL);
    const [contactPerson, setContactPerson] = useState(editing?.contactPerson ?? '');
    const [notes, setNotes] = useState(editing?.notes ?? '');
    const [nextContactAt, setNextContactAt] = useState(editing?.nextContactAt ? editing.nextContactAt.split('T')[0] : '');
    const [visitId, setVisitId] = useState(editing?.visitId ?? '');
    const [saving, setSaving] = useState(false);

    const filteredAcademies = useMemo(() =>
        academies
            .filter(a => a.status === 'ACTIVE' || !a.status)
            .filter(a => a.name.toLowerCase().includes(academySearch.toLowerCase()))
            .slice(0, 8),
        [academies, academySearch]
    );

    const selectedAcademy = academies.find(a => a.id === selectedAcademyId);

    // Visits related to this academy for linking
    const relatedVisits = visits.filter(v => v.academyId === selectedAcademyId);

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
                createdBy: editing?.createdBy ?? currentUser.id,
                ...(editing ? { id: editing.id } : {})
            });
        } finally {
            setSaving(false);
        }
    };
    return createPortal(
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[120] animate-in fade-in duration-200">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02] shrink-0">
                    <h3 className="text-lg font-black text-white flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                            {editing ? <Edit3 size={18} /> : <Plus size={18} />}
                        </div>
                        {editing ? 'Editar Follow-Up' : 'Novo Follow-Up'}
                    </h3>
                    <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
                    {/* Academy Search */}
                    <div>
                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5 block">Academia *</label>
                        {selectedAcademy ? (
                            <div className="flex items-center justify-between px-4 py-3 bg-white/5 border border-indigo-500/30 rounded-xl">
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
                                    className="w-full pl-10 pr-4 h-12 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-indigo-500/50 focus:outline-none transition-all placeholder:text-white/20"
                                    value={academySearch}
                                    onChange={e => setAcademySearch(e.target.value)}
                                    autoFocus
                                />
                                {academySearch && (
                                    <div className="absolute top-full mt-1 w-full bg-neutral-900 border border-white/10 rounded-xl overflow-hidden z-10 shadow-2xl">
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
                    </div>

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
                                        className={`py-2.5 px-3 rounded-xl border text-center transition-all ${status === s ? `${cfg.bg} ${cfg.border} ${cfg.color}` : 'bg-white/5 border-white/5 text-neutral-500 hover:bg-white/10'}`}
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
                                        className={`py-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${isActive ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400' : 'bg-white/5 border-white/5 text-neutral-500 hover:bg-white/10'}`}
                                    >
                                        <Icon size={16} />
                                        <span className="text-[10px] font-bold uppercase tracking-wide">{cfg.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Contact Person */}
                    <div>
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1.5 block">Contato (nome)</label>
                        <input
                            type="text"
                            placeholder="Ex: Professor João"
                            value={contactPerson}
                            onChange={e => setContactPerson(e.target.value)}
                            className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-indigo-500/50 focus:outline-none transition-all placeholder:text-white/20"
                        />
                    </div>

                    {/* Next contact date */}
                    <div>
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1.5 block">Próximo Contato</label>
                        <input
                            type="date"
                            value={nextContactAt}
                            onChange={e => setNextContactAt(e.target.value)}
                            className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-indigo-500/50 focus:outline-none transition-all [color-scheme:dark]"
                        />
                    </div>

                    {/* Link to visit */}
                    {selectedAcademyId && relatedVisits.length > 0 && (
                        <div>
                            <label className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1.5 block">Vincular a uma Visita (opcional)</label>
                            <select
                                value={visitId}
                                onChange={e => setVisitId(e.target.value)}
                                className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-indigo-500/50 focus:outline-none transition-all"
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

                    {/* Notes */}
                    <div>
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1.5 block">Observações</label>
                        <textarea
                            rows={3}
                            placeholder="Ex: Professor mostrou interesse em pacote anual..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-indigo-500/50 focus:outline-none transition-all resize-none placeholder:text-white/20"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/5">
                        <button type="button" onClick={onClose} className="px-6 py-3 text-neutral-400 hover:text-white transition-colors text-sm font-bold">
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving || !selectedAcademyId}
                            className="min-w-[160px] bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

// ─────────────────────────── Main Page ───────────────────────────────────

export const FollowUpPage: React.FC<FollowUpPageProps> = ({ academies, visits, vendedores, currentUser }) => {
    const isAdmin = currentUser.role === UserRole.ADMIN;

    const [followUps, setFollowUps] = useState<FollowUp[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingFollowUp, setEditingFollowUp] = useState<FollowUp | null>(null);
    const [logModalFollowUp, setLogModalFollowUp] = useState<FollowUp | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<FollowUpStatus | ''>('');
    const [filterChannel, setFilterChannel] = useState<ContactChannel | ''>('');
    const [filterOwner, setFilterOwner] = useState<string>('');

    const loadFollowUps = useCallback(async () => {
        setLoading(true);
        try {
            // ADMIN sees all; SALES/CALL_CENTER see only their own
            const data = await DatabaseService.getFollowUps();
            setFollowUps(data);
        } catch (err) {
            console.error('[FollowUp] Error loading:', err);
        } finally {
            setLoading(false);
        }
    }, [isAdmin, currentUser.id]);

    useEffect(() => { loadFollowUps(); }, [loadFollowUps]);

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

    const handleDelete = async (id: string) => {
        if (!confirm('Remover este follow-up?')) return;
        await DatabaseService.deleteFollowUp(id);
        setFollowUps(prev => prev.filter(f => f.id !== id));
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
            {/* ── Header ── */}
            <div className="relative overflow-hidden bg-neutral-900 border border-white/10 p-6 rounded-2xl shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/8 to-transparent" />
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
                            <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-neutral-500 hover:text-white'}`}
                                    title="Visão Lista"
                                >
                                    <LayoutList size={16} />
                                </button>
                                <button
                                    onClick={() => setViewMode('kanban')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-indigo-600 text-white' : 'text-neutral-500 hover:text-white'}`}
                                    title="Visão Kanban"
                                >
                                    <Columns size={16} />
                                </button>
                            </div>

                            <button
                                onClick={openNew}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95 text-sm"
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
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20">
                                <AlertCircle size={12} className="text-red-400" />
                                <span className="text-xs font-black text-red-400">{overdueCount} vencidos</span>
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
                                className="w-full pl-10 pr-4 h-11 bg-black/40 border border-white/5 rounded-xl text-white text-sm placeholder:text-white/20 focus:border-indigo-500/50 focus:outline-none transition-all"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <select
                                value={filterStatus}
                                onChange={e => setFilterStatus(e.target.value as any)}
                                className="w-full h-11 pl-4 pr-8 bg-black/40 border border-white/5 rounded-xl text-white text-sm focus:border-indigo-500/50 focus:outline-none transition-all appearance-none"
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
                                className="w-full h-11 pl-4 pr-8 bg-black/40 border border-white/5 rounded-xl text-white text-sm focus:border-indigo-500/50 focus:outline-none transition-all appearance-none"
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
                                    className="w-full md:w-auto h-11 pl-4 pr-8 bg-black/40 border border-white/5 rounded-xl text-white text-sm focus:border-indigo-500/50 focus:outline-none transition-all appearance-none"
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
                    <Loader2 size={32} className="animate-spin text-indigo-500/50" />
                </div>
            )}

            {/* ── Empty ── */}
            {!loading && filtered.length === 0 && (
                <div className="text-center py-20 space-y-4">
                    <div className="w-20 h-20 bg-indigo-500/5 rounded-full flex items-center justify-center mx-auto">
                        <TrendingUp size={32} className="text-indigo-500/30" />
                    </div>
                    <div>
                        <p className="text-white/30 font-bold">Nenhum follow-up encontrado</p>
                        <p className="text-white/20 text-sm mt-1">Clique em "Novo Follow-Up" para começar a monitorar.</p>
                    </div>
                    <button onClick={openNew} className="inline-flex items-center gap-2 bg-indigo-600/40 hover:bg-indigo-600/60 border border-indigo-500/30 text-indigo-400 px-5 py-2.5 rounded-xl font-bold text-sm transition-all">
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
                                <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${cfg.bg} border ${cfg.border} mb-3`}>
                                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                                    <span className={`text-xs font-black uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
                                    <span className={`ml-auto text-xs font-bold ${cfg.color} opacity-70`}>{items.length}</span>
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

            {/* ── Log Modal ── */}
            {logModalFollowUp && (
                <FollowUpLogModal
                    followUp={logModalFollowUp}
                    academy={academies.find(a => a.id === logModalFollowUp.academyId)}
                    onClose={() => setLogModalFollowUp(null)}
                />
            )}

            {/* ── Edit/Create Modal ── */}
            {showModal && (
                <FollowUpModal
                    academies={academies}
                    visits={visits}
                    currentUser={currentUser}
                    editing={editingFollowUp}
                    onSave={handleSave}
                    onClose={() => { setShowModal(false); setEditingFollowUp(null); }}
                    isAdmin={isAdmin}
                    vendedores={vendedores}
                />
            )}
        </div>
    );
};
