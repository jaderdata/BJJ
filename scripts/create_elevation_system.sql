-- ============================================================================
-- Sistema de Elevação Temporária de Privilégios Administrativos
-- ============================================================================
-- Este script cria a infraestrutura para transformar o perfil de gestor
-- em um estado temporário ao invés de privilégios permanentes.
-- ============================================================================

-- 1. Tabela de Sessões Administrativas Temporárias
-- ============================================================================
CREATE TABLE IF NOT EXISTS admin_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    elevated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    reason TEXT,
    revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_reason TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON admin_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_active ON admin_sessions(user_id, expires_at) 
    WHERE revoked = FALSE;

-- 2. Tabela de Auditoria de Ações Administrativas
-- ============================================================================
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES admin_sessions(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para auditoria
CREATE INDEX IF NOT EXISTS idx_admin_audit_user_id ON admin_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_session_id ON admin_audit_log(session_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created_at ON admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_action ON admin_audit_log(action);

-- 3. RLS Policies
-- ============================================================================
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Permitir leitura para verificação de sessão ativa
CREATE POLICY "Public read active sessions" ON admin_sessions 
    FOR SELECT USING (true);

-- Permitir inserção via RPC
CREATE POLICY "Public insert sessions" ON admin_sessions 
    FOR INSERT WITH CHECK (true);

-- Permitir update via RPC
CREATE POLICY "Public update sessions" ON admin_sessions 
    FOR UPDATE USING (true);

-- Auditoria: permitir inserção
CREATE POLICY "Public insert audit" ON admin_audit_log 
    FOR INSERT WITH CHECK (true);

-- Auditoria: permitir leitura
CREATE POLICY "Public read audit" ON admin_audit_log 
    FOR SELECT USING (true);

-- 4. Função: Verificar Sessão Elevada Ativa
-- ============================================================================
CREATE OR REPLACE FUNCTION check_elevation(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_session admin_sessions%ROWTYPE;
BEGIN
    -- Buscar sessão ativa mais recente
    SELECT * INTO v_session
    FROM admin_sessions
    WHERE user_id = p_user_id
      AND revoked = FALSE
      AND expires_at > NOW()
    ORDER BY elevated_at DESC
    LIMIT 1;

    IF v_session.id IS NULL THEN
        RETURN jsonb_build_object(
            'elevated', false,
            'message', 'Nenhuma sessão administrativa ativa'
        );
    END IF;

    RETURN jsonb_build_object(
        'elevated', true,
        'session_id', v_session.id,
        'elevated_at', v_session.elevated_at,
        'expires_at', v_session.expires_at,
        'reason', v_session.reason,
        'time_remaining_seconds', EXTRACT(EPOCH FROM (v_session.expires_at - NOW()))
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Função: Criar Sessão Elevada
-- ============================================================================
CREATE OR REPLACE FUNCTION request_elevation(
    p_user_id UUID,
    p_password TEXT,
    p_reason TEXT DEFAULT NULL,
    p_duration_minutes INTEGER DEFAULT 30,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_user app_users%ROWTYPE;
    v_session_id UUID;
    v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- 1. Verificar se usuário existe e está ativo
    SELECT * INTO v_user
    FROM app_users
    WHERE id = p_user_id AND status = 'ACTIVE';

    IF v_user.id IS NULL THEN
        PERFORM log_auth_action(v_user.email, 'ELEVATION_FAILED', 'User not found or inactive');
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Usuário não encontrado ou inativo'
        );
    END IF;

    -- 2. Verificar se usuário é ADMIN
    IF v_user.role != 'ADMIN' THEN
        PERFORM log_auth_action(v_user.email, 'ELEVATION_DENIED', 'User is not admin');
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Apenas administradores podem elevar privilégios'
        );
    END IF;

    -- 3. Verificar senha
    IF v_user.password_hash != crypt(p_password, v_user.password_hash) THEN
        PERFORM log_auth_action(v_user.email, 'ELEVATION_FAILED', 'Invalid password');
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Senha incorreta'
        );
    END IF;

    -- 4. Revogar sessões antigas (cleanup)
    UPDATE admin_sessions
    SET revoked = TRUE,
        revoked_at = NOW(),
        revoked_reason = 'Auto-revoked: new session created'
    WHERE user_id = p_user_id
      AND revoked = FALSE;

    -- 5. Criar nova sessão
    v_expires_at := NOW() + (p_duration_minutes || ' minutes')::INTERVAL;
    
    INSERT INTO admin_sessions (
        user_id,
        expires_at,
        reason,
        ip_address,
        user_agent
    ) VALUES (
        p_user_id,
        v_expires_at,
        p_reason,
        p_ip_address,
        p_user_agent
    ) RETURNING id INTO v_session_id;

    -- 6. Log de auditoria
    PERFORM log_auth_action(
        v_user.email,
        'ELEVATION_GRANTED',
        format('Session ID: %s, Duration: %s min, Reason: %s', 
               v_session_id, p_duration_minutes, COALESCE(p_reason, 'Not specified'))
    );

    INSERT INTO admin_audit_log (
        session_id,
        user_id,
        action,
        details,
        ip_address,
        user_agent
    ) VALUES (
        v_session_id,
        p_user_id,
        'ELEVATION_GRANTED',
        jsonb_build_object(
            'duration_minutes', p_duration_minutes,
            'reason', p_reason
        ),
        p_ip_address,
        p_user_agent
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Privilégios elevados com sucesso',
        'session_id', v_session_id,
        'expires_at', v_expires_at,
        'duration_minutes', p_duration_minutes
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Função: Revogar Sessão Elevada
-- ============================================================================
CREATE OR REPLACE FUNCTION revoke_elevation(
    p_user_id UUID,
    p_reason TEXT DEFAULT 'Manual revocation'
)
RETURNS JSONB AS $$
DECLARE
    v_session admin_sessions%ROWTYPE;
    v_user app_users%ROWTYPE;
BEGIN
    -- Buscar usuário
    SELECT * INTO v_user FROM app_users WHERE id = p_user_id;

    -- Buscar sessão ativa
    SELECT * INTO v_session
    FROM admin_sessions
    WHERE user_id = p_user_id
      AND revoked = FALSE
      AND expires_at > NOW()
    ORDER BY elevated_at DESC
    LIMIT 1;

    IF v_session.id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Nenhuma sessão ativa para revogar'
        );
    END IF;

    -- Revogar sessão
    UPDATE admin_sessions
    SET revoked = TRUE,
        revoked_at = NOW(),
        revoked_reason = p_reason
    WHERE id = v_session.id;

    -- Log de auditoria
    PERFORM log_auth_action(
        v_user.email,
        'ELEVATION_REVOKED',
        format('Session ID: %s, Reason: %s', v_session.id, p_reason)
    );

    INSERT INTO admin_audit_log (
        session_id,
        user_id,
        action,
        details
    ) VALUES (
        v_session.id,
        p_user_id,
        'ELEVATION_REVOKED',
        jsonb_build_object('reason', p_reason)
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Sessão administrativa revogada com sucesso'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Função: Log de Ação Administrativa
-- ============================================================================
CREATE OR REPLACE FUNCTION log_admin_action(
    p_user_id UUID,
    p_action TEXT,
    p_resource_type TEXT DEFAULT NULL,
    p_resource_id TEXT DEFAULT NULL,
    p_details JSONB DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_session_id UUID;
BEGIN
    -- Buscar sessão ativa
    SELECT id INTO v_session_id
    FROM admin_sessions
    WHERE user_id = p_user_id
      AND revoked = FALSE
      AND expires_at > NOW()
    ORDER BY elevated_at DESC
    LIMIT 1;

    -- Inserir log
    INSERT INTO admin_audit_log (
        session_id,
        user_id,
        action,
        resource_type,
        resource_id,
        details,
        ip_address,
        user_agent
    ) VALUES (
        v_session_id,
        p_user_id,
        p_action,
        p_resource_type,
        p_resource_id,
        p_details,
        p_ip_address,
        p_user_agent
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Função: Limpar Sessões Expiradas (Manutenção)
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE admin_sessions
    SET revoked = TRUE,
        revoked_at = NOW(),
        revoked_reason = 'Auto-revoked: expired'
    WHERE revoked = FALSE
      AND expires_at < NOW();
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Atualizar Senha do Admin (SEGURANÇA URGENTE)
-- ============================================================================
-- Atualizar senha de 123456 para Jdls132057
UPDATE app_users
SET password_hash = crypt('Jdls132057', gen_salt('bf'))
WHERE email = 'jader_dourado@hotmail.com';

-- Log da mudança
INSERT INTO auth_logs (email, action, details)
VALUES ('jader_dourado@hotmail.com', 'PASSWORD_CHANGED', 'Security upgrade: weak password replaced');

-- 10. Grants
-- ============================================================================
GRANT ALL ON admin_sessions TO anon, authenticated, service_role;
GRANT ALL ON admin_audit_log TO anon, authenticated, service_role;

-- ============================================================================
-- Fim do Script
-- ============================================================================
