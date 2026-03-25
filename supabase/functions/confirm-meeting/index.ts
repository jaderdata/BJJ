// Supabase Edge Function: confirm-meeting
// Public endpoint — no auth required.
// Called when invitee clicks "Confirmar Presença" in the meeting email.
//
// URL: GET /functions/v1/confirm-meeting?id=<meeting_id>

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Simple CORS headers for browser redirect support
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

// Returns an HTML response (visible to the invitee after clicking the link)
function htmlResponse(title: string, message: string, isError = false): Response {
    const color = isError ? '#EF4444' : '#22C55E';
    const icon = isError ? '✗' : '✓';
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — PBJJF</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      background: #0a0a0a;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .card {
      background: #1a1a1a;
      border: 1px solid #2a2a2a;
      border-top: 4px solid ${color};
      border-radius: 12px;
      padding: 48px 40px;
      max-width: 480px;
      width: 90%;
      text-align: center;
    }
    .icon {
      width: 64px; height: 64px;
      background: ${color}20;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 24px;
      font-size: 28px;
      color: ${color};
      font-weight: 900;
    }
    .logo {
      font-size: 22px;
      font-weight: 900;
      color: #fff;
      margin-bottom: 32px;
      letter-spacing: -0.5px;
    }
    .logo span { color: #F5A623; }
    h1 { font-size: 22px; font-weight: 900; margin-bottom: 12px; }
    p  { font-size: 14px; color: rgba(255,255,255,0.6); line-height: 1.6; }
    .divider { height: 1px; background: #2a2a2a; margin: 28px 0; }
    .footer { font-size: 11px; color: rgba(255,255,255,0.25); }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo"><span>[P]</span>BJJF</div>
    <div class="icon">${icon}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <div class="divider"></div>
    <p class="footer">Professional Brazilian Jiu-Jitsu Federation · marketing@pbjjf.com</p>
  </div>
</body>
</html>`;
    return new Response(html, {
        status: isError ? 400 : 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'text/html; charset=utf-8' },
    });
}

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(req.url);
    const meetingId = url.searchParams.get('id');

    if (!meetingId) {
        return htmlResponse(
            'Link inválido',
            'O link de confirmação não contém um ID de reunião válido. Por favor, utilize o link enviado por email.',
            true
        );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(meetingId)) {
        return htmlResponse(
            'Link inválido',
            'O identificador da reunião não está no formato correto.',
            true
        );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch the meeting first to check if it exists and if already confirmed
    const { data: meeting, error: fetchError } = await supabase
        .from('meetings')
        .select('id, title, scheduled_at, attendee_name, confirmed_at')
        .eq('id', meetingId)
        .single();

    if (fetchError || !meeting) {
        return htmlResponse(
            'Reunião não encontrada',
            'Não foi possível encontrar a reunião associada a este link. Ela pode ter sido cancelada ou o link pode estar incorreto.',
            true
        );
    }

    const meetingDate = new Date(meeting.scheduled_at).toLocaleString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo',
    });

    // Already confirmed — return success without updating
    if (meeting.confirmed_at) {
        const confirmedDate = new Date(meeting.confirmed_at).toLocaleString('pt-BR', {
            day: '2-digit', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
            timeZone: 'America/Sao_Paulo',
        });
        return htmlResponse(
            'Presença já confirmada',
            `Sua presença na reunião <strong>${meeting.title}</strong> (${meetingDate}) já foi confirmada em ${confirmedDate}. Até lá!`
        );
    }

    // Mark as confirmed
    const { error: updateError } = await supabase
        .from('meetings')
        .update({ confirmed_at: new Date().toISOString() })
        .eq('id', meetingId);

    if (updateError) {
        console.error('[confirm-meeting] Update error:', updateError);
        return htmlResponse(
            'Erro ao confirmar',
            'Ocorreu um erro ao registrar sua confirmação. Por favor, tente novamente ou entre em contato com o organizador.',
            true
        );
    }

    const greeting = meeting.attendee_name ? `${meeting.attendee_name}, sua` : 'Sua';

    return htmlResponse(
        'Presença Confirmada!',
        `${greeting} presença na reunião <strong>${meeting.title}</strong> foi confirmada com sucesso para ${meetingDate}. Aguardamos você!`
    );
});
