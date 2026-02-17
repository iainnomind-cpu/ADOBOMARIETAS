/*
  # Automation Triggers
  
  ## Goals
  1. Auto-deduct inventory when Sales Order is confirmed.
  2. Auto-create Accounts Receivable when Sales Order is invoiced (or confirmed depending on flow).

  ## Trigger 1: on_order_status_change
  - Watches `sales_orders` table for updates to `status`.
  
  ### Logic for 'confirmed' status:
  - Loop through `sales_order_lines`.
  - Update `inventory_stock` for the warehouse and product.
  - Log `inventory_movements`.

  ### Logic for 'invoiced' status:
  - Check if AR record exists.
  - Insert into `accounts_receivable`.
*/

-- Function to handle order status changes
CREATE OR REPLACE FUNCTION handle_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
  order_line RECORD;
  ar_exists BOOLEAN;
BEGIN
  -- Logic when order is CONFIRMED (Reserve Inventory)
  IF OLD.status != 'confirmed' AND NEW.status = 'confirmed' THEN
    
    -- Iterate through order lines
    FOR order_line IN 
      SELECT * FROM sales_order_lines WHERE sales_order_id = NEW.id
    LOOP
      -- 1. Update Inventory Stock (Simple deduction logic)
      -- Check if stock record exists
      IF EXISTS (
        SELECT 1 FROM inventory_stock 
        WHERE warehouse_id = NEW.warehouse_id AND product_id = order_line.product_id
      ) THEN
        UPDATE inventory_stock
        SET quantity = quantity - order_line.quantity,
            updated_at = now()
        WHERE warehouse_id = NEW.warehouse_id AND product_id = order_line.product_id;
      ELSE
        -- Insert negative stock if allowed (or zero base)
        INSERT INTO inventory_stock (warehouse_id, product_id, quantity)
        VALUES (NEW.warehouse_id, order_line.product_id, -order_line.quantity);
      END IF;

      -- 2. Log Movement
      INSERT INTO inventory_movements (
        movement_type,
        warehouse_id,
        product_id,
        quantity,
        reference_type,
        reference_id,
        notes,
        created_by
      ) VALUES (
        'sales_order',
        NEW.warehouse_id,
        order_line.product_id,
        -order_line.quantity, -- Negative for outbound
        'sales_order',
        NEW.id,
        'Auto-deduction from Order Confirmation',
        NEW.created_by
      );
    END LOOP;
  END IF;

  -- Logic for Accounts Receivable (Invoice Generation)
  -- Triggered on 'invoiced' OR 'confirmed' depending on business rule. 
  -- Let's assume 'confirmed' also creates a pending AR invoice for now, or strictly 'invoiced'.
  IF (OLD.status != 'invoiced' AND NEW.status = 'invoiced') OR
     (OLD.status != 'confirmed' AND NEW.status = 'confirmed') THEN

     -- Check if AR already exists to avoid duplicates
     SELECT EXISTS(SELECT 1 FROM accounts_receivable WHERE sales_order_id = NEW.id) INTO ar_exists;
     
     IF NOT ar_exists THEN
       INSERT INTO accounts_receivable (
         sales_order_id,
         client_id,
         document_number,
         issue_date,
         due_date,
         total_amount,
         remaining_balance,
         status
       ) VALUES (
         NEW.id,
         NEW.client_id,
         'INV-' || substring(NEW.order_number from 5), -- Generate simple invoice number
         CURRENT_DATE,
         CURRENT_DATE + 30, -- Default 30 days term (should come from client terms)
         NEW.total_amount,
         NEW.total_amount,
         'pending'
       );
     END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS on_order_status_change ON sales_orders;
CREATE TRIGGER on_order_status_change
  AFTER UPDATE OF status ON sales_orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_order_status_change();
