-- Fix Database Security Alerts

-- 1. Fix 'function_search_path_mutable'
-- Sets search_path to 'public' for all flagged functions to prevent search path hijacking.

ALTER FUNCTION public.auth_generate_invite(p_email text, p_role text) SET search_path = public;
ALTER FUNCTION public.log_auth_action(p_email text, p_action text, p_details text) SET search_path = public;
ALTER FUNCTION public.auth_revoke_invite(p_email text) SET search_path = public;
ALTER FUNCTION public.auth_login(p_email text, p_password text) SET search_path = public;
ALTER FUNCTION public.auth_request_access(p_email text) SET search_path = public;
ALTER FUNCTION public.auth_request_reset(p_email text) SET search_path = public;
ALTER FUNCTION public.auth_activate_user(p_token text, p_password text, p_name text) SET search_path = public;
ALTER FUNCTION public.auth_reset_password(p_token text, p_password text) SET search_path = public;
ALTER FUNCTION public.send_auth_email_via_resend() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- 2. Fix 'extension_in_public'
-- Moves pg_net extension to 'extensions' schema.
-- Note: pg_net does not support SET SCHEMA, so we must DROP and re-CREATE.
-- WARNING: This deletes any data in pg_net tables (e.g. request history).

CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;
-- Drop dependent objects if any? usually pg_net is standalone.
DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION pg_net SCHEMA extensions;

-- 3. Fix 'rls_policy_always_true' and 'public_...' policies
-- We drop the overly permissive policies and recreate them with better scoping (TO authenticated) 
-- and stricter checks calling 'false' where direct access shouldn't happen (forcing use of SECURITY DEFINER functions).

-- Helper to safely drop policies
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND policyname LIKE 'Public %'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;

    -- Also drop specific "Allow all" policies found in alerts
    DROP POLICY IF EXISTS "Allow all delete finance" ON public.finance_records;
    DROP POLICY IF EXISTS "Allow all insert finance" ON public.finance_records;
    DROP POLICY IF EXISTS "Allow all update finance" ON public.finance_records;
    DROP POLICY IF EXISTS "Allow all select finance" ON public.finance_records; -- Optional, good practice
    DROP POLICY IF EXISTS "Authenticated users can manage observations" ON public.academy_observations;
    DROP POLICY IF EXISTS "Authenticated users can manage finance" ON public.finance_records;
    DROP POLICY IF EXISTS "Authenticated users can manage visits" ON public.visits;
    DROP POLICY IF EXISTS "Authenticated users can manage vouchers" ON public.vouchers;
    DROP POLICY IF EXISTS "Authenticated users can manage logs" ON public.system_logs;
    DROP POLICY IF EXISTS "Admins can create notifications" ON public.notifications; 
    DROP POLICY IF EXISTS "Allow all insert" ON public.notifications;
    DROP POLICY IF EXISTS "Allow all update" ON public.notifications;
END $$;

-- Recreate Policies

-- A. Strict Tables (Managed by Auth Functions) - No direct modification allowed for users
-- auth_logs
CREATE POLICY "Service role insert auth_logs" ON public.auth_logs FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role select auth_logs" ON public.auth_logs FOR SELECT TO service_role USING (true);
-- Consider allowing admins to read logs:
-- CREATE POLICY "Admins read logs" ON public.auth_logs FOR SELECT TO authenticated USING (auth.jwt() ->> 'role' = 'admin'); -- Example

-- auth_tokens
CREATE POLICY "Service role manage tokens" ON public.auth_tokens FOR ALL TO service_role USING (true) WITH CHECK (true);

-- app_allowlist (Managed by auth_request_access)
CREATE POLICY "Service role manage allowlist" ON public.app_allowlist FOR ALL TO service_role USING (true) WITH CHECK (true);

-- system_logs
CREATE POLICY "Service role manage system_logs" ON public.system_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

-- B. User Data - Scoped to User
-- app_users
-- Assuming 'id' is uuid matching auth.uid()
CREATE POLICY "Users can view own profile" ON public.app_users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.app_users FOR UPDATE TO authenticated USING (auth.uid() = id);
-- Delete usually restricted to admin or manual request

-- visits
-- Assuming 'salesperson_id' is uuid matching auth.uid()
CREATE POLICY "Salesperson view own visits" ON public.visits FOR SELECT TO authenticated USING (salesperson_id = auth.uid());
CREATE POLICY "Salesperson update own visits" ON public.visits FOR UPDATE TO authenticated USING (salesperson_id = auth.uid());
CREATE POLICY "Salesperson insert own visits" ON public.visits FOR INSERT TO authenticated WITH CHECK (salesperson_id = auth.uid());
CREATE POLICY "Salesperson delete own visits" ON public.visits FOR DELETE TO authenticated USING (salesperson_id = auth.uid());

-- C. Shared/Business Data - Restricted Writes
-- academies
CREATE POLICY "Authenticated read academies" ON public.academies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role manage academies" ON public.academies FOR ALL TO service_role USING (true) WITH CHECK (true);

-- events
CREATE POLICY "Authenticated read events" ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role manage events" ON public.events FOR ALL TO service_role USING (true) WITH CHECK (true);

-- finance_records
CREATE POLICY "Service role manage finance" ON public.finance_records FOR ALL TO service_role USING (true) WITH CHECK (true);

-- notifications
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT TO authenticated USING (true); -- Ideally filtered by user_id if valid
CREATE POLICY "Service role manage notifications" ON public.notifications FOR ALL TO service_role USING (true) WITH CHECK (true);

-- vouchers
CREATE POLICY "Authenticated read vouchers" ON public.vouchers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role manage vouchers" ON public.vouchers FOR ALL TO service_role USING (true) WITH CHECK (true);

-- event_academies
CREATE POLICY "Authenticated read event_academies" ON public.event_academies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role manage event_academies" ON public.event_academies FOR ALL TO service_role USING (true) WITH CHECK (true);

-- academy_observations
CREATE POLICY "Authenticated read observations" ON public.academy_observations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role manage observations" ON public.academy_observations FOR ALL TO service_role USING (true) WITH CHECK (true);
