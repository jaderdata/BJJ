-- Restore Public Access Policies
-- This script restores the original permissive RLS policies

-- ACADEMIES
DROP POLICY IF EXISTS "Public read academies" ON academies;
CREATE POLICY "Public read academies" ON academies FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert academies" ON academies;
CREATE POLICY "Public insert academies" ON academies FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update academies" ON academies;
CREATE POLICY "Public update academies" ON academies FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public delete academies" ON academies;
CREATE POLICY "Public delete academies" ON academies FOR DELETE USING (true);

-- EVENTS
DROP POLICY IF EXISTS "Public read events" ON events;
CREATE POLICY "Public read events" ON events FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert events" ON events;
CREATE POLICY "Public insert events" ON events FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update events" ON events;
CREATE POLICY "Public update events" ON events FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public delete events" ON events;
CREATE POLICY "Public delete events" ON events FOR DELETE USING (true);

-- VISITS
DROP POLICY IF EXISTS "Public read visits" ON visits;
CREATE POLICY "Public read visits" ON visits FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert visits" ON visits;
CREATE POLICY "Public insert visits" ON visits FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update visits" ON visits;
CREATE POLICY "Public update visits" ON visits FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public delete visits" ON visits;
CREATE POLICY "Public delete visits" ON visits FOR DELETE USING (true);

-- VOUCHERS
DROP POLICY IF EXISTS "Public read vouchers" ON vouchers;
CREATE POLICY "Public read vouchers" ON vouchers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert vouchers" ON vouchers;
CREATE POLICY "Public insert vouchers" ON vouchers FOR INSERT WITH CHECK (true);

-- FINANCE RECORDS
DROP POLICY IF EXISTS "Public read finance" ON finance_records;
CREATE POLICY "Public read finance" ON finance_records FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert finance" ON finance_records;
CREATE POLICY "Public insert finance" ON finance_records FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update finance" ON finance_records;
CREATE POLICY "Public update finance" ON finance_records FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public delete finance" ON finance_records;
CREATE POLICY "Public delete finance" ON finance_records FOR DELETE USING (true);

-- APP USERS
DROP POLICY IF EXISTS "Public read users" ON app_users;
CREATE POLICY "Public read users" ON app_users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public update users" ON app_users;
CREATE POLICY "Public update users" ON app_users FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public delete users" ON app_users;
CREATE POLICY "Public delete users" ON app_users FOR DELETE USING (true);

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Public read notifications" ON notifications;
CREATE POLICY "Public read notifications" ON notifications FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert notifications" ON notifications;
CREATE POLICY "Public insert notifications" ON notifications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update notifications" ON notifications;
CREATE POLICY "Public update notifications" ON notifications FOR UPDATE USING (true);

-- EVENT_ACADEMIES
DROP POLICY IF EXISTS "Public read event_academies" ON event_academies;
CREATE POLICY "Public read event_academies" ON event_academies FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert event_academies" ON event_academies;
CREATE POLICY "Public insert event_academies" ON event_academies FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public delete event_academies" ON event_academies;
CREATE POLICY "Public delete event_academies" ON event_academies FOR DELETE USING (true);
