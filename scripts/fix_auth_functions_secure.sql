-- Secure Auth Functions Fix
-- 1. Ensure pgcrypto is enabled in public schema
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA public;

-- 2. Refine `auth_generate_invite` to explicitly use public.gen_random_bytes
-- This handles the "function gen_random_bytes(integer) does not exist" error
CREATE OR REPLACE FUNCTION auth_generate_invite(
    p_email TEXT,
    p_role TEXT
) RETURNS JSONB AS $$
DECLARE
    v_user app_users%ROWTYPE;
    v_token TEXT;
    v_expires TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Check if user already exists
    SELECT * INTO v_user FROM app_users WHERE email = p_email;
    IF v_user.id IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Usuário já cadastrado.');
    END IF;

    -- Add to Allowlist (Upsert)
    INSERT INTO app_allowlist (email, role, status)
    VALUES (p_email, p_role, 'ACTIVE')
    ON CONFLICT (email) DO UPDATE SET role = p_role, status = 'ACTIVE';

    -- Generate Token using explicit public schema for pgcrypto function
    v_token := encode(public.gen_random_bytes(32), 'hex');
    v_expires := NOW() + INTERVAL '48 hours';

    INSERT INTO auth_tokens (email, token, type, expires_at)
    VALUES (p_email, v_token, 'ACTIVATION', v_expires);

    -- Log
    PERFORM log_auth_action(p_email, 'INVITE_GENERATED', 'Role: ' || p_role);

    RETURN jsonb_build_object('success', true, 'token', v_token);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

-- 3. Also update `auth_request_access` to be safe
CREATE OR REPLACE FUNCTION auth_request_access(p_email TEXT) RETURNS JSONB AS $$
DECLARE
    v_allowlist app_allowlist%ROWTYPE;
    v_user app_users%ROWTYPE;
    v_token TEXT;
    v_expires TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT * INTO v_allowlist FROM app_allowlist WHERE email = p_email AND status = 'ACTIVE';

    IF v_allowlist.id IS NULL THEN
        PERFORM log_auth_action(p_email, 'REQUEST_ACCESS_IGNORED', 'Email not in allowlist or inactive');
        RETURN jsonb_build_object('success', true, 'message', 'Se esse e-mail estiver autorizado, você receberá um link para criar sua senha.');
    END IF;

    SELECT * INTO v_user FROM app_users WHERE email = p_email;
    IF v_user.id IS NOT NULL THEN
        PERFORM log_auth_action(p_email, 'REQUEST_ACCESS_IGNORED', 'User already registered');
        RETURN jsonb_build_object('success', true, 'message', 'Se esse e-mail estiver autorizado, você receberá um link para criar sua senha.'); 
    END IF;

    v_token := encode(public.gen_random_bytes(32), 'hex');
    v_expires := NOW() + INTERVAL '60 minutes';

    INSERT INTO auth_tokens (email, token, type, expires_at)
    VALUES (p_email, v_token, 'ACTIVATION', v_expires);

    PERFORM log_auth_action(p_email, 'EMAIL_SENT_ACTIVATION', 'Link: ?token=' || v_token || '&type=activation');

    RETURN jsonb_build_object('success', true, 'message', 'Se esse e-mail estiver autorizado, você receberá um link para criar sua senha.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

-- 4. Also update `auth_request_reset` to be safe
CREATE OR REPLACE FUNCTION auth_request_reset(p_email TEXT) RETURNS JSONB AS $$
DECLARE
    v_user app_users%ROWTYPE;
    v_token TEXT;
    v_expires TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT * INTO v_user FROM app_users WHERE email = p_email AND status = 'ACTIVE';

    IF v_user.id IS NULL THEN
        PERFORM log_auth_action(p_email, 'RESET_IGNORED', 'User not found or inactive');
        RETURN jsonb_build_object('success', true, 'message', 'Se esse e-mail estiver autorizado, você receberá um link para redefinir sua senha.');
    END IF;

    v_token := encode(public.gen_random_bytes(32), 'hex');
    v_expires := NOW() + INTERVAL '30 minutes';

    INSERT INTO auth_tokens (email, token, type, expires_at)
    VALUES (p_email, v_token, 'RESET', v_expires);

    PERFORM log_auth_action(p_email, 'EMAIL_SENT_RESET', 'Link: ?token=' || v_token || '&type=reset');

    RETURN jsonb_build_object('success', true, 'message', 'Se esse e-mail estiver autorizado, você receberá um link para redefinir sua senha.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;
