import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Mail, X, Loader2, Send, AlertCircle } from 'lucide-react';
import { Meeting } from '../../types';
import { DatabaseService } from '../../lib/supabase';
import templateHtmlPt from '../../../email-templates/meeting-invite.html?raw';
import templateHtmlEn from '../../../email-templates/meeting-invite-en.html?raw';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Removes consecutive duplicate words from a name (e.g. "Silva Silva" → "Silva"). */
function deduplicateName(name: string): string {
    const words = name.trim().split(/\s+/);
    return words.filter((w, i) => i === 0 || w.toLowerCase() !== words[i - 1].toLowerCase()).join(' ');
}

// ─── Email builders ──────────────────────────────────────────────────────────

export function buildEmailBody(meeting: Meeting & { academyName: string }, lang: 'pt' | 'en'): string {
    const date = new Date(meeting.scheduledAt);
    const locale = lang === 'pt' ? 'pt-BR' : 'en-US';

    const dateFormatted = date.toLocaleDateString(locale, {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    const timeFormatted = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

    const dur = meeting.durationMin;
    const durStr = lang === 'pt'
        ? (dur < 60 ? `${dur} min` : (dur % 60 === 0 ? `${dur / 60}h` : `${Math.floor(dur / 60)}h${dur % 60}min`))
        : (dur < 60 ? `${dur} min` : (dur % 60 === 0 ? `${dur / 60}h` : `${Math.floor(dur / 60)}h${dur % 60}min`));

    const attendeeName = deduplicateName(meeting.attendeeName || (lang === 'pt' ? 'Professor(a)' : 'Professor'));
    const organizerName = meeting.organizerName || 'PBJJF';
    const location = meeting.meetingLink
        ? (lang === 'pt' ? 'Reunião Virtual (link abaixo)' : 'Virtual Meeting (link below)')
        : meeting.academyName;

    // Pauta: derived from notes (one item per line) or defaults
    const noteLines = (meeting.notes || '').split('\n').map(l => l.trim()).filter(Boolean);
    const defaultAgenda = lang === 'pt'
        ? ['Apresentação e alinhamentos iniciais', 'Discussão de parceria PBJJF', 'Próximos passos']
        : ['Introduction and initial alignment', 'PBJJF partnership discussion', 'Next steps'];
    const agenda = [
        noteLines[0] || defaultAgenda[0],
        noteLines[1] || defaultAgenda[1],
        noteLines[2] || defaultAgenda[2],
    ];

    const personalMsg = lang === 'pt'
        ? `Gostaríamos de confirmar sua reunião com a equipe <strong>PBJJF</strong>. Por favor, verifique os detalhes abaixo e confirme sua presença clicando no botão.`
        : `We would like to confirm your meeting with the <strong>PBJJF</strong> team. Please review the details below and confirm your attendance by clicking the button.`;

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const confirmUrl = `${supabaseUrl}/functions/v1/confirm-meeting?id=${meeting.id}`;

    let html = lang === 'en' ? templateHtmlEn : templateHtmlPt;

    // Replace placeholders
    html = html.replace(/\{\{TITULO_REUNIAO\}\}/g, meeting.title);
    html = html.replace(/\{\{NOME_DESTINATARIO\}\}/g, attendeeName);
    html = html.replace(/\{\{MENSAGEM_PERSONALIZADA\}\}/g, personalMsg);
    html = html.replace(/\{\{DATA_REUNIAO\}\}/g, dateFormatted);
    html = html.replace(/\{\{HORARIO_REUNIAO\}\}/g, timeFormatted);
    html = html.replace(/\{\{FUSO_HORARIO\}\}/g, meeting.timezoneName || (lang === 'pt' ? 'Horário de Brasília' : 'Brasília Time'));
    html = html.replace(/\{\{LOCAL_OU_PLATAFORMA\}\}/g, location);
    html = html.replace(/\{\{DURACAO_ESTIMADA\}\}/g, durStr);
    html = html.replace(/\{\{NOME_ORGANIZADOR\}\}/g, organizerName);
    html = html.replace(/\{\{ITEM_PAUTA_1\}\}/g, agenda[0]);
    html = html.replace(/\{\{ITEM_PAUTA_2\}\}/g, agenda[1]);
    html = html.replace(/\{\{ITEM_PAUTA_3\}\}/g, agenda[2]);
    html = html.replace(/https:\/\/YOUR_PROJECT_REF\.supabase\.co\/functions\/v1\/confirm-meeting\?id=\{\{MEETING_ID\}\}/g, confirmUrl);
    html = html.replace(/\{\{LINK_VIDEOCONFERENCIA\}\}/g, meeting.meetingLink || '#');
    html = html.replace(/\{\{EMAIL_DESTINATARIO\}\}/g, meeting.attendeeEmail || '');
    html = html.replace(/\{\{NOME_REMETENTE\}\}/g, organizerName);
    html = html.replace(/\{\{CARGO_REMETENTE\}\}/g, lang === 'pt' ? 'Equipe Comercial' : 'Commercial Team');
    html = html.replace(/\{\{TELEFONE\}\}/g, '');
    html = html.replace(/\{\{LINK_DESCADASTRO\}\}/g, '#');

    // Hide video section if no meeting link
    if (!meeting.meetingLink) {
        html = html.replace(
            /<!-- Link de Video[\s\S]*?<\/table>\s*(?=\s*<!-- Divider -->)/,
            ''
        );
    }

    return html;
}

export function buildSubject(meeting: Meeting, lang: 'pt' | 'en'): string {
    const date = new Date(meeting.scheduledAt).toLocaleDateString(lang === 'pt' ? 'pt-BR' : 'en-US', {
        day: 'numeric', month: 'short'
    });
    return lang === 'pt'
        ? `Confirmação de Reunião: ${meeting.title} — ${date}`
        : `Meeting Confirmation: ${meeting.title} — ${date}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface EmailConfirmationModalProps {
    meeting: Meeting;
    academyName: string;
    initialLang?: 'pt' | 'en';
    onClose: () => void;
    onSent: (id: string) => void;
}

export function EmailConfirmationModal({ meeting, academyName, initialLang, onClose, onSent }: EmailConfirmationModalProps) {
    const [lang, setLang] = useState<'pt' | 'en'>(initialLang ?? meeting.emailLang ?? 'pt');
    const [bodyHtml, setBodyHtml] = useState(() => buildEmailBody({ ...meeting, academyName }, initialLang ?? meeting.emailLang ?? 'pt'));
    const [sending, setSending] = useState(false);

    function handleLangChange(newLang: 'pt' | 'en') {
        setLang(newLang);
        setBodyHtml(buildEmailBody({ ...meeting, academyName }, newLang));
    }

    const subject = buildSubject(meeting, lang);

    async function handleSend() {
        setSending(true);
        try {
            const { supabase: sb } = await import('../../lib/supabase-client');
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
                    extraEmails: meeting.extraEmails?.join(',') || '',
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
                        <div className="flex items-center bg-white/5 border border-white/10 rounded-sm p-1">
                            <button type="button" onClick={() => handleLangChange('pt')} className={`px-3 py-1.5 rounded-sm text-xs font-black transition-all ${lang === 'pt' ? 'bg-amber-600 text-white' : 'text-neutral-500 hover:text-white'}`}>PT</button>
                            <button type="button" onClick={() => handleLangChange('en')} className={`px-3 py-1.5 rounded-sm text-xs font-black transition-all ${lang === 'en' ? 'bg-amber-600 text-white' : 'text-neutral-500 hover:text-white'}`}>EN</button>
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
                                {[meeting.organizerEmail, ...(meeting.extraEmails ?? [])].filter(Boolean).join(', ') || '—'}
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
