-- Security Fix: Persistence for Call Center
-- This script relaxes RLS to ensure Call Center users can persist and retrieve their work.

-- 1. VISITS
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can see own visits" ON visits;
CREATE POLICY "Users can see own visits"
    ON visits FOR SELECT
    USING (
        salesperson_id = auth.uid() -- My visits
        OR
        (SELECT role FROM app_users WHERE id = auth.uid()) = 'ADMIN' -- Admin sees all
        -- CALL CENTER might need to see older visits to follow up, 
        -- but for now seeing own is critical.
    );

DROP POLICY IF EXISTS "Users can insert own visits" ON visits;
CREATE POLICY "Users can insert own visits"
    ON visits FOR INSERT
    WITH CHECK (
        salesperson_id = auth.uid() -- Only insert as myself
        OR
        (SELECT role FROM app_users WHERE id = auth.uid()) IN ('ADMIN', 'CALL_CENTER') -- Explicitly allow Call Center
    );

DROP POLICY IF EXISTS "Users can update own visits" ON visits;
CREATE POLICY "Users can update own visits"
    ON visits FOR UPDATE
    USING (
        salesperson_id = auth.uid()
        OR
        (SELECT role FROM app_users WHERE id = auth.uid()) = 'ADMIN'
    );

-- 2. VOUCHERS
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can see relevant vouchers" ON vouchers;
CREATE POLICY "Users can see relevant vouchers"
    ON vouchers FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM visits v 
            WHERE v.id = visit_id 
            AND v.salesperson_id = auth.uid()
        )
        OR
        (SELECT role FROM app_users WHERE id = auth.uid()) = 'ADMIN'
    );

DROP POLICY IF EXISTS "Users can insert vouchers" ON vouchers;
CREATE POLICY "Users can insert vouchers"
    ON vouchers FOR INSERT
    WITH CHECK (
        -- Can insert if the linked visit is mine
        EXISTS (
            SELECT 1 FROM visits v 
            WHERE v.id = visit_id 
            AND v.salesperson_id = auth.uid()
        )
        OR
        (SELECT role FROM app_users WHERE id = auth.uid()) = 'ADMIN'
    );

-- 3. EVENTS (Call Center needs to see ALL events to link academies)
DROP POLICY IF EXISTS "Sales/CallCenter see own events" ON events;
CREATE POLICY "See events based on role"
    ON events FOR SELECT
    USING (
        -- Sales sees assigned
        salesperson_id = auth.uid() 
        OR
        -- Admin and Call Center see ALL
        (SELECT role FROM app_users WHERE id = auth.uid()) IN ('ADMIN', 'CALL_CENTER')
    );
