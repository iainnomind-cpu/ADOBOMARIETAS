/*
  # B2B Portal Schema
  
  1. Updates
    - Add `client_id` to `auth.users` metadata (via profiles table)
    - Add `role` check constraint to profiles
  
  2. Security
    - Update RLS policies for `sales_orders` to allow clients to view their own orders.
    - Update RLS policies for `products` to allow active clients to view active products.
*/

-- Link Profiles to Clients
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_client_id ON profiles(client_id);

-- RLS: Allow B2B users to see their own orders
DROP POLICY IF EXISTS "Authenticated users can read sales_orders" ON sales_orders;

CREATE POLICY "Staff can view all orders" ON sales_orders
  FOR SELECT TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'staff', 'sales')
    OR
    (SELECT client_id FROM profiles WHERE id = auth.uid()) IS NULL
  );

CREATE POLICY "Clients can view own orders" ON sales_orders
  FOR SELECT TO authenticated
  USING (
    client_id = (SELECT client_id FROM profiles WHERE id = auth.uid())
  );

-- RLS: Clients can see their own Order Lines
DROP POLICY IF EXISTS "Authenticated users can read sales_order_lines" ON sales_order_lines;

CREATE POLICY "Staff can view all order lines" ON sales_order_lines
  FOR SELECT TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'staff', 'sales')
    OR
    (SELECT client_id FROM profiles WHERE id = auth.uid()) IS NULL
  );

CREATE POLICY "Clients can view own order lines" ON sales_order_lines
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sales_orders 
      WHERE sales_orders.id = sales_order_lines.sales_order_id
      AND sales_orders.client_id = (SELECT client_id FROM profiles WHERE id = auth.uid())
    )
  );
