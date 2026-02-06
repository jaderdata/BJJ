-- Complete RLS Reset Script
-- This will completely disable RLS and then re-enable with permissive policies

-- First, disable RLS on all tables
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

-- Drop all existing policies
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

-- Re-enable RLS with permissive policies
ALTER TABLE academies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON academies FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON events FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON visits FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON vouchers FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE finance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON finance_records FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON app_users FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON notifications FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE event_academies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON event_academies FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE app_allowlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON app_allowlist FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE auth_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON auth_tokens FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE auth_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON auth_logs FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON admin_sessions FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON admin_audit_log FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON system_settings FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions to anon role
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;
