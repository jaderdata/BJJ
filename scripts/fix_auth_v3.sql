-- Final Fix for Auth Functions (Version 3)
-- Resolves "function gen_random_bytes does not exist" by ensuring extensions schema usage.

-- 1. Ensure extensions schema exists and pgcrypto is installed there
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

-- 2. Refine `auth_generate_invite` with correct search_path
-- We remove 'public.' prefix and add 'extensions' to search_path
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

    -- Generate Token
    v_token := encode(gen_random_bytes(32), 'hex');
    v_expires := NOW() + INTERVAL '48 hours';

    INSERT INTO auth_tokens (email, token, type, expires_at)
    VALUES (p_email, v_token, 'ACTIVATION', v_expires);

    PERFORM log_auth_action(p_email, 'INVITE_GENERATED', 'Role: ' || p_role);

    RETURN jsonb_build_object('success', true, 'token', v_token);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

-- 3. Update `auth_request_access`
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

    v_token := encode(gen_random_bytes(32), 'hex');
    v_expires := NOW() + INTERVAL '60 minutes';

    INSERT INTO auth_tokens (email, token, type, expires_at)
    VALUES (p_email, v_token, 'ACTIVATION', v_expires);

    PERFORM log_auth_action(p_email, 'EMAIL_SENT_ACTIVATION', 'Link: ?token=' || v_token || '&type=activation');

    RETURN jsonb_build_object('success', true, 'message', 'Se esse e-mail estiver autorizado, você receberá um link para criar sua senha.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

-- 4. Update `auth_request_reset`
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

    v_token := encode(gen_random_bytes(32), 'hex');
    v_expires := NOW() + INTERVAL '30 minutes';

    INSERT INTO auth_tokens (email, token, type, expires_at)
    VALUES (p_email, v_token, 'RESET', v_expires);

    PERFORM log_auth_action(p_email, 'EMAIL_SENT_RESET', 'Link: ?token=' || v_token || '&type=reset');

    RETURN jsonb_build_object('success', true, 'message', 'Se esse e-mail estiver autorizado, você receberá um link para redefinir sua senha.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

-- 5. Update `auth_activate_user` (uses crypt/gen_salt which also need extensions)
CREATE OR REPLACE FUNCTION auth_activate_user(
    p_token TEXT,
    p_password TEXT,
    p_name TEXT
) RETURNS JSONB AS $$
DECLARE
    v_token_record auth_tokens%ROWTYPE;
    v_allowlist app_allowlist%ROWTYPE;
BEGIN
    SELECT * INTO v_token_record FROM auth_tokens 
    WHERE token = p_token AND type = 'ACTIVATION' AND used = FALSE;

    IF v_token_record.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Token inválido.');
    END IF;

    IF v_token_record.expires_at < NOW() THEN
        RETURN jsonb_build_object('success', false, 'message', 'Este link expirou. Solicite um novo acesso.');
    END IF;

    SELECT * INTO v_allowlist FROM app_allowlist WHERE email = v_token_record.email;
    
    IF v_allowlist.id IS NULL OR v_allowlist.status <> 'ACTIVE' THEN
         RETURN jsonb_build_object('success', false, 'message', 'Acesso revogado.');
    END IF;

    INSERT INTO app_users (email, password_hash, name, role, status)
    VALUES (
        v_token_record.email,
        crypt(p_password, gen_salt('bf')),
        p_name,
        v_allowlist.role,
        'ACTIVE'
    );

    UPDATE auth_tokens SET used = TRUE WHERE id = v_token_record.id;
    PERFORM log_auth_action(v_token_record.email, 'USER_ACTIVATED', 'Account activated successfully');

    RETURN jsonb_build_object('success', true, 'message', 'Senha criada com sucesso. Faça login para entrar.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

-- 6. Update `auth_login` (uses crypt)
CREATE OR REPLACE FUNCTION auth_login(
    p_email TEXT,
    p_password TEXT
) RETURNS JSONB AS $$
DECLARE
    v_user app_users%ROWTYPE;
BEGIN
    SELECT * INTO v_user FROM app_users WHERE email = p_email;

    IF v_user.id IS NULL THEN
        PERFORM log_auth_action(p_email, 'LOGIN_FAILED', 'User not found');
        RETURN jsonb_build_object('success', false, 'message', 'E-mail ou senha incorretos.');
    END IF;

    IF v_user.status <> 'ACTIVE' THEN
        PERFORM log_auth_action(p_email, 'LOGIN_BLOCKED', 'User inactive');
        RETURN jsonb_build_object('success', false, 'message', 'Seu acesso foi desativado. Fale com o administrador.');
    END IF;

    IF v_user.password_hash = crypt(p_password, v_user.password_hash) THEN
        UPDATE app_users SET last_login = NOW() WHERE id = v_user.id;
        PERFORM log_auth_action(p_email, 'LOGIN_SUCCESS', 'Login successful');
        
        RETURN jsonb_build_object(
            'success', true, 
            'user', jsonb_build_object(
                'id', v_user.id,
                'email', v_user.email,
                'name', v_user.name,
                'role', v_user.role
            )
        );
    ELSE
        PERFORM log_auth_action(p_email, 'LOGIN_FAILED', 'Invalid password');
        RETURN jsonb_build_object('success', false, 'message', 'E-mail ou senha incorretos.');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;
