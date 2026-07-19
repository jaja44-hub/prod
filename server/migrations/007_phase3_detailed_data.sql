-- Phase 3: Detailed Warehouse Receipt Items and Inventory Transactions
BEGIN;

-- Warehouse Receipt Items
INSERT INTO warehouse_receipt_items (id, receipt_id, line_number, po_item_id, product_id, product_name, category_id, quantity_received, quantity_accepted, quantity_rejected, unit_of_measure, unit_cost, inspection_notes) VALUES
(60001, 50001, 1, 40001, 1001, 'High-Yield Teff Seed (50kg)', 2001, 10.00, 10.00, 0.00, 'BAG', 4500.00, 'Quality verified'),
(60002, 50001, 2, 40002, 1002, 'Organic Fertilizer Compound (25kg)', 2001, 10.00, 10.00, 0.00, 'BAG', 2100.00, 'Quality verified'),
(60003, 50002, 1, 40003, 1003, 'Premium Processed Beef Quarters', 2010, 50.00, 50.00, 0.00, 'KG', 650.00, 'Cold chain maintained'),
(60004, 50002, 2, 40004, 1004, 'Refined Sunflower Oil (5L)', 2010, 3.00, 3.00, 0.00, 'BOTTLE', 850.00, 'Quality verified'),
(60005, 50003, 1, 40005, 1006, 'Reinforced Deformed Steel Bar (12mm)', 2041, 10.00, 10.00, 0.00, 'TON', 78000.00, 'Emergency inspection passed'),
(60006, 50003, 2, 40006, 1005, 'Portland Cement OPC (Grade 42.5N)', 2041, 70.00, 70.00, 0.00, 'BAG', 950.00, 'Quality verified'),
(60007, 50004, 1, 40008, 1001, 'High-Yield Teff Seed (50kg)', 2001, 10.00, 8.50, 1.50, 'BAG', 4500.00, '15% rejected - moisture'),
(60008, 50004, 2, 40009, 1002, 'Organic Fertilizer Compound (25kg)', 2001, 10.00, 8.50, 1.50, 'BAG', 2100.00, '15% rejected - damage');

-- Inventory Transactions
INSERT INTO inventory_transactions (id, tenant_id, product_id, transaction_type, quantity, unit_cost, location_id, reference_type, reference_id, transaction_date) VALUES
(70001, 'tenant_default', 1001, 'RECEIPT', 10.00, 4500.00, 'WH-001', 'warehouse_receipt', 50001, '2026-03-01'),
(70002, 'tenant_default', 1002, 'RECEIPT', 10.00, 2100.00, 'WH-001', 'warehouse_receipt', 50001, '2026-03-01'),
(70003, 'tenant_default', 1003, 'RECEIPT', 50.00, 650.00, 'WH-003', 'warehouse_receipt', 50002, '2026-03-05'),
(70004, 'tenant_default', 1004, 'RECEIPT', 3.00, 850.00, 'WH-003', 'warehouse_receipt', 50002, '2026-03-05'),
(70005, 'tenant_default', 1006, 'RECEIPT', 10.00, 78000.00, 'WH-004', 'warehouse_receipt', 50003, '2026-02-11'),
(70006, 'tenant_default', 1005, 'RECEIPT', 70.00, 950.00, 'WH-004', 'warehouse_receipt', 50003, '2026-02-11'),
(70007, 'tenant_default', 1001, 'RECEIPT', 8.50, 4500.00, 'WH-001', 'warehouse_receipt', 50004, '2026-03-02'),
(70008, 'tenant_default', 1002, 'RECEIPT', 8.50, 2100.00, 'WH-001', 'warehouse_receipt', 50004, '2026-03-02');

COMMIT;
