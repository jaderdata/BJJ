-- RESTAURAR AMBIENTE UNIFICADO (FIX PERMISSIONS)
-- Este script restaura o acesso total ao banco de dados para permitir que o sistema
-- funcione como um "Ambiente Único" (Local + Produção usando o mesmo DB).
-- Ele remove restrições de RLS que foram provavelmente introduzidas na tentativa de divisão.

-- 1. Desabilitar RLS temporariamente para limpeza
ALTER TABLE academies DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE visits DISABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers DISABLE ROW LEVEL SECURITY;
ALTER TABLE finance_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_academies DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_allowlist DISABLE ROW LEVEL SECURITY;
ALTER TABLE auth_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE auth_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings DISABLE ROW LEVEL SECURITY;

-- 2. Remover todas as políticas existentes (Limpeza profunda)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname 
              FROM pg_policies 
              WHERE schemaname = 'public') 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- 3. Habilitar RLS e criar políticas permissivas (Allow All)
-- Isso garante que tanto 'anon' (local/frontend) quanto 'authenticated' (backend) funcionem.

-- ACADEMIES
ALTER TABLE academies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Accesible by all" ON academies FOR ALL USING (true) WITH CHECK (true);

-- EVENTS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Accesible by all" ON events FOR ALL USING (true) WITH CHECK (true);

-- VISITS
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Accesible by all" ON visits FOR ALL USING (true) WITH CHECK (true);

-- VOUCHERS
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Accesible by all" ON vouchers FOR ALL USING (true) WITH CHECK (true);

-- FINANCE RECORDS
ALTER TABLE finance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Accesible by all" ON finance_records FOR ALL USING (true) WITH CHECK (true);

-- APP USERS
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Accesible by all" ON app_users FOR ALL USING (true) WITH CHECK (true);

-- NOTIFICATIONS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Accesible by all" ON notifications FOR ALL USING (true) WITH CHECK (true);

-- EVENT_ACADEMIES
ALTER TABLE event_academies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Accesible by all" ON event_academies FOR ALL USING (true) WITH CHECK (true);

-- APP_ALLOWLIST
ALTER TABLE app_allowlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Accesible by all" ON app_allowlist FOR ALL USING (true) WITH CHECK (true);

-- AUTH_TOKENS
ALTER TABLE auth_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Accesible by all" ON auth_tokens FOR ALL USING (true) WITH CHECK (true);

-- AUTH_LOGS
ALTER TABLE auth_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Accesible by all" ON auth_logs FOR ALL USING (true) WITH CHECK (true);

-- ADMIN_SESSIONS
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Accesible by all" ON admin_sessions FOR ALL USING (true) WITH CHECK (true);

-- ADMIN_AUDIT_LOG
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Accesible by all" ON admin_audit_log FOR ALL USING (true) WITH CHECK (true);

-- SYSTEM_SETTINGS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Accesible by all" ON system_settings FOR ALL USING (true) WITH CHECK (true);

-- 4. Garantir permissões para roles (anon e authenticated)
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- 5. Confirmação
SELECT 'Sistema restaurado para Ambiente Único com sucesso' as status;
