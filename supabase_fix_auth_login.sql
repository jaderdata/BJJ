-- ✅ CORREÇÃO: Verificar status ACTIVE no login

-- Esta função RPC precisa ser criada/atualizada no Supabase
-- Vá em: SQL Editor no Supabase e execute este código

CREATE OR REPLACE FUNCTION auth_login(p_email TEXT, p_password TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user RECORD;
    v_allowlist RECORD;
    v_password_hash TEXT;
BEGIN
    -- Normalizar email
    p_email := LOWER(TRIM(p_email));
    
    -- Buscar usuário
    SELECT * INTO v_user
    FROM app_users
    WHERE email = p_email;
    
    -- Se usuário não existe
    IF NOT FOUND THEN
        -- Log de falha
        INSERT INTO auth_logs (email, action, details)
        VALUES (p_email, 'LOGIN_FAILED', 'Usuário não encontrado');
        
        RETURN json_build_object(
            'success', false,
            'message', 'Email ou senha incorretos'
        );
    END IF;
    
    -- Verificar se está na allowlist
    SELECT * INTO v_allowlist
    FROM app_allowlist
    WHERE email = p_email;
    
    -- Se não está na allowlist
    IF NOT FOUND THEN
        INSERT INTO auth_logs (email, action, details)
        VALUES (p_email, 'LOGIN_BLOCKED', 'Usuário não está na allowlist');
        
        RETURN json_build_object(
            'success', false,
            'message', 'Acesso não autorizado'
        );
    END IF;
    
    -- ✅ VERIFICAR SE O STATUS É ACTIVE
    IF v_allowlist.status != 'ACTIVE' THEN
        INSERT INTO auth_logs (email, action, details)
        VALUES (p_email, 'LOGIN_BLOCKED', 'Usuário inativo - status: ' || v_allowlist.status);
        
        RETURN json_build_object(
            'success', false,
            'message', 'Sua conta está inativa. Entre em contato com o administrador.'
        );
    END IF;
    
    -- Verificar senha
    v_password_hash := crypt(p_password, v_user.password_hash);
    
    IF v_password_hash != v_user.password_hash THEN
        INSERT INTO auth_logs (email, action, details)
        VALUES (p_email, 'LOGIN_FAILED', 'Senha incorreta');
        
        RETURN json_build_object(
            'success', false,
            'message', 'Email ou senha incorretos'
        );
    END IF;
    
    -- Login bem-sucedido
    INSERT INTO auth_logs (email, action, details)
    VALUES (p_email, 'LOGIN_SUCCESS', 'Login realizado com sucesso');
    
    RETURN json_build_object(
        'success', true,
        'message', 'Login realizado com sucesso',
        'user', json_build_object(
            'id', v_user.id,
            'name', v_user.name,
            'email', v_user.email,
            'role', v_allowlist.role
        )
    );
END;
$$;

-- Garantir que a função pode ser executada por usuários autenticados
GRANT EXECUTE ON FUNCTION auth_login(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION auth_login(TEXT, TEXT) TO anon;
