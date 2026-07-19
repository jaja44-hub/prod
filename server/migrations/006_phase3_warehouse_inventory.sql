-- Phase 3: Warehouse & Inventory Module
BEGIN;

-- Inventory Transactions Table
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  product_id INTEGER REFERENCES products(id),
  transaction_type VARCHAR(20) NOT NULL,
  quantity DECIMAL(18,2) NOT NULL,
  unit_cost DECIMAL(18,2),
  location_id VARCHAR(50),
  reference_type VARCHAR(50),
  reference_id INTEGER,
  transaction_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Warehouse Locations
CREATE TABLE IF NOT EXISTS warehouse_locations (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  location_code VARCHAR(50) NOT NULL UNIQUE,
  location_name VARCHAR(255) NOT NULL,
  location_type VARCHAR(50) NOT NULL,
  address TEXT,
  capacity DECIMAL(18,2),
  manager_id VARCHAR(255),
  manager_name VARCHAR(255),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO warehouse_locations (id, tenant_id, location_code, location_name, location_type, address, capacity, manager_id, manager_name) VALUES
(1, 'tenant_default', 'WH-001', 'Main Warehouse - Addis', 'MAIN', 'Bole Subcity', 500000.00, 'USR-025', 'Dawit Haile'),
(2, 'tenant_default', 'WH-002', 'Regional Warehouse - Hawassa', 'REGIONAL', 'Hawassa Industrial Zone', 250000.00, 'USR-026', 'Sara Mengistu'),
(3, 'tenant_default', 'WH-003', 'Cold Storage - Addis', 'COLD_STORAGE', 'Bole Subcity', 50000.00, 'USR-027', 'Bekele Alemu'),
(4, 'tenant_default', 'WH-004', 'Construction Yard', 'YARD', 'Akaki Kality', 750000.00, 'USR-028', 'Gebre Mariam'),
(5, 'tenant_default', 'WH-005', 'IT Storage', 'SECURED', 'Bole Subcity', 100000.00, 'USR-029', 'Kidus Entoto');

INSERT INTO warehouse_receipts (id, tenant_id, receipt_number, po_id, received_by, received_by_name, category_id, delivery_location, quantity_received, quantity_accepted, quantity_rejected, status, processed_by, processed_by_name, processed_at, notes, received_at) VALUES
(50001, 'tenant_default', 'WR-2026-001', 30001, 'Dawit Haile', 'Dawit Haile', 2001, 'WH-001', 66000.00, 66000.00, 0.00, 'completed', 'Dawit Haile', 'Dawit Haile', '2026-03-02 14:30:00', 'All items received in good condition', '2026-03-01 10:00:00'),
(50002, 'tenant_default', 'WR-2026-002', 30002, 'Sara Mengistu', 'Sara Mengistu', 2010, 'WH-003', 35050.00, 35050.00, 0.00, 'completed', 'Sara Mengistu', 'Sara Mengistu', '2026-03-06 11:00:00', 'Cold storage items received properly', '2026-03-05 09:00:00'),
(50003, 'tenant_default', 'WR-2026-003', 30003, 'Gebre Mariam', 'Gebre Mariam', 2041, 'WH-004', 846500.00, 846500.00, 0.00, 'completed', 'Gebre Mariam', 'Gebre Mariam', '2026-02-12 16:00:00', 'Emergency construction materials received', '2026-02-11 08:00:00'),
(50004, 'tenant_default', 'WR-2026-004', 30004, 'Dawit Haile', 'Dawit Haile', 2001, 'WH-001', 66000.00, 56100.00, 9900.00, 'completed', 'Dawit Haile', 'Dawit Haile', '2026-03-03 15:00:00', '15% rejected due to quality issues', '2026-03-02 10:00:00'),
(50005, 'tenant_default', 'WR-2026-005', 30006, 'Dawit Haile', 'Dawit Haile', 2001, 'WH-001', 45000.00, 45000.00, 0.00, 'completed', 'Dawit Haile', 'Dawit Haile', '2026-02-26 14:00:00', 'Office furniture received', '2026-02-25 10:00:00'),
(50006, 'tenant_default', 'WR-2026-006', 30007, 'Bekele Alemu', 'Bekele Alemu', 2003, 'WH-003', 28000.00, 28000.00, 0.00, 'completed', 'Bekele Alemu', 'Bekele Alemu', '2026-02-28 11:00:00', 'Laboratory supplies received', '2026-02-27 09:00:00'),
(50007, 'tenant_default', 'WR-2026-007', 30008, 'Kidus Entoto', 'Kidus Entoto', 2062, 'WH-005', 125000.00, 0.00, 0.00, 'pending', NULL, NULL, NULL, 'Awaiting delivery', '2026-03-26 10:00:00'),
(50008, 'tenant_default', 'WR-2026-008', 30009, 'Gebre Mariam', 'Gebre Mariam', 2041, 'WH-004', 450000.00, 0.00, 0.00, 'pending', NULL, NULL, NULL, 'Bulk materials scheduled', '2026-03-27 09:00:00'),
(50009, 'tenant_default', 'WR-2026-009', 30010, 'Dawit Haile', 'Dawit Haile', 2001, 'WH-001', 150000.00, 150000.00, 0.00, 'completed', 'Dawit Haile', 'Dawit Haile', '2026-03-23 14:00:00', 'Emergency production parts received', '2026-03-22 10:00:00');

COMMIT;
