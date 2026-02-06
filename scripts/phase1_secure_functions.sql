-- Phase 1: Secure RPC Functions
-- This script creates "tunnel" functions to access data securely without exposing the whole table.

-- 1. Get My Profile (Safe Profile Read)
-- Returns only safe fields for the user. 
-- Since we are in "Custom Auth" mode without RLS identifying the user yet, 
-- we will require the ID to be passed, BUT we will filter the output columns.
-- In Phase 2 (Server-side Auth), we will remove the p_user_id param and use auth.uid()
CREATE OR REPLACE FUNCTION get_profile(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    email TEXT,
    role TEXT,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT au.id, au.name, au.email, au.role, au.status
    FROM app_users au
    WHERE au.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. List Salespersons (For Dropdowns)
-- Returns only ID and Name of ACTIVE salespersons.
-- No emails, no hashes, no role info needed here.
CREATE OR REPLACE FUNCTION list_salespersons()
RETURNS TABLE (
    id UUID,
    name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT au.id, au.name
    FROM app_users au
    WHERE au.role = 'SALES' AND au.status = 'ACTIVE';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. List Admins (For Internal logic)
CREATE OR REPLACE FUNCTION list_admins()
RETURNS TABLE (
    id UUID,
    name TEXT,
    email TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT au.id, au.name, au.email
    FROM app_users au
    WHERE au.role = 'ADMIN' AND au.status = 'ACTIVE';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Grant Access to Anon (Public for now, until we fully switch)
GRANT EXECUTE ON FUNCTION get_profile(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION list_salespersons() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION list_admins() TO anon, authenticated, service_role;
