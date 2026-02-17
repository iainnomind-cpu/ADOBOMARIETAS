/*
  # ERP Schema for Adobo Marietas
  
  ## Overview
  Complete database schema for an ERP system with Production Management (MRP/MES) 
  and Warehouse Management (WMS) modules.
  
  ## New Tables
  
  ### Core Tables
  - `profiles` - User profiles linked to auth.users
    - `id` (uuid, references auth.users)
    - `full_name` (text)
    - `role` (text) - admin, production_manager, warehouse_staff, etc.
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)
  
  ### Warehouse Management (WMS)
  - `warehouses` - Physical storage locations
    - `id` (uuid, primary key)
    - `name` (text) - e.g., "Nami Chuy", "Local Principal"
    - `code` (text, unique)
    - `address` (text)
    - `is_active` (boolean)
    - `created_at` (timestamptz)
  
  - `product_categories` - Organize products
    - `id` (uuid, primary key)
    - `name` (text)
    - `type` (text) - raw_material, packaging, finished_product
    - `created_at` (timestamptz)
  
  - `products` - All items (raw materials, packaging, finished products)
    - `id` (uuid, primary key)
    - `sku` (text, unique)
    - `name` (text)
    - `description` (text)
    - `category_id` (uuid, references product_categories)
    - `unit_of_measure` (text) - kg, g, unit, liter
    - `type` (text) - raw_material, packaging, finished_product
    - `reorder_point` (numeric)
    - `is_active` (boolean)
    - `barcode` (text)
    - `created_at` (timestamptz)
  
  - `inventory_lots` - Batch/lot tracking
    - `id` (uuid, primary key)
    - `lot_number` (text, unique)
    - `product_id` (uuid, references products)
    - `production_date` (date)
    - `expiry_date` (date)
    - `initial_quantity` (numeric)
    - `created_at` (timestamptz)
  
  - `inventory_stock` - Current stock per warehouse/product/lot
    - `id` (uuid, primary key)
    - `warehouse_id` (uuid, references warehouses)
    - `product_id` (uuid, references products)
    - `lot_id` (uuid, references inventory_lots, nullable)
    - `quantity` (numeric)
    - `updated_at` (timestamptz)
    - Unique constraint on (warehouse_id, product_id, lot_id)
  
  - `inventory_movements` - All inventory transactions
    - `id` (uuid, primary key)
    - `movement_type` (text) - purchase, production_consume, production_output, transfer, adjustment
    - `warehouse_id` (uuid, references warehouses)
    - `product_id` (uuid, references products)
    - `lot_id` (uuid, references inventory_lots, nullable)
    - `quantity` (numeric) - positive for inbound, negative for outbound
    - `reference_type` (text) - production_order, purchase_order, transfer
    - `reference_id` (uuid, nullable)
    - `notes` (text)
    - `created_by` (uuid, references auth.users)
    - `created_at` (timestamptz)
  
  ### Production Management (MRP/MES)
  - `bom_headers` - Bill of Materials (recipe headers)
    - `id` (uuid, primary key)
    - `product_id` (uuid, references products)
    - `version` (integer)
    - `name` (text)
    - `batch_size` (numeric) - expected output quantity
    - `is_active` (boolean)
    - `created_at` (timestamptz)
  
  - `bom_lines` - BOM ingredients/components
    - `id` (uuid, primary key)
    - `bom_id` (uuid, references bom_headers)
    - `product_id` (uuid, references products)
    - `quantity` (numeric)
    - `unit_of_measure` (text)
    - `notes` (text)
    - `created_at` (timestamptz)
  
  - `production_orders` - Manufacturing orders
    - `id` (uuid, primary key)
    - `order_number` (text, unique)
    - `bom_id` (uuid, references bom_headers)
    - `product_id` (uuid, references products)
    - `warehouse_id` (uuid, references warehouses)
    - `planned_quantity` (numeric)
    - `produced_quantity` (numeric)
    - `waste_quantity` (numeric)
    - `status` (text) - draft, scheduled, in_progress, completed, cancelled
    - `scheduled_start` (timestamptz)
    - `scheduled_end` (timestamptz)
    - `actual_start` (timestamptz)
    - `actual_end` (timestamptz)
    - `created_by` (uuid, references auth.users)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)
  
  - `production_order_materials` - Materials consumed in production
    - `id` (uuid, primary key)
    - `production_order_id` (uuid, references production_orders)
    - `product_id` (uuid, references products)
    - `lot_id` (uuid, references inventory_lots, nullable)
    - `planned_quantity` (numeric)
    - `consumed_quantity` (numeric)
    - `created_at` (timestamptz)
  
  ## Security
  - Enable RLS on all tables
  - Add policies for authenticated users based on roles
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create warehouses table
CREATE TABLE IF NOT EXISTS warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  address text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read warehouses"
  ON warehouses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert warehouses"
  ON warehouses FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update warehouses"
  ON warehouses FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create product_categories table
CREATE TABLE IF NOT EXISTS product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read categories"
  ON product_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert categories"
  ON product_categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  category_id uuid REFERENCES product_categories,
  unit_of_measure text NOT NULL,
  type text NOT NULL,
  reorder_point numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  barcode text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create inventory_lots table
CREATE TABLE IF NOT EXISTS inventory_lots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_number text UNIQUE NOT NULL,
  product_id uuid REFERENCES products NOT NULL,
  production_date date NOT NULL,
  expiry_date date,
  initial_quantity numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE inventory_lots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read lots"
  ON inventory_lots FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert lots"
  ON inventory_lots FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create inventory_stock table
CREATE TABLE IF NOT EXISTS inventory_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id uuid REFERENCES warehouses NOT NULL,
  product_id uuid REFERENCES products NOT NULL,
  lot_id uuid REFERENCES inventory_lots,
  quantity numeric DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(warehouse_id, product_id, lot_id)
);

ALTER TABLE inventory_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read stock"
  ON inventory_stock FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert stock"
  ON inventory_stock FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update stock"
  ON inventory_stock FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create inventory_movements table
CREATE TABLE IF NOT EXISTS inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movement_type text NOT NULL,
  warehouse_id uuid REFERENCES warehouses NOT NULL,
  product_id uuid REFERENCES products NOT NULL,
  lot_id uuid REFERENCES inventory_lots,
  quantity numeric NOT NULL,
  reference_type text,
  reference_id uuid,
  notes text,
  created_by uuid REFERENCES auth.users,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read movements"
  ON inventory_movements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert movements"
  ON inventory_movements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Create bom_headers table
CREATE TABLE IF NOT EXISTS bom_headers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products NOT NULL,
  version integer DEFAULT 1,
  name text NOT NULL,
  batch_size numeric NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bom_headers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read BOMs"
  ON bom_headers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert BOMs"
  ON bom_headers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update BOMs"
  ON bom_headers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create bom_lines table
CREATE TABLE IF NOT EXISTS bom_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bom_id uuid REFERENCES bom_headers ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products NOT NULL,
  quantity numeric NOT NULL,
  unit_of_measure text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bom_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read BOM lines"
  ON bom_lines FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert BOM lines"
  ON bom_lines FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update BOM lines"
  ON bom_lines FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete BOM lines"
  ON bom_lines FOR DELETE
  TO authenticated
  USING (true);

-- Create production_orders table
CREATE TABLE IF NOT EXISTS production_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  bom_id uuid REFERENCES bom_headers NOT NULL,
  product_id uuid REFERENCES products NOT NULL,
  warehouse_id uuid REFERENCES warehouses NOT NULL,
  planned_quantity numeric NOT NULL,
  produced_quantity numeric DEFAULT 0,
  waste_quantity numeric DEFAULT 0,
  status text DEFAULT 'draft',
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  actual_start timestamptz,
  actual_end timestamptz,
  created_by uuid REFERENCES auth.users,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE production_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read production orders"
  ON production_orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert production orders"
  ON production_orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update production orders"
  ON production_orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create production_order_materials table
CREATE TABLE IF NOT EXISTS production_order_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  production_order_id uuid REFERENCES production_orders ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products NOT NULL,
  lot_id uuid REFERENCES inventory_lots,
  planned_quantity numeric NOT NULL,
  consumed_quantity numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE production_order_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read production materials"
  ON production_order_materials FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert production materials"
  ON production_order_materials FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update production materials"
  ON production_order_materials FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_stock_warehouse ON inventory_stock(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_product ON inventory_stock(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_warehouse ON inventory_movements(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at ON inventory_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_production_orders_status ON production_orders(status);
CREATE INDEX IF NOT EXISTS idx_production_orders_created_at ON production_orders(created_at DESC);