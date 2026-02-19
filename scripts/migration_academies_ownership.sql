-- Migration: Academy Ownership & Soft Delete
-- This script adds tracking for who created an academy and its status (ACTIVE/INACTIVE).
-- It also enforces strict RLS policies:
-- 1. Call Center can only UPDATE (inactive) or DELETE (if implementation allows) their own academies.
-- 2. Call Center cannot modify academies created by others.
-- 3. Admin has full control.

-- 1. Add Columns
ALTER TABLE academies 
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES app_users(id),
ADD COLUMN IF NOT EXISTS status text DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE'));

-- 2. Populate existing data (Optional: set defaults)
-- If we don't know who created it, we can leave it NULL or assign to an Admin.
-- For now, let's leave NULL but ensure future inserts have it.
-- BUT, RLS policies below rely on it. Let's try to set it to the first Admin found if NULL.
DO $$
DECLARE
    admin_id uuid;
BEGIN
    SELECT id INTO admin_id FROM app_users WHERE role = 'ADMIN' LIMIT 1;
    IF admin_id IS NOT NULL THEN
        UPDATE academies SET created_by = admin_id WHERE created_by IS NULL;
    END IF;
END $$;

-- 3. Trigger to auto-set created_by on INSERT
CREATE OR REPLACE FUNCTION set_created_by()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.created_by IS NULL THEN
        NEW.created_by := auth.uid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_academy_owner ON academies;
CREATE TRIGGER trigger_set_academy_owner
BEFORE INSERT ON academies
FOR EACH ROW EXECUTE FUNCTION set_created_by();

-- 4. RLS POLICIES
ALTER TABLE academies ENABLE ROW LEVEL SECURITY;

-- SELECT: Everyone can see ALL academies (to avoid duplicates)
DROP POLICY IF EXISTS "Everyone can see academies" ON academies;
CREATE POLICY "Everyone can see academies"
    ON academies FOR SELECT
    USING (true);

-- INSERT: Authenticated users can create
DROP POLICY IF EXISTS "Authenticated create academy" ON academies;
CREATE POLICY "Authenticated create academy"
    ON academies FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- UPDATE:
-- Admin: All
-- Owner: Own (regardless of role, but usually Call Center)
DROP POLICY IF EXISTS "Owners and Admins update academies" ON academies;
CREATE POLICY "Owners and Admins update academies"
    ON academies FOR UPDATE
    USING (
        created_by = auth.uid() 
        OR 
        (SELECT role FROM app_users WHERE id = auth.uid()) = 'ADMIN'
    );

-- DELETE:
-- Only ADMIN can hard delete.
-- Call Center should use UPDATE status='INACTIVE' (Soft Delete) via the UPDATE policy above.
DROP POLICY IF EXISTS "Only Admin deletes academies" ON academies;
CREATE POLICY "Only Admin deletes academies"
    ON academies FOR DELETE
    USING (
        (SELECT role FROM app_users WHERE id = auth.uid()) = 'ADMIN'
    );
