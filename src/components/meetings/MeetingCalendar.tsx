import React, { useState, useMemo } from 'react';
import { Clock, Calendar, Loader2, ChevronDown, CalendarPlus, Video, CheckCircle, ArrowRight, UserCheck, Trash2, X } from 'lucide-react';
import { Meeting, Academy } from '../../types';
import { DatabaseService } from '../../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

interface MeetingCalendarProps {
    meetings: Meeting[];
    academies: Academy[];
    onNewMeeting: () => void;
    onMeetingClick: (m: Meeting) => void;
    loading: boolean;
}

function formatMeetingDate(iso: string, now: Date): string {
    const d = new Date(iso);
    const diffMs = d.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / 86400000);
    const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const date = d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
    if (diffDays === 0) return `Hoje · ${time}`;
    if (diffDays === 1) return `Amanhã · ${time}`;
    return `${date} · ${time}`;
}

function MeetingRow({ m, academies, onMeetingClick, now }: {
    m: Meeting;
    academies: Academy[];
    onMeetingClick: (m: Meeting) => void;
    now: Date;
}) {
    const queryClient = useQueryClient();
    const [toggling, setToggling] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    async function handleDelete(e: React.MouseEvent) {
        e.stopPropagation();
        if (!confirmDelete) { setConfirmDelete(true); return; }
        setDeleting(true);
        try {
            await DatabaseService.deleteMeeting(m.id);
            queryClient.invalidateQueries({ queryKey: ['meetings'] });
        } catch (err) {
            console.error('[MeetingRow] delete error:', err);
        } finally {
            setDeleting(false);
            setConfirmDelete(false);
        }
    }

    const academy = academies.find(a => a.id === m.academyId);
    const isPast = new Date(m.scheduledAt) < now;
    const isConfirmed = !!m.confirmedAt;

    const confirmedLabel = isConfirmed
        ? new Date(m.confirmedAt!).toLocaleString('pt-BR', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
        })
        : null;

    async function handleToggleConfirm(e: React.MouseEvent) {
        e.stopPropagation();
        setToggling(true);
        try {
            if (isConfirmed) {
                await DatabaseService.unconfirmMeeting(m.id);
            } else {
                await DatabaseService.confirmMeeting(m.id);
            }
            queryClient.invalidateQueries({ queryKey: ['meetings'] });
        } catch (err) {
            console.error('[MeetingRow] toggleConfirm error:', err);
        } finally {
            setToggling(false);
        }
    }

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => onMeetingClick(m)}
            onKeyDown={e => e.key === 'Enter' && onMeetingClick(m)}
            className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-sm border transition-all group cursor-pointer
                ${isPast ? 'bg-white/[0.02] border-white/5 opacity-60 hover:opacity-100' : 'bg-white/5 border-white/5 hover:bg-amber-500/10 hover:border-amber-500/20'}`}
        >
            <div className={`w-8 h-8 rounded-sm flex items-center justify-center shrink-0 ${isPast ? 'bg-white/5' : 'bg-amber-500/10'}`}>
                <Clock size={14} className={isPast ? 'text-white/30' : 'text-amber-400'} />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white truncate">{m.title}</p>
                <p className="text-xs text-neutral-500 truncate">
                    {academy?.name} · {formatMeetingDate(m.scheduledAt, now)} · {m.durationMin}min
                    {m.recurrence && m.recurrence !== 'none' && (
                        <span className="ml-1 text-amber-500/60">↻</span>
                    )}
                </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
                {m.emailSent && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-sm text-[10px] font-bold text-green-400">
                        <CheckCircle size={10} />
                        Email
                    </span>
                )}
                {/* Confirmed badge */}
                {isConfirmed && (
                    <span
                        title={`Confirmado em ${confirmedLabel}`}
                        className="flex items-center gap-1 px-2 py-1 bg-emerald-500/15 border border-emerald-500/30 rounded-sm text-[10px] font-bold text-emerald-400"
                    >
                        <UserCheck size={10} />
                        Confirmado
                    </span>
                )}
                {/* Manual confirm/unconfirm toggle */}
                <button
                    type="button"
                    onClick={handleToggleConfirm}
                    disabled={toggling}
                    title={isConfirmed ? 'Remover confirmação' : 'Marcar como confirmado'}
                    className={`w-7 h-7 rounded-sm flex items-center justify-center transition-all shrink-0
                        ${isConfirmed
                            ? 'bg-emerald-500/10 hover:bg-red-500/10 text-emerald-400 hover:text-red-400'
                            : 'bg-white/5 hover:bg-emerald-500/10 text-white/20 hover:text-emerald-400'
                        } disabled:opacity-40`}
                >
                    {toggling
                        ? <Loader2 size={11} className="animate-spin" />
                        : <UserCheck size={11} />
                    }
                </button>
                {confirmDelete ? (
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={deleting}
                            className="flex items-center gap-1 px-2 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded-sm text-[10px] font-bold text-red-400 transition-all"
                        >
                            {deleting ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />}
                            Excluir
                        </button>
                        <button
                            type="button"
                            onClick={e => { e.stopPropagation(); setConfirmDelete(false); }}
                            className="w-6 h-6 rounded-sm bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all"
                        >
                            <X size={11} />
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="w-7 h-7 rounded-sm flex items-center justify-center text-white/0 group-hover:text-white/20 hover:!text-red-400 hover:bg-red-500/10 transition-all shrink-0"
                        title="Excluir reunião"
                    >
                        <Trash2 size={13} />
                    </button>
                )}
                <ArrowRight size={14} className="text-white/20 group-hover:text-amber-400 transition-colors" />
            </div>
        </div>
    );
}


export function MeetingCalendar({ meetings, academies, onNewMeeting, onMeetingClick, loading }: MeetingCalendarProps) {
    const [expanded, setExpanded] = useState(false);
    const [showPast, setShowPast] = useState(false);

    const now = useMemo(() => new Date(), []);

    const sorted = useMemo(() =>
        [...meetings].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()),
        [meetings]
    );

    const upcoming = sorted.filter(m => new Date(m.scheduledAt) >= now);
    const past = sorted.filter(m => new Date(m.scheduledAt) < now).reverse();

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
                                ? `${upcoming.length} próxima${upcoming.length > 1 ? 's' : ''} · ${formatMeetingDate(upcoming[0].scheduledAt, now)}`
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
                            {upcoming.length === 0 ? (
                                <div className="py-6 text-center">
                                    <Calendar size={24} className="mx-auto text-white/10 mb-2" />
                                    <p className="text-white/30 text-xs">Nenhuma reunião agendada</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest px-1">Próximas</p>
                                    {upcoming.map(m => (
                                        <MeetingRow key={m.id} m={m} academies={academies} onMeetingClick={onMeetingClick} now={now} />
                                    ))}
                                </div>
                            )}

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
                                            {past.map(m => (
                                                <MeetingRow key={m.id} m={m} academies={academies} onMeetingClick={onMeetingClick} now={now} />
                                            ))}
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
