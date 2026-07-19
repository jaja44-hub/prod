-- Phase 3: Scale to 50+ Warehouse Receipts
BEGIN;

INSERT INTO warehouse_receipts (id, tenant_id, receipt_number, po_id, received_by, received_by_name, category_id, delivery_location, quantity_received, quantity_accepted, quantity_rejected, status, processed_by, processed_by_name, processed_at, notes, received_at) VALUES
(50010, 'tenant_default', 'WR-2026-010', 30011, 'Dawit Haile', 'Dawit Haile', 2001, 'WH-001', 67000.00, 0.00, 0.00, 'pending', NULL, NULL, NULL, 'Marketing materials scheduled', '2026-03-28 10:00:00'),
(50011, 'tenant_default', 'WR-2026-011', 30012, 'Dawit Haile', 'Dawit Haile', 2001, 'WH-001', 35000.00, 31500.00, 3500.00, 'completed', 'Dawit Haile', 'Dawit Haile', '2026-03-05 14:00:00', '10% rejected', '2026-03-04 10:00:00'),
(50012, 'tenant_default', 'WR-2026-012', 30013, 'Gebre Mariam', 'Gebre Mariam', 2041, 'WH-004', 89000.00, 0.00, 0.00, 'draft', NULL, NULL, NULL, 'PO in draft', '2026-03-29 10:00:00'),
(50013, 'tenant_default', 'WR-2026-013', 30014, 'Kidus Entoto', 'Kidus Entoto', 2062, 'WH-005', 320000.00, 0.00, 0.00, 'draft', NULL, NULL, NULL, 'PO in draft', '2026-03-30 10:00:00'),
(50014, 'tenant_default', 'WR-2026-014', 30015, 'Kidus Entoto', 'Kidus Entoto', 2062, 'WH-005', 145000.00, 0.00, 0.00, 'pending', NULL, NULL, NULL, 'Quality equipment scheduled', '2026-03-31 10:00:00'),
(50015, 'tenant_default', 'WR-2026-015', NULL, 'Sara Mengistu', 'Sara Mengistu', 2001, 'WH-002', 25000.00, 25000.00, 0.00, 'completed', 'Sara Mengistu', 'Sara Mengistu', '2026-03-01 12:00:00', 'Direct delivery', '2026-02-28 10:00:00'),
(50016, 'tenant_default', 'WR-2026-016', NULL, 'Gebre Mariam', 'Gebre Mariam', 2041, 'WH-004', 180000.00, 171000.00, 9000.00, 'completed', 'Gebre Mariam', 'Gebre Mariam', '2026-03-08 15:00:00', '5% rejected', '2026-03-07 09:00:00'),
(50017, 'tenant_default', 'WR-2026-017', NULL, 'Dawit Haile', 'Dawit Haile', 2001, 'WH-001', 32000.00, 32000.00, 0.00, 'completed', 'Dawit Haile', 'Dawit Haile', '2026-03-10 14:00:00', 'Stationery received', '2026-03-09 10:00:00'),
(50018, 'tenant_default', 'WR-2026-018', NULL, 'Bekele Alemu', 'Bekele Alemu', 2010, 'WH-003', 45000.00, 42750.00, 2250.00, 'completed', 'Bekele Alemu', 'Bekele Alemu', '2026-03-12 11:00:00', '5% rejected', '2026-03-11 09:00:00'),
(50019, 'tenant_default', 'WR-2026-019', NULL, 'Kidus Entoto', 'Kidus Entoto', 2062, 'WH-005', 89000.00, 89000.00, 0.00, 'completed', 'Kidus Entoto', 'Kidus Entoto', '2026-03-14 13:00:00', 'IT equipment received', '2026-03-13 10:00:00'),
(50020, 'tenant_default', 'WR-2026-020', NULL, 'Dawit Haile', 'Dawit Haile', 2001, 'WH-001', 55000.00, 52250.00, 2750.00, 'completed', 'Dawit Haile', 'Dawit Haile', '2026-03-16 14:00:00', '5% rejected', '2026-03-15 10:00:00'),
(50021, 'tenant_default', 'WR-2026-021', NULL, 'Sara Mengistu', 'Sara Mengistu', 2001, 'WH-002', 78000.00, 78000.00, 0.00, 'completed', 'Sara Mengistu', 'Sara Mengistu', '2026-03-18 12:00:00', 'Regional supplies', '2026-03-17 09:00:00'),
(50022, 'tenant_default', 'WR-2026-022', NULL, 'Gebre Mariam', 'Gebre Mariam', 2041, 'WH-004', 320000.00, 304000.00, 16000.00, 'completed', 'Gebre Mariam', 'Gebre Mariam', '2026-03-20 15:00:00', '5% rejected', '2026-03-19 09:00:00'),
(50023, 'tenant_default', 'WR-2026-023', NULL, 'Dawit Haile', 'Dawit Haile', 2001, 'WH-001', 42000.00, 42000.00, 0.00, 'completed', 'Dawit Haile', 'Dawit Haile', '2026-03-22 14:00:00', 'Office supplies', '2026-03-21 10:00:00');

COMMIT;
