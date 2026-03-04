-- Migration: Multi-Vendor Event Support (Many-to-Many)
-- Run this script in your Supabase SQL Editor

-- 1. Create the junction table
CREATE TABLE IF NOT EXISTS event_salespersons (
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    salesperson_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (event_id, salesperson_id)
);

-- Index for reverse lookups (finding events by salesperson)
CREATE INDEX IF NOT EXISTS idx_event_salespersons_salesperson_id ON event_salespersons(salesperson_id);

-- 2. Migrate existing data (preserve current assignments)
INSERT INTO event_salespersons (event_id, salesperson_id)
SELECT id, salesperson_id 
FROM events 
WHERE salesperson_id IS NOT NULL
AND EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = events.salesperson_id)
ON CONFLICT DO NOTHING;

-- 3. RLS Policies for event_salespersons
ALTER TABLE event_salespersons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read event_salespersons"
    ON event_salespersons FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage event_salespersons"
    ON event_salespersons FOR ALL
    USING ((SELECT role FROM app_users WHERE id = auth.uid()) = 'ADMIN');

-- 4. Update existing RLS Policies for the new many-to-many relationship

-- 4.1. Update 'events' SELECT policy
-- Note: Recreating the policy by dropping first
DROP POLICY IF EXISTS "Sales/CallCenter see own events" ON events;
CREATE POLICY "Sales/CallCenter see own events"
    ON events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM event_salespersons 
            WHERE event_id = events.id AND salesperson_id = auth.uid()
        )
        OR
        (SELECT role FROM app_users WHERE id = auth.uid()) = 'ADMIN'
    );

-- 4.2. Update 'event_academies' INSERT policy
DROP POLICY IF EXISTS "CallCenter/Sales link academy" ON event_academies;
CREATE POLICY "CallCenter/Sales link academy"
    ON event_academies FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM event_salespersons 
            WHERE event_id = event_academies.event_id AND salesperson_id = auth.uid()
        )
        OR
        (SELECT role FROM app_users WHERE id = auth.uid()) = 'ADMIN'
    );

-- 4.3. Update 'visits' policies to allow a salesperson to read all visits for events they are assigned to
DROP POLICY IF EXISTS "Sales/CallCenter see own visits" ON visits;
CREATE POLICY "Sales/CallCenter see own visits"
    ON visits FOR SELECT
    USING (
        auth.uid() = salesperson_id
        OR
        EXISTS (
            SELECT 1 FROM event_salespersons 
            WHERE event_id = visits.event_id AND salesperson_id = auth.uid()
        )
        OR
        (SELECT role FROM app_users WHERE id = auth.uid()) = 'ADMIN'
    );

-- Note: We are keeping events.salesperson_id intact for fallback and backward compatibility 
-- for now, but it is considered deprecated. Future migrations can drop it once UI is fully tested.
