-- Security Fix: Restrict Access for Call Center & Sales
-- This script ensures RLS is strictly enforcing row access based on role and ownership.

-- 1. Events RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sales/CallCenter see own events" ON events;
CREATE POLICY "Sales/CallCenter see own events"
    ON events FOR SELECT
    USING (
        auth.uid() = salesperson_id -- Users see events assigned to them
        OR
        (SELECT role FROM app_users WHERE id = auth.uid()) = 'ADMIN' -- Admins see all
    );

-- 2. Visits RLS
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sales/CallCenter see own visits" ON visits;
CREATE POLICY "Sales/CallCenter see own visits"
    ON visits FOR SELECT
    USING (
        auth.uid() = salesperson_id
        OR
        (SELECT role FROM app_users WHERE id = auth.uid()) = 'ADMIN'
    );

DROP POLICY IF EXISTS "Sales/CallCenter insert own visits" ON visits;
CREATE POLICY "Sales/CallCenter insert own visits"
    ON visits FOR INSERT
    WITH CHECK (
        auth.uid() = salesperson_id
    );

DROP POLICY IF EXISTS "Sales/CallCenter update own visits" ON visits;
CREATE POLICY "Sales/CallCenter update own visits"
    ON visits FOR UPDATE
    USING (
        auth.uid() = salesperson_id
    );


-- 3. Academies (Public read is usually needed for listing, but write restricted)
ALTER TABLE academies ENABLE ROW LEVEL SECURITY;

-- Everyone can read academies (needed for 'Link Academy' search)
DROP POLICY IF EXISTS "Everyone can read academies" ON academies;
CREATE POLICY "Everyone can read academies"
    ON academies FOR SELECT
    USING (true);

-- Only Admin or Call Center can create academies?
-- If Call Center can create, we need a policy for it.
DROP POLICY IF EXISTS "CallCenter create academy" ON academies;
CREATE POLICY "CallCenter create academy"
    ON academies FOR INSERT
    WITH CHECK (
        (SELECT role FROM app_users WHERE id = auth.uid()) IN ('ADMIN', 'CALL_CENTER')
    );

-- 4. Event Academies (Linking)
ALTER TABLE event_academies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "CallCenter/Sales link academy" ON event_academies;
CREATE POLICY "CallCenter/Sales link academy"
    ON event_academies FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM events WHERE id = event_id AND salesperson_id = auth.uid()
        )
        OR
        (SELECT role FROM app_users WHERE id = auth.uid()) = 'ADMIN'
    );

DROP POLICY IF EXISTS "Everyone read links" ON event_academies;
CREATE POLICY "Everyone read links"
    ON event_academies FOR SELECT
    USING (true);

