import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
    X, Search, Mail, Plus, Video, Loader2, CheckCircle, CalendarPlus, AlertCircle, RefreshCw,
} from 'lucide-react';
import { Academy, User, Meeting, MeetingDuration, MeetingRecurrence } from '../../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateJitsiLink(): string {
    const id = crypto.randomUUID().replace(/-/g, '').slice(0, 10);
    return `https://meet.jit.si/pbjjf-${id}`;
}

const DURATION_OPTIONS: MeetingDuration[] = [15, 30, 45, 60, 90, 120];

const RECURRENCE_OPTIONS: { value: MeetingRecurrence; label: string }[] = [
    { value: 'none', label: 'Sem recorrência' },
    { value: 'weekly', label: 'Semanal' },
    { value: 'biweekly', label: 'Quinzenal' },
    { value: 'monthly', label: 'Mensal' },
];

export function formatDuration(min: number): string {
    if (min < 60) return `${min}min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m === 0 ? `${h}h` : `${h}h${m}`;
}

function addInterval(date: Date, recurrence: MeetingRecurrence, n: number): Date {
    const d = new Date(date);
    if (recurrence === 'weekly') d.setDate(d.getDate() + 7 * n);
    else if (recurrence === 'biweekly') d.setDate(d.getDate() + 14 * n);
    else if (recurrence === 'monthly') d.setMonth(d.getMonth() + n);
    return d;
}

/** Returns a conflicting meeting if the new slot overlaps with an existing one, or null. */
export function findConflict(
    scheduledAt: string,
    durationMin: number,
    allMeetings: Meeting[],
    excludeId?: string,
): Meeting | null {
    const start = new Date(scheduledAt).getTime();
    const end = start + durationMin * 60_000;
    return allMeetings.find(m => {
        if (m.id === excludeId) return false;
        if (m.deletedAt) return false;
        const mStart = new Date(m.scheduledAt).getTime();
        const mEnd = mStart + m.durationMin * 60_000;
        return start < mEnd && end > mStart;
    }) ?? null;
}

// ─── TimePicker ──────────────────────────────────────────────────────────────

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

// ─── Component ───────────────────────────────────────────────────────────────

interface NewMeetingModalProps {
    academies: Academy[];
    currentUser: User;
    editing: Meeting | null;
    allMeetings: Meeting[];
    onSave: (instances: Partial<Meeting>[], lang: 'pt' | 'en') => Promise<void>;
    onClose: () => void;
}

export function NewMeetingModal({ academies, currentUser, editing, allMeetings, onSave, onClose }: NewMeetingModalProps) {
    const [selectedAcademyId, setSelectedAcademyId] = useState(editing?.academyId || '');
    const [academySearch, setAcademySearch] = useState('');
    const [title, setTitle] = useState(editing?.title || '');
    const [dateStr, setDateStr] = useState(editing ? editing.scheduledAt.slice(0, 10) : '');
    const [timeStr, setTimeStr] = useState(editing ? new Date(editing.scheduledAt).toTimeString().slice(0, 5) : '');
    const [durationMin, setDurationMin] = useState<MeetingDuration>(editing?.durationMin || 30);
    const [meetingLink, setMeetingLink] = useState(editing?.meetingLink ?? generateJitsiLink());
    const [attendeeEmail, setAttendeeEmail] = useState(editing?.attendeeEmail || '');
    const [attendeeName, setAttendeeName] = useState(editing?.attendeeName || '');
    const [organizerEmail, setOrganizerEmail] = useState(editing?.organizerEmail || currentUser.email);
    const [extraParticipants, setExtraParticipants] = useState<Array<{ name: string; email: string }>>(
        editing?.extraParticipants?.map(p => ({ name: p.name ?? '', email: p.email })) ??
        (editing?.extraEmails?.map(e => ({ name: '', email: e })) ?? [])
    );
    const [lang, setLang] = useState<'pt' | 'en'>(editing?.emailLang ?? 'pt');
    const [notes, setNotes] = useState(editing?.notes || '');
    const [timezoneName, setTimezoneName] = useState(editing?.timezoneName ?? 'Horário de Brasília');
    const [recurrence, setRecurrence] = useState<MeetingRecurrence>(editing?.recurrence ?? 'none');
    const [occurrences, setOccurrences] = useState(4);
    const [saving, setSaving] = useState(false);
    const [conflictWarning, setConflictWarning] = useState<Meeting | null>(null);
    const [forceSubmit, setForceSubmit] = useState(false);

    const selectedAcademy = academies.find(a => a.id === selectedAcademyId);
    const filteredAcademies = useMemo(() =>
        academies.filter(a => a.name.toLowerCase().includes(academySearch.toLowerCase())).slice(0, 8),
        [academies, academySearch]
    );

    const handleAcademySelect = (id: string) => {
        setSelectedAcademyId(id);
        setAcademySearch('');
        const academy = academies.find(a => a.id === id);
        if (academy) {
            if (!attendeeEmail) setAttendeeEmail(academy.email || '');
            if (!attendeeName) setAttendeeName(academy.responsible || '');
        }
    };

    const addExtraParticipant = () => setExtraParticipants(prev => [...prev, { name: '', email: '' }]);
    const updateExtraParticipant = (idx: number, field: 'name' | 'email', val: string) =>
        setExtraParticipants(prev => prev.map((p, i) => i === idx ? { ...p, [field]: val } : p));
    const removeExtraParticipant = (idx: number) =>
        setExtraParticipants(prev => prev.filter((_, i) => i !== idx));

    function buildInstances(primaryScheduledAt: string): Partial<Meeting>[] {
        const base: Partial<Meeting> = {
            id: editing?.id,
            academyId: selectedAcademyId || undefined,
            createdBy: currentUser.id,
            title: title.trim(),
            durationMin,
            meetingLink: meetingLink.trim() || undefined,
            notes: notes.trim() || undefined,
            attendeeEmail: attendeeEmail.trim() || undefined,
            attendeeName: attendeeName.trim() || undefined,
            organizerEmail: organizerEmail.trim() || currentUser.email,
            organizerName: currentUser.name,
            extraParticipants: extraParticipants.filter(p => p.email.trim()).length > 0
                ? extraParticipants.filter(p => p.email.trim()).map(p => ({ name: p.name.trim() || undefined, email: p.email.trim() }))
                : undefined,
            extraEmails: extraParticipants.filter(p => p.email.trim()).map(p => p.email.trim()),
            emailLang: lang,
            recurrence,
            timezoneName,
        };

        if (editing || recurrence === 'none') {
            return [{ ...base, scheduledAt: primaryScheduledAt }];
        }

        // Generate recurring instances
        const firstDate = new Date(primaryScheduledAt);
        return Array.from({ length: occurrences }, (_, i) => ({
            ...base,
            id: undefined, // each instance is a new record
            scheduledAt: addInterval(firstDate, recurrence, i).toISOString(),
            // parentMeetingId will be set by the parent after creating the first instance
        }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!title.trim() || !dateStr || !timeStr) return;

        const scheduledAt = new Date(`${dateStr}T${timeStr}:00`).toISOString();

        // Conflict detection
        if (!forceSubmit) {
            const conflict = findConflict(scheduledAt, durationMin, allMeetings, editing?.id);
            if (conflict) {
                setConflictWarning(conflict);
                return;
            }
        }

        setSaving(true);
        try {
            const instances = buildInstances(scheduledAt);
            await onSave(instances, lang);
        } catch (err: any) {
            const { toast } = await import('sonner');
            const msg = err?.message ?? err?.error_description ?? JSON.stringify(err);
            toast.error(`Erro ao salvar reunião: ${msg}`);
        } finally {
            setSaving(false);
            setForceSubmit(false);
        }
    }

    function handleForceSubmit() {
        setForceSubmit(true);
        setConflictWarning(null);
        // Re-submit form programmatically
        const form = document.getElementById('meeting-form') as HTMLFormElement | null;
        if (form) {
            const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
            // Directly call save logic
            const scheduledAt = new Date(`${dateStr}T${timeStr}:00`).toISOString();
            setSaving(true);
            buildInstances(scheduledAt);
            onSave(buildInstances(scheduledAt), lang).finally(() => {
                setSaving(false);
                setForceSubmit(false);
            });
        }
    }

    return createPortal(
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[120] animate-in fade-in duration-150">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-md w-[95vw] max-w-5xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
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

                {/* Conflict warning banner */}
                {conflictWarning && (
                    <div className="mx-7 mt-4 flex items-start gap-3 px-4 py-3 bg-orange-500/10 border border-orange-500/30 rounded-sm">
                        <AlertCircle size={16} className="text-orange-400 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-orange-300">Conflito de horário detectado</p>
                            <p className="text-xs text-orange-400/80 mt-0.5">
                                Já existe a reunião "{conflictWarning.title}" neste horário ({new Date(conflictWarning.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · {conflictWarning.durationMin}min).
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleForceSubmit}
                            className="shrink-0 text-xs font-bold text-orange-300 hover:text-orange-200 underline transition-colors"
                        >
                            Agendar mesmo assim
                        </button>
                    </div>
                )}

                <form id="meeting-form" onSubmit={handleSubmit} className="overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-2 gap-x-6 px-7 py-5">

                        {/* ── LEFT: meeting details ── */}
                        <div className="space-y-4">
                            {/* Academy (optional) */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Academia <span className="text-white/20 font-normal normal-case tracking-normal">(opcional)</span></label>
                                </div>
                                {selectedAcademy ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between px-4 py-3 bg-white/5 border border-amber-500/30 rounded-sm">
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-white">{selectedAcademy.name}</p>
                                                <p className="text-xs text-neutral-500">{selectedAcademy.city}, {selectedAcademy.state}</p>
                                                {selectedAcademy.email ? (
                                                    <p className="text-xs text-amber-500/70 mt-0.5 flex items-center gap-1">
                                                        <Mail size={10} />{selectedAcademy.email}
                                                    </p>
                                                ) : (
                                                    <p className="text-xs text-orange-400/70 mt-0.5 flex items-center gap-1">
                                                        <Mail size={10} />Sem email cadastrado
                                                    </p>
                                                )}
                                            </div>
                                            <button type="button" onClick={() => setSelectedAcademyId('')} className="text-neutral-500 hover:text-red-400 transition-colors ml-2 shrink-0">
                                                <X size={16} />
                                            </button>
                                        </div>
                                        {!selectedAcademy.email && !attendeeEmail && (
                                            <div className="flex items-start gap-2 px-3 py-2 bg-orange-500/10 border border-orange-500/25 rounded-sm">
                                                <AlertCircle size={13} className="text-orange-400 shrink-0 mt-0.5" />
                                                <p className="text-[11px] text-orange-300 leading-snug">
                                                    Esta academia não possui email cadastrado. Insira o email do convidado manualmente no painel ao lado.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Buscar academia ou deixar em branco..."
                                            className="w-full pl-10 pr-4 h-11 bg-white/5 border border-white/10 rounded-sm text-white text-sm focus:border-amber-500/50 focus:outline-none transition-all placeholder:text-white/20"
                                            value={academySearch}
                                            onChange={e => setAcademySearch(e.target.value)}
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

                            {/* Timezone */}
                            <div>
                                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1.5 block">Fuso Horário (exibido no email)</label>
                                <select
                                    value={timezoneName}
                                    onChange={e => setTimezoneName(e.target.value)}
                                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-sm text-white text-sm focus:border-amber-500/50 focus:outline-none transition-all appearance-none cursor-pointer hover:border-white/20 [color-scheme:dark]"
                                >
                                    <option value="Horário de Brasília" className="bg-neutral-900">Horário de Brasília (BRT · UTC-3)</option>
                                    <option value="New York Time" className="bg-neutral-900">New York Time (ET · UTC-5/-4)</option>
                                </select>
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

                            {/* Recurrence — only for new meetings */}
                            {!editing && (
                                <div>
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1.5 block flex items-center gap-1.5">
                                        <RefreshCw size={10} />
                                        Recorrência
                                    </label>
                                    <div className="grid grid-cols-4 gap-1.5 mb-2">
                                        {RECURRENCE_OPTIONS.map(opt => (
                                            <button key={opt.value} type="button" onClick={() => setRecurrence(opt.value)} className={`py-2 rounded-sm border text-center text-[10px] font-black transition-all leading-tight ${recurrence === opt.value ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : 'bg-white/5 border-white/5 text-neutral-500 hover:bg-white/10'}`}>
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                    {recurrence !== 'none' && (
                                        <div className="flex items-center gap-3 px-3 py-2 bg-amber-500/5 border border-amber-500/15 rounded-sm">
                                            <span className="text-xs text-amber-400/80">Repetir</span>
                                            <input
                                                type="number"
                                                min={2}
                                                max={52}
                                                value={occurrences}
                                                onChange={e => setOccurrences(Math.max(2, Math.min(52, Number(e.target.value))))}
                                                className="w-16 h-7 px-2 bg-white/5 border border-white/10 rounded-sm text-white text-sm text-center focus:border-amber-500/50 focus:outline-none [color-scheme:dark]"
                                            />
                                            <span className="text-xs text-amber-400/80">vezes</span>
                                            <span className="text-[10px] text-white/20 ml-auto">
                                                {occurrences} reuniões serão criadas
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Meeting Link */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest flex items-center gap-1.5">
                                        <Video size={10} />
                                        Link da Reunião (Jitsi)
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setMeetingLink(generateJitsiLink())}
                                        className="flex items-center gap-1 text-[10px] font-bold text-amber-400/60 hover:text-amber-400 transition-colors"
                                        title="Gerar novo link"
                                    >
                                        <RefreshCw size={10} />
                                        Novo link
                                    </button>
                                </div>
                                <div className="relative">
                                    <Video className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                                    <input type="url" value={meetingLink} onChange={e => setMeetingLink(e.target.value)} className="w-full pl-10 pr-4 h-11 bg-white/5 border border-white/10 rounded-sm text-white text-sm focus:border-amber-500/50 focus:outline-none transition-all placeholder:text-white/20" />
                                </div>
                            </div>
                        </div>

                        {/* ── RIGHT: participants + notes ── */}
                        <div className="space-y-4">
                            {/* Organizer — destaque no topo */}
                            <div>
                                <label className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1.5 block">Seu Email (organizador)</label>
                                <input
                                    type="email"
                                    value={organizerEmail}
                                    onChange={e => setOrganizerEmail(e.target.value)}
                                    className="w-full h-11 px-4 bg-amber-500/5 border border-amber-500/25 rounded-sm text-white text-sm focus:border-amber-500/60 focus:outline-none transition-all"
                                />
                            </div>

                            {/* Participants list */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Participantes</label>
                                    <button type="button" onClick={addExtraParticipant} className="flex items-center gap-1 text-[10px] font-bold text-amber-400 hover:text-amber-300 transition-colors">
                                        <Plus size={11} />
                                        Adicionar
                                    </button>
                                </div>

                                {/* Main attendee row */}
                                {(() => {
                                    const missingEmail = selectedAcademy && !selectedAcademy.email && !attendeeEmail;
                                    return (
                                        <div className={`flex items-center gap-2 transition-all ${missingEmail ? 'p-2 bg-orange-500/5 border border-orange-500/20 rounded-sm' : ''}`}>
                                            <input
                                                type="text"
                                                placeholder="Nome"
                                                value={attendeeName}
                                                onChange={e => setAttendeeName(e.target.value)}
                                                className="w-[40%] h-9 px-3 bg-white/5 border border-white/10 rounded-sm text-white text-xs focus:border-amber-500/50 focus:outline-none transition-all placeholder:text-white/20 shrink-0"
                                            />
                                            <input
                                                type="email"
                                                placeholder={missingEmail ? 'Email (obrigatório)' : 'Email'}
                                                value={attendeeEmail}
                                                onChange={e => setAttendeeEmail(e.target.value)}
                                                className={`flex-1 h-9 px-3 rounded-sm text-white text-xs focus:outline-none transition-all min-w-0 ${missingEmail ? 'bg-orange-500/10 border border-orange-500/40 focus:border-orange-400 placeholder:text-orange-400/50' : 'bg-white/5 border border-white/10 focus:border-amber-500/50 placeholder:text-white/20'}`}
                                            />
                                            {/* Placeholder to align with removable rows below */}
                                            <div className="w-9 shrink-0" />
                                        </div>
                                    );
                                })()}

                                {/* Extra participants */}
                                {extraParticipants.map((p, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            placeholder="Nome"
                                            value={p.name}
                                            onChange={e => updateExtraParticipant(idx, 'name', e.target.value)}
                                            className="w-[40%] h-9 px-3 bg-white/5 border border-white/10 rounded-sm text-white text-xs focus:border-amber-500/50 focus:outline-none transition-all placeholder:text-white/20 shrink-0"
                                        />
                                        <input
                                            type="email"
                                            placeholder={`Email participante ${idx + 2}`}
                                            value={p.email}
                                            onChange={e => updateExtraParticipant(idx, 'email', e.target.value)}
                                            className="flex-1 h-9 px-3 bg-white/5 border border-white/10 rounded-sm text-white text-xs focus:border-amber-500/50 focus:outline-none transition-all placeholder:text-white/20 min-w-0"
                                        />
                                        <button type="button" onClick={() => removeExtraParticipant(idx)} className="w-9 h-9 rounded-sm bg-white/5 hover:bg-red-500/10 flex items-center justify-center text-white/30 hover:text-red-400 transition-all shrink-0">
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
                            {editing
                                ? 'Salvar Alterações'
                                : recurrence !== 'none'
                                    ? `Criar ${occurrences} Reuniões`
                                    : 'Confirmar Reunião'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
