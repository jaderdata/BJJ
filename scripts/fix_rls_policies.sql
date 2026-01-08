-- OPEN RLS FOR ANONYMOUS ACCESS (Custom Auth Mode)
-- Since we are managing Authentication via "app_users" and not Supabase Auth,
-- the application connects as "anon" role. We must allow this role to read/write data.
-- Security is enforced by the Application Backend Logic (Frontend + RPCs) or simply trusting the client for this stage.

-- 1. Academies
DROP POLICY IF EXISTS "Enable read for authenticated users" ON academies;
CREATE POLICY "Public read academies" ON academies FOR SELECT USING (true);
CREATE POLICY "Public insert academies" ON academies FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update academies" ON academies FOR UPDATE USING (true);
CREATE POLICY "Public delete academies" ON academies FOR DELETE USING (true);

-- 2. Events
CREATE POLICY "Public read events" ON events FOR SELECT USING (true);
CREATE POLICY "Public insert events" ON events FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update events" ON events FOR UPDATE USING (true);
CREATE POLICY "Public delete events" ON events FOR DELETE USING (true);

-- 3. Visits
CREATE POLICY "Public read visits" ON visits FOR SELECT USING (true);
CREATE POLICY "Public insert visits" ON visits FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update visits" ON visits FOR UPDATE USING (true);

-- 4. Finance Records
CREATE POLICY "Public read finance" ON finance_records FOR SELECT USING (true);
CREATE POLICY "Public insert finance" ON finance_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update finance" ON finance_records FOR UPDATE USING (true);

-- 5. Vouchers
CREATE POLICY "Public read vouchers" ON vouchers FOR SELECT USING (true);
CREATE POLICY "Public insert vouchers" ON vouchers FOR INSERT WITH CHECK (true);

-- 6. Event Academies (Join Table)
CREATE POLICY "Public read event_academies" ON event_academies FOR SELECT USING (true);
CREATE POLICY "Public insert event_academies" ON event_academies FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete event_academies" ON event_academies FOR DELETE USING (true);

-- 7. System Logs
CREATE POLICY "Public read system_logs" ON system_logs FOR SELECT USING (true);
CREATE POLICY "Public insert system_logs" ON system_logs FOR INSERT WITH CHECK (true);

-- 8. Notifications
CREATE POLICY "Public read notifications" ON notifications FOR SELECT USING (true);
CREATE POLICY "Public insert notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update notifications" ON notifications FOR UPDATE USING (true);
CREATE POLICY "Public delete notifications" ON notifications FOR DELETE USING (true);
