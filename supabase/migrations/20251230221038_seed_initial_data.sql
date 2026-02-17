/*
  # Seed Initial Data for Adobo Marietas ERP
  
  ## Overview
  Populates the database with initial sample data for testing and demonstration.
  
  ## Data Included
  
  ### Warehouses
  - Nami Chuy (bodega principal)
  - Local Principal (punto de venta)
  
  ### Product Categories
  - Materias Primas
  - Empaques
  - Productos Terminados
  
  ### Products
  - Materias primas: Chile de árbol, Aceite vegetal, Especias
  - Empaques: Frascos 260g, Frascos 460g, Tapas rojas, Tapas amarillas, Etiquetas
  - Productos terminados: Adobo Marietas 260g, Adobo Marietas 460g
*/

-- Insert Warehouses
INSERT INTO warehouses (id, name, code, address, is_active) VALUES
  (gen_random_uuid(), 'Nami Chuy', 'ALM-001', 'Bodega Principal Nami Chuy', true),
  (gen_random_uuid(), 'Local Principal', 'ALM-002', 'Punto de Venta Principal', true)
ON CONFLICT (code) DO NOTHING;

-- Insert Product Categories
INSERT INTO product_categories (id, name, type) VALUES
  (gen_random_uuid(), 'Materias Primas', 'raw_material'),
  (gen_random_uuid(), 'Empaques', 'packaging'),
  (gen_random_uuid(), 'Productos Terminados', 'finished_product')
ON CONFLICT DO NOTHING;

-- Get category IDs for use in products
DO $$
DECLARE
  cat_raw_material_id uuid;
  cat_packaging_id uuid;
  cat_finished_id uuid;
  warehouse_nami_id uuid;
BEGIN
  -- Get category IDs
  SELECT id INTO cat_raw_material_id FROM product_categories WHERE type = 'raw_material' LIMIT 1;
  SELECT id INTO cat_packaging_id FROM product_categories WHERE type = 'packaging' LIMIT 1;
  SELECT id INTO cat_finished_id FROM product_categories WHERE type = 'finished_product' LIMIT 1;
  SELECT id INTO warehouse_nami_id FROM warehouses WHERE code = 'ALM-001' LIMIT 1;

  -- Insert Raw Materials
  INSERT INTO products (sku, name, description, category_id, unit_of_measure, type, reorder_point, is_active) VALUES
    ('MP-001', 'Chile de Árbol', 'Chile de árbol seco para adobo', cat_raw_material_id, 'kg', 'raw_material', 10, true),
    ('MP-002', 'Aceite Vegetal', 'Aceite vegetal para cocción', cat_raw_material_id, 'l', 'raw_material', 20, true),
    ('MP-003', 'Ajo en Polvo', 'Ajo deshidratado en polvo', cat_raw_material_id, 'kg', 'raw_material', 2, true),
    ('MP-004', 'Comino', 'Comino molido', cat_raw_material_id, 'kg', 'raw_material', 2, true),
    ('MP-005', 'Sal', 'Sal de grano', cat_raw_material_id, 'kg', 'raw_material', 5, true)
  ON CONFLICT (sku) DO NOTHING;

  -- Insert Packaging Materials
  INSERT INTO products (sku, name, description, category_id, unit_of_measure, type, reorder_point, is_active) VALUES
    ('EMP-001', 'Frasco 260g', 'Frasco de vidrio 260 gramos', cat_packaging_id, 'unit', 'packaging', 500, true),
    ('EMP-002', 'Frasco 460g', 'Frasco de vidrio 460 gramos', cat_packaging_id, 'unit', 'packaging', 300, true),
    ('EMP-003', 'Tapa Roja', 'Tapa metálica color roja', cat_packaging_id, 'unit', 'packaging', 500, true),
    ('EMP-004', 'Tapa Amarilla', 'Tapa metálica color amarilla', cat_packaging_id, 'unit', 'packaging', 300, true),
    ('EMP-005', 'Etiqueta 260g', 'Etiqueta adhesiva para frasco 260g', cat_packaging_id, 'unit', 'packaging', 500, true),
    ('EMP-006', 'Etiqueta 460g', 'Etiqueta adhesiva para frasco 460g', cat_packaging_id, 'unit', 'packaging', 300, true)
  ON CONFLICT (sku) DO NOTHING;

  -- Insert Finished Products
  INSERT INTO products (sku, name, description, category_id, unit_of_measure, type, reorder_point, is_active) VALUES
    ('PT-001', 'Adobo Marietas 260g', 'Adobo artesanal presentación 260 gramos', cat_finished_id, 'unit', 'finished_product', 50, true),
    ('PT-002', 'Adobo Marietas 460g', 'Adobo artesanal presentación 460 gramos', cat_finished_id, 'unit', 'finished_product', 30, true)
  ON CONFLICT (sku) DO NOTHING;

  -- Insert initial inventory for raw materials at Nami Chuy warehouse
  INSERT INTO inventory_stock (warehouse_id, product_id, quantity)
  SELECT 
    warehouse_nami_id,
    p.id,
    CASE 
      WHEN p.sku = 'MP-001' THEN 50
      WHEN p.sku = 'MP-002' THEN 100
      WHEN p.sku = 'MP-003' THEN 10
      WHEN p.sku = 'MP-004' THEN 8
      WHEN p.sku = 'MP-005' THEN 25
      WHEN p.sku = 'EMP-001' THEN 1000
      WHEN p.sku = 'EMP-002' THEN 500
      WHEN p.sku = 'EMP-003' THEN 1000
      WHEN p.sku = 'EMP-004' THEN 500
      WHEN p.sku = 'EMP-005' THEN 1000
      WHEN p.sku = 'EMP-006' THEN 500
      ELSE 0
    END as quantity
  FROM products p
  WHERE p.type IN ('raw_material', 'packaging')
  ON CONFLICT (warehouse_id, product_id, lot_id) DO NOTHING;

END $$;