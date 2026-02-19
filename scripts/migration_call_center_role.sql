-- Migration: Add CALL_CENTER role support

-- 1. Update app_allowlist constraint
ALTER TABLE app_allowlist DROP CONSTRAINT IF EXISTS app_allowlist_role_check;
ALTER TABLE app_allowlist ADD CONSTRAINT app_allowlist_role_check 
    CHECK (role IN ('ADMIN', 'SALES', 'CALL_CENTER'));

-- 2. Update app_users constraint
ALTER TABLE app_users DROP CONSTRAINT IF EXISTS app_users_role_check;
ALTER TABLE app_users ADD CONSTRAINT app_users_role_check 
    CHECK (role IN ('ADMIN', 'SALES', 'CALL_CENTER'));

-- 3. Update Policy for Notifications (ensure compatibility)
-- Checks if any other constraint needs update.
-- The existing policies often check auth.uid() = user_id, which is generic.
-- We might need to check if there are any specific RLS policies that hardcode 'SALES' or 'ADMIN'.

-- 4. Comment to document changes
COMMENT ON COLUMN app_users.role IS 'User role: ADMIN, SALES, or CALL_CENTER';
