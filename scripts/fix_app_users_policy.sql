
-- Enable RLS
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own data
CREATE POLICY "Users can view their own profile" 
ON app_users FOR SELECT 
USING (auth.uid() = id);

-- Allow users to update their own data
CREATE POLICY "Users can update their own profile" 
ON app_users FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow Salespersons to be viewed by Admins (optional, for management)
CREATE POLICY "Admins can view all profiles" 
ON app_users FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM app_users 
    WHERE id = auth.uid() AND role = 'ADMIN'
  )
);

-- Grant permissions
GRANT ALL ON app_users TO authenticated;
GRANT ALL ON app_users TO service_role;
