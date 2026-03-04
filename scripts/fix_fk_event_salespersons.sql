-- Fix Foreign Key Constraint for event_salespersons
-- The frontend populates users from public.app_users, so the FK must point there.
-- If a user is deleted from Auth but remains in app_users, the FK to auth.users fails.

-- 1. Drop the existing foreign key constraint that points to auth.users
ALTER TABLE event_salespersons
DROP CONSTRAINT IF EXISTS event_salespersons_salesperson_id_fkey;

-- 2. Add the correct foreign key constraint pointing to public.app_users
ALTER TABLE event_salespersons
ADD CONSTRAINT event_salespersons_salesperson_id_fkey
FOREIGN KEY (salesperson_id)
REFERENCES public.app_users(id)
ON DELETE CASCADE;

-- 3. Verify success (Optional)
-- You can now safely assign any user that appears in your frontend list.
