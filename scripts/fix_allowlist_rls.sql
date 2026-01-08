-- FIX RLS FOR CUSTOM AUTH
-- Since we are bypassing Supabase Auth, we are connecting as 'anon'.
-- We need to ensure 'anon' has permissions to Insert/Select/Update these custom tables.

-- 1. App Allowlist
DROP POLICY IF EXISTS "Public read allowlist" ON app_allowlist;
DROP POLICY IF EXISTS "Public insert allowlist" ON app_allowlist;
DROP POLICY IF EXISTS "Public update allowlist" ON app_allowlist;

CREATE POLICY "Public read allowlist" ON app_allowlist FOR SELECT USING (true);
CREATE POLICY "Public insert allowlist" ON app_allowlist FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update allowlist" ON app_allowlist FOR UPDATE USING (true);

-- 2. App Users
DROP POLICY IF EXISTS "Public read users" ON app_users;
CREATE POLICY "Public read users" ON app_users FOR SELECT USING (true);

-- 3. Auth Logs
DROP POLICY IF EXISTS "Public read logs" ON auth_logs;
CREATE POLICY "Public read logs" ON auth_logs FOR SELECT USING (true);

-- Grant privileges (just in case)
GRANT ALL ON app_allowlist TO anon, authenticated, service_role;
GRANT ALL ON app_users TO anon, authenticated, service_role;
GRANT ALL ON auth_tokens TO anon, authenticated, service_role;
GRANT ALL ON auth_logs TO anon, authenticated, service_role;
