import nodemailer from "npm:nodemailer@6.9.13";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailPayload {
    meetingId: string;
    meetingTitle: string;
    scheduledAt: string;
    durationMin: number;
    academyName: string;
    attendeeName: string;
    attendeeEmail: string;
    organizerName: string;
    organizerEmail: string;
    extraEmails?: string;
    subject: string;
    bodyHtml: string;
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const smtpHost = Deno.env.get('BREVO_SMTP_HOST');
        const smtpPort = Deno.env.get('BREVO_SMTP_PORT');
        const smtpUser = Deno.env.get('BREVO_SMTP_USER');
        const smtpPass = Deno.env.get('BREVO_SMTP_PASS');
        // Must be a verified sender in Brevo (Senders & IPs → Senders)
        const smtpFrom = Deno.env.get('BREVO_SMTP_FROM');

        if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !smtpFrom) {
            throw new Error('Configuração SMTP faltando. Verifique os Secrets da Edge Function (BREVO_SMTP_HOST, BREVO_SMTP_PORT, BREVO_SMTP_USER, BREVO_SMTP_PASS, BREVO_SMTP_FROM).');
        }

        const payload: EmailPayload = await req.json();
        const { attendeeEmail, attendeeName, organizerEmail, organizerName, extraEmails, subject, bodyHtml } = payload;

        if (!organizerEmail) {
            throw new Error('Email do organizador é obrigatório.');
        }

        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: Number(smtpPort),
            secure: false,
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        });

        const toList: string[] = [];
        if (attendeeEmail) toList.push(attendeeName ? `${attendeeName} <${attendeeEmail}>` : attendeeEmail);

        const ccList: string[] = [organizerEmail];
        if (extraEmails) {
            const extras = extraEmails.split(',').map((e: string) => e.trim()).filter(Boolean);
            ccList.push(...extras);
        }

        // Brevo requires the from address to be a verified sender (BREVO_SMTP_FROM).
        // The organizer email is set as Reply-To so replies go to the correct person.
        await transporter.sendMail({
            from: `${organizerName} <${smtpFrom}>`,
            replyTo: `${organizerName} <${organizerEmail}>`,
            to: toList.length > 0 ? toList.join(', ') : organizerEmail,
            cc: ccList.join(', '),
            subject,
            html: bodyHtml,
        });

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('[send-meeting-email] Error:', message);
        return new Response(JSON.stringify({ error: message }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
