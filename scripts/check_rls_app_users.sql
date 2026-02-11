
-- Check RLS policies for app_users
SELECT * FROM pg_policies WHERE tablename = 'app_users';

-- Check if RLS is enabled on the table
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class
WHERE relname = 'app_users';
