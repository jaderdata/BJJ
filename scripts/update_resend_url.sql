-- Update the Base URL for Production Email Links
CREATE OR REPLACE FUNCTION send_auth_email_via_resend()
RETURNS TRIGGER AS $$
DECLARE
    v_resend_api_key TEXT := 're_4upmpY9s_NJjB44mq4iz6AtCZqPfg9TLC';
    v_base_url TEXT := 'https://bjj-mu.vercel.app'; -- PRODUCTION URL
    v_email_subject TEXT;
    v_email_html TEXT;
    v_link TEXT;
    v_response_id UUID;
BEGIN
    -- Only send for new tokens
    IF NEW.type = 'ACTIVATION' THEN
        v_email_subject := 'Bem-vindo ao BJJVisits! 🥋 Ative sua conta';
        v_link := v_base_url || '/?token=' || NEW.token || '&type=activation';
        
        v_email_html := '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">' ||
                        '<h1 style="color: #2563eb;">Bem-vindo ao BJJVisits!</h1>' ||
                        '<p>Olá!</p>' ||
                        '<p>Você recebeu um convite para acessar o sistema de gestão de visitas.</p>' ||
                        '<p>Para validar seu acesso e criar sua senha, clique no botão abaixo:</p>' ||
                        '<a href="' || v_link || '" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 16px 0;">Criar Minha Senha</a>' ||
                        '<p style="color: #64748b; font-size: 14px;">Ou copie este link: ' || v_link || '</p>' ||
                        '<p><em>Este link expira em 60 minutos.</em></p>' ||
                        '</div>';
    
    ELSIF NEW.type = 'RESET' THEN
        v_email_subject := 'Recuperação de Senha - BJJVisits';
        v_link := v_base_url || '/?token=' || NEW.token || '&type=reset';
        
        v_email_html := '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">' ||
                        '<h1 style="color: #2563eb;">Recuperação de Senha</h1>' ||
                        '<p>Recebemos uma solicitação para redefinir sua senha.</p>' ||
                        '<a href="' || v_link || '" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 16px 0;">Redefinir Senha</a>' ||
                        '<p style="color: #64748b; font-size: 14px;">Se você não solicitou isso, ignore este e-mail.</p>' ||
                        '</div>';
    ELSE
        RETURN NEW;
    END IF;

    -- Send request using pg_net
    PERFORM net.http_post(
        url := 'https://api.resend.com/emails',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || v_resend_api_key,
            'Content-Type', 'application/json'
        ),
        body := jsonb_build_object(
            'from', 'onboarding@resend.dev',
            'to', NEW.email,
            'subject', v_email_subject,
            'html', v_email_html
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
