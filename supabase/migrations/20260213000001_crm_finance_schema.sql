/*
  # CRM & Finance Schema
  
  ## CRM Module
  - clients (RFC, type, credit_limit)
  - client_addresses (delivery locations)
  - sales_routes (driver/seller assignment)
  - sales_orders (headers)
  - sales_order_lines (items)
  
  ## Finance Module
  - cost_centers (profitability tracking)
  - accounts_receivable (generated from sales)
  - financial_transactions (ledger)
*/

-- CRM: Clients
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  commercial_name text,
  rfc text,
  email text,
  phone text,
  client_type text CHECK (client_type IN ('wholesale', 'retail', 'distributor')),
  price_list_id uuid, -- Link to specific price lists (future)
  credit_limit numeric DEFAULT 0,
  current_balance numeric DEFAULT 0,
  payment_term_days integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read clients" ON clients
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert clients" ON clients
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update clients" ON clients
  FOR UPDATE TO authenticated USING (true);

-- CRM: Client Addresses
CREATE TABLE IF NOT EXISTS client_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  address_line1 text NOT NULL,
  address_line2 text,
  city text,
  state text,
  zip_code text,
  is_default boolean DEFAULT false,
  coordinates point, -- For map view
  created_at timestamptz DEFAULT now()
);

ALTER TABLE client_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read client_addresses" ON client_addresses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert client_addresses" ON client_addresses
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update client_addresses" ON client_addresses
  FOR UPDATE TO authenticated USING (true);

-- Sales: Routes
CREATE TABLE IF NOT EXISTS sales_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE,
  assigned_vehicle text,
  assigned_driver_id uuid REFERENCES auth.users,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sales_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read sales_routes" ON sales_routes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert sales_routes" ON sales_routes
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update sales_routes" ON sales_routes
  FOR UPDATE TO authenticated USING (true);

-- Sales: Orders
CREATE TABLE IF NOT EXISTS sales_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL, -- Auto-generated e.g., PED-1001
  client_id uuid REFERENCES clients(id) NOT NULL,
  sales_route_id uuid REFERENCES sales_routes(id),
  warehouse_id uuid REFERENCES warehouses(id), -- Source of inventory
  status text CHECK (status IN ('draft', 'confirmed', 'shipped', 'delivered', 'invoiced', 'cancelled')) DEFAULT 'draft',
  order_date timestamptz DEFAULT now(),
  delivery_date date,
  total_amount numeric DEFAULT 0,
  tax_amount numeric DEFAULT 0,
  discount_amount numeric DEFAULT 0,
  currency text DEFAULT 'MXN',
  payment_method text,
  notes text,
  created_by uuid REFERENCES auth.users,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read sales_orders" ON sales_orders
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert sales_orders" ON sales_orders
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update sales_orders" ON sales_orders
  FOR UPDATE TO authenticated USING (true);

-- Sales: Order Lines
CREATE TABLE IF NOT EXISTS sales_order_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id uuid REFERENCES sales_orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) NOT NULL,
  quantity numeric NOT NULL,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  tax_rate numeric DEFAULT 0.16,
  discount_rate numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sales_order_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read sales_order_lines" ON sales_order_lines
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert sales_order_lines" ON sales_order_lines
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update sales_order_lines" ON sales_order_lines
  FOR UPDATE TO authenticated USING (true);

-- Finance: Cost Centers
CREATE TABLE IF NOT EXISTS cost_centers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cost_centers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read cost_centers" ON cost_centers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert cost_centers" ON cost_centers
  FOR INSERT TO authenticated WITH CHECK (true);

-- Finance: Accounts Receivable
CREATE TABLE IF NOT EXISTS accounts_receivable (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id uuid REFERENCES sales_orders(id),
  client_id uuid REFERENCES clients(id) NOT NULL,
  document_number text NOT NULL, -- Invoice number
  issue_date date NOT NULL,
  due_date date NOT NULL,
  total_amount numeric NOT NULL,
  remaining_balance numeric NOT NULL,
  status text CHECK (status IN ('pending', 'partial', 'paid', 'overdue', 'cancelled')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE accounts_receivable ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read accounts_receivable" ON accounts_receivable
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert accounts_receivable" ON accounts_receivable
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update accounts_receivable" ON accounts_receivable
  FOR UPDATE TO authenticated USING (true);

-- Finance: Transactions (Ledger)
CREATE TABLE IF NOT EXISTS financial_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_date timestamptz DEFAULT now(),
  type text CHECK (type IN ('income', 'expense', 'transfer')),
  category text, -- e.g., 'Sales', 'Cost of Goods Sold', 'OpEx'
  amount numeric NOT NULL,
  reference_type text, -- 'sales_order', 'purchase_order', 'production_order'
  reference_id uuid,
  description text,
  created_by uuid REFERENCES auth.users,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read financial_transactions" ON financial_transactions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert financial_transactions" ON financial_transactions
  FOR INSERT TO authenticated WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sales_orders_client ON sales_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON sales_orders(status);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_client ON accounts_receivable(client_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON financial_transactions(transaction_date);
