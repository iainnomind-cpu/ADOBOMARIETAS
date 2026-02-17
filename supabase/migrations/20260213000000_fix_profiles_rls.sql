-- Fix RLS policies for profiles table to allow user registration
-- This allows authenticated users to insert their OWN profile row.

-- Drop existing policies if they conflict (optional, but safer to be specific)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create the new policy
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Ensure the existing update policy is correct
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
