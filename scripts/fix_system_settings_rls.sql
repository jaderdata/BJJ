-- Fix Permissive System Settings Policy
-- Restricts modification of system_settings to Admin users and Service Role only.

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated manage system_settings" ON public.system_settings;

-- Create strict policy for Admins
-- Uses optimized subquery structure for performance
CREATE POLICY "Admin users can manage system_settings" ON public.system_settings FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'ADMIN')
);

-- Ensure Service Role has full access
CREATE POLICY "Service role manage system_settings" ON public.system_settings FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Ensure Public/Auth read access remains (if intended)
-- "Public read system_settings" should already exist from previous script, but ensuring it's there is safe.
-- CREATE POLICY "Public read system_settings" ON public.system_settings FOR SELECT TO public USING (true);
