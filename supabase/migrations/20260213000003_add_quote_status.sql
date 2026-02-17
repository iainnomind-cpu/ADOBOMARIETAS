-- Add 'quote' to sales_orders status check constraint
ALTER TABLE sales_orders DROP CONSTRAINT IF EXISTS sales_orders_status_check;
ALTER TABLE sales_orders ADD CONSTRAINT sales_orders_status_check 
  CHECK (status IN ('quote', 'draft', 'confirmed', 'shipped', 'delivered', 'invoiced', 'cancelled'));
