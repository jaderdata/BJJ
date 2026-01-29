-- Fix Redundant RLS Policies
-- Splits "Admin ALL" policies into separate INSERT/UPDATE/DELETE policies
-- This prevents the "Multiple Permissive Policies" warning for SELECT operations
-- (since "Authenticated read" already covers SELECT).

-- 1. academies
DROP POLICY IF EXISTS "Admin users can manage academies" ON public.academies;
-- Explicitly allow modification (Read is covered by "Authenticated read academies")
CREATE POLICY "Admin insert academies" ON public.academies FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'ADMIN')
);
CREATE POLICY "Admin update academies" ON public.academies FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'ADMIN')
);
CREATE POLICY "Admin delete academies" ON public.academies FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'ADMIN')
);

-- 2. events
DROP POLICY IF EXISTS "Admin users can manage events" ON public.events;
CREATE POLICY "Admin insert events" ON public.events FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'ADMIN')
);
CREATE POLICY "Admin update events" ON public.events FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'ADMIN')
);
CREATE POLICY "Admin delete events" ON public.events FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'ADMIN')
);

-- 3. event_academies
DROP POLICY IF EXISTS "Admin users can manage event_academies" ON public.event_academies;
CREATE POLICY "Admin insert event_academies" ON public.event_academies FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'ADMIN')
);
CREATE POLICY "Admin update event_academies" ON public.event_academies FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'ADMIN')
);
CREATE POLICY "Admin delete event_academies" ON public.event_academies FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'ADMIN')
);

-- 4. system_settings
DROP POLICY IF EXISTS "Admin users can manage system_settings" ON public.system_settings;
-- "Public read system_settings" covers SELECT.
CREATE POLICY "Admin insert system_settings" ON public.system_settings FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'ADMIN')
);
CREATE POLICY "Admin update system_settings" ON public.system_settings FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'ADMIN')
);
CREATE POLICY "Admin delete system_settings" ON public.system_settings FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'ADMIN')
);
