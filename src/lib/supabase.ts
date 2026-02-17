import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Profile {
  id: string;
  full_name: string;
  role: string;
  client_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  type: string;
  created_at: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category_id: string | null;
  unit_of_measure: string;
  type: string;
  reorder_point: number;
  is_active: boolean;
  barcode: string | null;
  sales_price: number;
  current_stock: number;
  created_at: string;
}

export interface BOMHeader {
  id: string;
  product_id: string;
  version: number;
  name: string;
  batch_size: number;
  is_active: boolean;
  created_at: string;
}

export interface BOMLine {
  id: string;
  bom_id: string;
  product_id: string;
  quantity: number;
  unit_of_measure: string;
  notes: string | null;
  created_at: string;
}

export interface ProductionOrder {
  id: string;
  order_number: string;
  bom_id: string;
  product_id: string;
  warehouse_id: string;
  planned_quantity: number;
  produced_quantity: number;
  waste_quantity: number;
  status: string;
  scheduled_start: string | null;
  scheduled_end: string | null;
  actual_start: string | null;
  actual_end: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryStock {
  id: string;
  warehouse_id: string;
  product_id: string;
  lot_id: string | null;
  quantity: number;
  updated_at: string;
}

export interface InventoryLot {
  id: string;
  lot_number: string;
  product_id: string;
  production_date: string;
  expiry_date: string | null;
  initial_quantity: number;
  created_at: string;
}

export interface InventoryMovement {
  id: string;
  movement_type: string;
  warehouse_id: string;
  product_id: string;
  lot_id: string | null;
  quantity: number;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
}

// CRM Interfaces
export interface Client {
  id: string;
  name: string;
  commercial_name?: string;
  rfc?: string;
  email?: string;
  phone?: string;
  client_type: 'wholesale' | 'retail' | 'distributor';
  credit_limit: number;
  current_balance: number;
  payment_term_days: number;
  is_active: boolean;
  created_at: string;
}

export interface ClientAddress {
  id: string;
  client_id: string;
  address_line1: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  is_default: boolean;
}

// Sales Interfaces
export interface SalesRoute {
  id: string;
  name: string;
  code?: string;
  assigned_vehicle?: string;
  assigned_driver_id?: string;
  is_active: boolean;
}

export interface SalesOrder {
  id: string;
  order_number: string;
  client_id: string;
  sales_route_id?: string;
  warehouse_id?: string;
  status: 'draft' | 'confirmed' | 'shipped' | 'delivered' | 'invoiced' | 'cancelled';
  order_date: string;
  delivery_date?: string;
  total_amount: number;
  tax_amount: number;
  discount_amount: number;
  currency: string;
  payment_method?: string;
  notes?: string;
  created_by: string;
  client?: Client;
  sales_route?: SalesRoute;
}

export interface SalesOrderLine {
  id: string;
  sales_order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  tax_rate: number;
  discount_rate: number;
}

// Finance Interfaces
export interface CostCenter {
  id: string;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
}

export interface AccountsReceivable {
  id: string;
  sales_order_id?: string;
  client_id: string;
  document_number: string;
  issue_date: string;
  due_date: string;
  total_amount: number;
  remaining_balance: number;
  status: 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  client?: Client;
}

export interface FinancialTransaction {
  id: string;
  transaction_date: string;
  type: 'income' | 'expense' | 'transfer';
  category?: string;
  amount: number;
  reference_type?: string;
  reference_id?: string;
  description?: string;
  created_by?: string;
}

