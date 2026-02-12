-- Create vendor_details table
CREATE TABLE IF NOT EXISTS vendor_details (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  admission_date DATE,
  pix_key TEXT,
  bank_name TEXT,
  bank_agency TEXT,
  bank_account TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE vendor_details ENABLE ROW LEVEL SECURITY;

-- Policies
-- Admins can do everything
DROP POLICY IF EXISTS "Admins can do everything on vendor_details" ON vendor_details;
CREATE POLICY "Admins can do everything on vendor_details"
  ON vendor_details
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Salespeople can view their own details
DROP POLICY IF EXISTS "Salespeople can view own details" ON vendor_details;
CREATE POLICY "Salespeople can view own details"
  ON vendor_details
  FOR SELECT
  USING (auth.uid() = user_id);

-- Salespeople can update their own details
DROP POLICY IF EXISTS "Salespeople can update own details" ON vendor_details;
CREATE POLICY "Salespeople can update own details"
  ON vendor_details
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Salespeople can insert their own details
DROP POLICY IF EXISTS "Salespeople can insert own details" ON vendor_details;
CREATE POLICY "Salespeople can insert own details"
  ON vendor_details
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Grant access to authenticated users
GRANT ALL ON vendor_details TO authenticated;
GRANT ALL ON vendor_details TO service_role;
