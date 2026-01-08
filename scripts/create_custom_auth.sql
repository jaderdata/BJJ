-- Custom Authentication Schema
-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. App Allowlist (Controls who can request access)
CREATE TABLE IF NOT EXISTS app_allowlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'SALES' CHECK (role IN ('ADMIN', 'SALES')),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. App Users (Stores credentials)
CREATE TABLE IF NOT EXISTS app_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'SALES',
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- 3. Auth Tokens (For activation and password reset)
CREATE TABLE IF NOT EXISTS auth_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    token TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('ACTIVATION', 'RESET')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Auth Logs (Audit trail)
CREATE TABLE IF NOT EXISTS auth_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT,
    action TEXT NOT NULL,
    ip_address TEXT,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_allowlist_email ON app_allowlist(email);
CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_token ON auth_tokens(token);

-- RLS Policies (Open for now to allow application logic to handle security via RPCs)
ALTER TABLE app_allowlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_logs ENABLE ROW LEVEL SECURITY;

-- Allow anon to read/write for custom auth flow (controlled via app logic)
-- In a stricter environment, we would only allow RPCs to access these tables, 
-- but for this "no external auth" requirements with direct Supabase client usage, 
-- we need to open RLS or wrap everything in SECURITY DEFINER functions.
-- We will use SECURITY DEFINER functions for sensitive operations.

CREATE POLICY "Public read allowlist for check" ON app_allowlist FOR SELECT USING (true);
CREATE POLICY "Public insert tokens" ON auth_tokens FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read/update tokens" ON auth_tokens FOR SELECT USING (true); -- scoped by token matching usually
CREATE POLICY "Public update tokens" ON auth_tokens FOR UPDATE USING (true);

-- Users table should ONLY be accessed via RPCs ideally, but for reading profile after login:
CREATE POLICY "Public read users" ON app_users FOR SELECT USING (true);

-- Logs
CREATE POLICY "Public insert logs" ON auth_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read logs" ON auth_logs FOR SELECT USING (true);


-- --- RPC FUNCTIONS ---

-- 1. Helper: Log Auth Action
CREATE OR REPLACE FUNCTION log_auth_action(
    p_email TEXT, 
    p_action TEXT, 
    p_details TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO auth_logs (email, action, details)
    VALUES (p_email, p_action, p_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Login Function
CREATE OR REPLACE FUNCTION auth_login(
    p_email TEXT,
    p_password TEXT
) RETURNS JSONB AS $$
DECLARE
    v_user app_users%ROWTYPE;
BEGIN
    -- Find user
    SELECT * INTO v_user FROM app_users WHERE email = p_email;

    -- Check if exists
    IF v_user.id IS NULL THEN
        PERFORM log_auth_action(p_email, 'LOGIN_FAILED', 'User not found');
        RETURN jsonb_build_object('success', false, 'message', 'E-mail ou senha incorretos.');
    END IF;

    -- Check status
    IF v_user.status <> 'ACTIVE' THEN
        PERFORM log_auth_action(p_email, 'LOGIN_BLOCKED', 'User inactive');
        RETURN jsonb_build_object('success', false, 'message', 'Seu acesso foi desativado. Fale com o administrador.');
    END IF;

    -- Verify password
    IF v_user.password_hash = crypt(p_password, v_user.password_hash) THEN
        -- Success
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Request Access Logic
CREATE OR REPLACE FUNCTION auth_request_access(p_email TEXT) RETURNS JSONB AS $$
DECLARE
    v_allowlist app_allowlist%ROWTYPE;
    v_user app_users%ROWTYPE;
    v_token TEXT;
    v_expires TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Check allowlist
    SELECT * INTO v_allowlist FROM app_allowlist WHERE email = p_email AND status = 'ACTIVE';

    IF v_allowlist.id IS NULL THEN
        -- Silent failure matching requirement
        PERFORM log_auth_action(p_email, 'REQUEST_ACCESS_IGNORED', 'Email not in allowlist or inactive');
        RETURN jsonb_build_object('success', true, 'message', 'Se esse e-mail estiver autorizado, você receberá um link para criar sua senha.');
    END IF;

    -- Check if user already exists
    SELECT * INTO v_user FROM app_users WHERE email = p_email;
    IF v_user.id IS NOT NULL THEN
        PERFORM log_auth_action(p_email, 'REQUEST_ACCESS_IGNORED', 'User already registered');
        RETURN jsonb_build_object('success', true, 'message', 'Se esse e-mail estiver autorizado, você receberá um link para criar sua senha.'); 
        -- In a real app we might send a "You already have an account" email, but adhering to neutral message req.
    END IF;

    -- Generate Token
    v_token := encode(gen_random_bytes(32), 'hex');
    v_expires := NOW() + INTERVAL '60 minutes';

    INSERT INTO auth_tokens (email, token, type, expires_at)
    VALUES (p_email, v_token, 'ACTIVATION', v_expires);

    -- Log specific message for "email sending" simulation
    PERFORM log_auth_action(p_email, 'EMAIL_SENT_ACTIVATION', 'Link: ?token=' || v_token || '&type=activation');

    RETURN jsonb_build_object('success', true, 'message', 'Se esse e-mail estiver autorizado, você receberá um link para criar sua senha.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Activate User (Set Password)
CREATE OR REPLACE FUNCTION auth_activate_user(
    p_token TEXT,
    p_password TEXT,
    p_name TEXT
) RETURNS JSONB AS $$
DECLARE
    v_token_record auth_tokens%ROWTYPE;
    v_allowlist app_allowlist%ROWTYPE;
BEGIN
    -- Validate Token
    SELECT * INTO v_token_record FROM auth_tokens 
    WHERE token = p_token AND type = 'ACTIVATION' AND used = FALSE;

    IF v_token_record.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Token inválido.');
    END IF;

    IF v_token_record.expires_at < NOW() THEN
        RETURN jsonb_build_object('success', false, 'message', 'Este link expirou. Solicite um novo acesso.');
    END IF;

    -- Get Role from Allowlist
    SELECT * INTO v_allowlist FROM app_allowlist WHERE email = v_token_record.email;
    
    IF v_allowlist.id IS NULL OR v_allowlist.status <> 'ACTIVE' THEN
         RETURN jsonb_build_object('success', false, 'message', 'Acesso revogado.');
    END IF;

    -- Create User
    INSERT INTO app_users (email, password_hash, name, role, status)
    VALUES (
        v_token_record.email,
        crypt(p_password, gen_salt('bf')),
        p_name,
        v_allowlist.role,
        'ACTIVE'
    );

    -- Burn Token
    UPDATE auth_tokens SET used = TRUE WHERE id = v_token_record.id;
    PERFORM log_auth_action(v_token_record.email, 'USER_ACTIVATED', 'Account activated successfully');

    RETURN jsonb_build_object('success', true, 'message', 'Senha criada com sucesso. Faça login para entrar.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Request Reset Password
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

    -- Generate Token
    v_token := encode(gen_random_bytes(32), 'hex');
    v_expires := NOW() + INTERVAL '30 minutes';

    INSERT INTO auth_tokens (email, token, type, expires_at)
    VALUES (p_email, v_token, 'RESET', v_expires);

    -- Log for simulation
    PERFORM log_auth_action(p_email, 'EMAIL_SENT_RESET', 'Link: ?token=' || v_token || '&type=reset');

    RETURN jsonb_build_object('success', true, 'message', 'Se esse e-mail estiver autorizado, você receberá um link para redefinir sua senha.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Execute Reset Password
CREATE OR REPLACE FUNCTION auth_reset_password(
    p_token TEXT,
    p_password TEXT
) RETURNS JSONB AS $$
DECLARE
    v_token_record auth_tokens%ROWTYPE;
BEGIN
    SELECT * INTO v_token_record FROM auth_tokens 
    WHERE token = p_token AND type = 'RESET' AND used = FALSE;

    IF v_token_record.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Token inválido.');
    END IF;

    IF v_token_record.expires_at < NOW() THEN
        RETURN jsonb_build_object('success', false, 'message', 'Este link expirou. Solicite um novo acesso.');
    END IF;

    -- Update Password
    UPDATE app_users 
    SET password_hash = crypt(p_password, gen_salt('bf'))
    WHERE email = v_token_record.email;

    -- Burn Token
    UPDATE auth_tokens SET used = TRUE WHERE id = v_token_record.id;
    PERFORM log_auth_action(v_token_record.email, 'PASSWORD_RESET', 'Password reset successfully');

    RETURN jsonb_build_object('success', true, 'message', 'Senha redefinida com sucesso. Faça login novamente.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 7. Initial Seed (Admin User)
-- Insert Admin into Allowlist
INSERT INTO app_allowlist (email, role, status)
VALUES ('jader_dourado@hotmail.com', 'ADMIN', 'ACTIVE')
ON CONFLICT (email) DO NOTHING;

-- Insert Admin User (Password: 123456)
-- Note: In production, we'd use the activation flow, but for seed we insert directly.
INSERT INTO app_users (email, password_hash, name, role, status)
VALUES (
    'jader_dourado@hotmail.com',
    crypt('123456', gen_salt('bf')),
    'Admin Jader',
    'ADMIN',
    'ACTIVE'
)
ON CONFLICT (email) DO NOTHING;

-- Grant permissions for RLS policies if necessary (assuming anon role usage for now)
GRANT ALL ON app_allowlist TO anon, authenticated, service_role;
GRANT ALL ON app_users TO anon, authenticated, service_role;
GRANT ALL ON auth_tokens TO anon, authenticated, service_role;
GRANT ALL ON auth_logs TO anon, authenticated, service_role;
