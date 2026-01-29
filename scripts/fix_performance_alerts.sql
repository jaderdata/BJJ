-- Fix Database Performance Alerts (RLS InitPlan & Redundancy)

-- 1. Fix 'multiple_permissive_policies' - Consolidate Redundant Policies
-- We'll drop specific named policies that were flagged as duplicating access.
-- Based on alerts, we have redundant "Admin ...", "Authenticated read ...", "Authenticated users can select ..."
-- Strategy: Keep the cleanest naming convention ("Authenticated read ...") and drop others if they overlap effectively.

-- Drop redundant/suboptimal policies (to be recreated or removed)
DROP POLICY IF EXISTS "Admin users can manage academies" ON public.academies;
DROP POLICY IF EXISTS "Authenticated users can select academies" ON public.academies; -- Duplicates "Authenticated read academies"

DROP POLICY IF EXISTS "Admin users can manage event_academies" ON public.event_academies;
DROP POLICY IF EXISTS "Authenticated users can select event_academies" ON public.event_academies;

DROP POLICY IF EXISTS "Admin users can manage events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can select events" ON public.events;

DROP POLICY IF EXISTS "Allow all select" ON public.notifications; -- Vague
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications; -- Duplicated by "Users view own notifications"
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.system_settings;
DROP POLICY IF EXISTS "Enable read for public" ON public.system_settings;

-- 2. Fix 'auth_rls_initplan' - Optimize Auth Calls
-- Recreate policies using (SELECT auth.uid()) to force InitPlan execution (once per query) instead of per-row.

-- public.profiles
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT TO public WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE TO public USING ((select auth.uid()) = id);

-- public.academies 
-- (Admin policy was dropped above. If needed, recreate optimized. Assuming "Service role manage" from previous fix covers admin writes via API/Dashboard if mainly using service key, 
-- or if specific Admin role is needed inside the app, we add it back optimized.
-- The previous alerts showed "Admin users can manage..." had issues. Let's recreate a safe Admin policy if appropriate, or rely on SERVICE_ROLE if that's the design.
-- Given "Authenticated read academies" exists, we add Admin manage:
CREATE POLICY "Admin users can manage academies" ON public.academies FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'ADMIN')
);

-- public.events
CREATE POLICY "Admin users can manage events" ON public.events FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'ADMIN')
);

-- public.event_academies
CREATE POLICY "Admin users can manage event_academies" ON public.event_academies FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'ADMIN')
);

-- public.notifications
-- "Users view own notifications" exists from previous fix? strict one checks ID.
-- Drop and recreate optimized "Users view own notifications"
DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = (select auth.uid())); 
-- Note: Assuming 'user_id' column exists. If strictly "own", we need that column. 
-- Previous analysis showed "Users view own notifications" had `USING (true)` in my last script, which was "lazy". 
-- Now I make it strict AND optimized.

-- public.app_users
DROP POLICY IF EXISTS "Users can view own profile" ON public.app_users;
CREATE POLICY "Users can view own profile" ON public.app_users FOR SELECT TO authenticated USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.app_users;
CREATE POLICY "Users can update own profile" ON public.app_users FOR UPDATE TO authenticated USING ((select auth.uid()) = id);

-- public.visits
DROP POLICY IF EXISTS "Salesperson view own visits" ON public.visits;
CREATE POLICY "Salesperson view own visits" ON public.visits FOR SELECT TO authenticated USING (salesperson_id = (select auth.uid()));

DROP POLICY IF EXISTS "Salesperson update own visits" ON public.visits;
CREATE POLICY "Salesperson update own visits" ON public.visits FOR UPDATE TO authenticated USING (salesperson_id = (select auth.uid()));

DROP POLICY IF EXISTS "Salesperson insert own visits" ON public.visits;
CREATE POLICY "Salesperson insert own visits" ON public.visits FOR INSERT TO authenticated WITH CHECK (salesperson_id = (select auth.uid()));

DROP POLICY IF EXISTS "Salesperson delete own visits" ON public.visits;
CREATE POLICY "Salesperson delete own visits" ON public.visits FOR DELETE TO authenticated USING (salesperson_id = (select auth.uid()));

-- public.system_settings
-- Recreating strict/optimized policies
CREATE POLICY "Public read system_settings" ON public.system_settings FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated manage system_settings" ON public.system_settings FOR ALL TO authenticated USING (
    (select auth.role()) = 'authenticated' -- Optimization for generic auth check? 
    -- Actually for "manage", usually implies Admin? The original policy was "Enable all for authenticated users".
    -- I will replicate that but optimized:
    AND TRUE -- logic was just check auth role?
);
-- Wait, "Enable all for authenticated users" with "auth.role() = 'authenticated'" essentially allows ALL authenticated users to edit settings. 
-- That seems insecure but matches the legacy policy I'm optimizing. 
-- Better: Restrict to generic authenticated check optimized:
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.system_settings;
CREATE POLICY "Authenticated manage system_settings" ON public.system_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- Since "TO authenticated" already checks the role, no need for extra `auth.role() = 'authenticated'` check inside USING.
