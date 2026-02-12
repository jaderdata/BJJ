-- FIX USER PROFILE SCHEMA & RPCS
-- Este script corrige a tabela de usuários e as funções de autenticação
-- para garantir que dados de perfil (cidade, telefone, foto) sejam salvos e retornados.

-- 1. Adicionar colunas faltantes na tabela app_users (se não existirem)
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS uf TEXT;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- 2. Atualizar função de LOGIN para retornar os novos campos
CREATE OR REPLACE FUNCTION auth_login(
    p_email TEXT,
    p_password TEXT
) RETURNS JSONB AS $$
DECLARE
    v_user app_users%ROWTYPE;
BEGIN
    -- Busca usuário
    SELECT * INTO v_user FROM app_users WHERE email = p_email;

    -- Verifica existência
    IF v_user.id IS NULL THEN
        PERFORM log_auth_action(p_email, 'LOGIN_FAILED', 'User not found');
        RETURN jsonb_build_object('success', false, 'message', 'E-mail ou senha incorretos.');
    END IF;

    -- Verifica status
    IF v_user.status <> 'ACTIVE' THEN
        PERFORM log_auth_action(p_email, 'LOGIN_BLOCKED', 'User inactive');
        RETURN jsonb_build_object('success', false, 'message', 'Seu acesso foi desativado. Fale com o administrador.');
    END IF;

    -- Verifica senha
    IF v_user.password_hash = crypt(p_password, v_user.password_hash) THEN
        -- Sucesso
        UPDATE app_users SET last_login = NOW() WHERE id = v_user.id;
        PERFORM log_auth_action(p_email, 'LOGIN_SUCCESS', 'Login successful');
        
        -- Retorna objeto User completo (Mapeando photo_url -> photoUrl para o frontend)
        RETURN jsonb_build_object(
            'success', true, 
            'user', jsonb_build_object(
                'id', v_user.id,
                'email', v_user.email,
                'name', v_user.name,
                'role', v_user.role,
                'phone', v_user.phone,
                'city', v_user.city,
                'uf', v_user.uf,
                'photoUrl', v_user.photo_url -- CamelCase para o Frontend
            )
        );
    ELSE
        PERFORM log_auth_action(p_email, 'LOGIN_FAILED', 'Invalid password');
        RETURN jsonb_build_object('success', false, 'message', 'E-mail ou senha incorretos.');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Criar/Atualizar função get_profile para retornar dados atualizados
-- Esta função é chamada pelo DatabaseService.getProfile com parâmetro p_user_id
DROP FUNCTION IF EXISTS get_profile;

CREATE OR REPLACE FUNCTION get_profile(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    email TEXT,
    role TEXT,
    phone TEXT,
    city TEXT,
    uf TEXT,
    photo_url TEXT
) AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.phone,
        u.city,
        u.uf,
        u.photo_url
    FROM app_users u
    WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Garantir permissões
GRANT EXECUTE ON FUNCTION auth_login TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_profile TO anon, authenticated, service_role;

-- 5. Helper para verificar se funcionou (opcional, apenas retorna status)
SELECT 'Schema de usuários e RPCs atualizados com sucesso' as status;
