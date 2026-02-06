-- Phase 1 Hardening: Closing the Public Door
-- WARNING: Ensure Frontend is using RPCs before running this!

-- 1. Revoke the "Public read users" policy (The big security hole)
-- This stops `supabase.from('app_users').select('*')` from working for anonymous users.
DROP POLICY IF EXISTS "Public read users" ON app_users;

-- 2. Ensure RLS is enabled
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- 3. (Optional) Create a policy that effectively allows nothing for direct access by 'anon'
-- In Supabase/Postgres, if no policy matches, access is DENIED.
-- Since we removed the only policy allowing 'anon' to SELECT, it is now closed.

-- 4. Note on RPCs: 
-- The functions `get_profile`, `list_salespersons`, `auth_login` are defined as `SECURITY DEFINER`.
-- This means they run with the privileges of the creator (likely postgres/admin), 
-- effectively bypassing the RLS restriction we just cleaned up. 
-- This is exactly what we want: controlled access methods only.

-- 5. Extra Safety: Ensure 'service_role' (your backend scripts) can still access everything
-- Usually service_role bypasses RLS, but if we need a policy:
-- CREATE POLICY "Service Role Full Access" ON app_users FOR ALL TO service_role USING (true) WITH CHECK (true);
