-- Phase 3: Final 13 Warehouse Receipts (Total: 50)
BEGIN;

INSERT INTO warehouse_receipts (id, tenant_id, receipt_number, po_id, received_by, received_by_name, category_id, delivery_location, quantity_received, quantity_accepted, quantity_rejected, status, processed_by, processed_by_name, processed_at, notes, received_at) VALUES
(50038, 'tenant_default', 'WR-2026-038', NULL, 'Dawit Haile', 'Dawit Haile', 2001, 'WH-001', 54000.00, 51300.00, 2700.00, 'completed', 'Dawit Haile', 'Dawit Haile', '2026-04-21 14:00:00', '5% rejected', '2026-04-20 10:00:00'),
(50039, 'tenant_default', 'WR-2026-039', NULL, 'Sara Mengistu', 'Sara Mengistu', 2001, 'WH-002', 92000.00, 92000.00, 0.00, 'completed', 'Sara Mengistu', 'Sara Mengistu', '2026-04-23 12:00:00', 'Regional stock', '2026-04-22 09:00:00'),
(50040, 'tenant_default', 'WR-2026-040', NULL, 'Gebre Mariam', 'Gebre Mariam', 2041, 'WH-004', 380000.00, 361000.00, 19000.00, 'completed', 'Gebre Mariam', 'Gebre Mariam', '2026-04-25 15:00:00', '5% rejected', '2026-04-24 09:00:00'),
(50041, 'tenant_default', 'WR-2026-041', NULL, 'Bekele Alemu', 'Bekele Alemu', 2010, 'WH-003', 49000.00, 46550.00, 2450.00, 'completed', 'Bekele Alemu', 'Bekele Alemu', '2026-04-27 11:00:00', '5% rejected', '2026-04-26 09:00:00'),
(50042, 'tenant_default', 'WR-2026-042', NULL, 'Kidus Entoto', 'Kidus Entoto', 2062, 'WH-005', 135000.00, 135000.00, 0.00, 'completed', 'Kidus Entoto', 'Kidus Entoto', '2026-04-29 13:00:00', 'IT hardware', '2026-04-28 10:00:00'),
(50043, 'tenant_default', 'WR-2026-043', NULL, 'Dawit Haile', 'Dawit Haile', 2001, 'WH-001', 61000.00, 57950.00, 3050.00, 'completed', 'Dawit Haile', 'Dawit Haile', '2026-05-01 14:00:00', '5% rejected', '2026-04-30 10:00:00'),
(50044, 'tenant_default', 'WR-2026-044', NULL, 'Sara Mengistu', 'Sara Mengistu', 2001, 'WH-002', 83000.00, 83000.00, 0.00, 'completed', 'Sara Mengistu', 'Sara Mengistu', '2026-05-03 12:00:00', 'Regional supplies', '2026-05-02 09:00:00'),
(50045, 'tenant_default', 'WR-2026-045', NULL, 'Gebre Mariam', 'Gebre Mariam', 2041, 'WH-004', 295000.00, 280250.00, 14750.00, 'completed', 'Gebre Mariam', 'Gebre Mariam', '2026-05-05 15:00:00', '5% rejected', '2026-05-04 09:00:00'),
(50046, 'tenant_default', 'WR-2026-046', NULL, 'Bekele Alemu', 'Bekele Alemu', 2003, 'WH-003', 41000.00, 38950.00, 2050.00, 'completed', 'Bekele Alemu', 'Bekele Alemu', '2026-05-07 11:00:00', '5% rejected', '2026-05-06 09:00:00'),
(50047, 'tenant_default', 'WR-2026-047', NULL, 'Kidus Entoto', 'Kidus Entoto', 2062, 'WH-005', 105000.00, 105000.00, 0.00, 'completed', 'Kidus Entoto', 'Kidus Entoto', '2026-05-09 13:00:00', 'IT components', '2026-05-08 10:00:00'),
(50048, 'tenant_default', 'WR-2026-048', NULL, 'Dawit Haile', 'Dawit Haile', 2001, 'WH-001', 59000.00, 56050.00, 2950.00, 'completed', 'Dawit Haile', 'Dawit Haile', '2026-05-11 14:00:00', '5% rejected', '2026-05-10 10:00:00'),
(50049, 'tenant_default', 'WR-2026-049', NULL, 'Sara Mengistu', 'Sara Mengistu', 2001, 'WH-002', 89000.00, 89000.00, 0.00, 'completed', 'Sara Mengistu', 'Sara Mengistu', '2026-05-13 12:00:00', 'Regional warehouse', '2026-05-12 09:00:00'),
(50050, 'tenant_default', 'WR-2026-050', NULL, 'Gebre Mariam', 'Gebre Mariam', 2041, 'WH-004', 350000.00, 332500.00, 17500.00, 'completed', 'Gebre Mariam', 'Gebre Mariam', '2026-05-15 15:00:00', '5% rejected', '2026-05-14 09:00:00');

COMMIT;
