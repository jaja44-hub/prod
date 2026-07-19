-- Phase 3: Add 14 More Warehouse Receipts (Total: 37)
BEGIN;

INSERT INTO warehouse_receipts (id, tenant_id, receipt_number, po_id, received_by, received_by_name, category_id, delivery_location, quantity_received, quantity_accepted, quantity_rejected, status, processed_by, processed_by_name, processed_at, notes, received_at) VALUES
(50024, 'tenant_default', 'WR-2026-024', NULL, 'Bekele Alemu', 'Bekele Alemu', 2003, 'WH-003', 35000.00, 33250.00, 1750.00, 'completed', 'Bekele Alemu', 'Bekele Alemu', '2026-03-24 11:00:00', '5% rejected', '2026-03-23 09:00:00'),
(50025, 'tenant_default', 'WR-2026-025', NULL, 'Kidus Entoto', 'Kidus Entoto', 2062, 'WH-005', 125000.00, 125000.00, 0.00, 'completed', 'Kidus Entoto', 'Kidus Entoto', '2026-03-26 13:00:00', 'Network equipment', '2026-03-25 10:00:00'),
(50026, 'tenant_default', 'WR-2026-026', NULL, 'Dawit Haile', 'Dawit Haile', 2001, 'WH-001', 68000.00, 64600.00, 3400.00, 'completed', 'Dawit Haile', 'Dawit Haile', '2026-03-28 14:00:00', '5% rejected', '2026-03-27 10:00:00'),
(50027, 'tenant_default', 'WR-2026-027', NULL, 'Sara Mengistu', 'Sara Mengistu', 2001, 'WH-002', 95000.00, 95000.00, 0.00, 'completed', 'Sara Mengistu', 'Sara Mengistu', '2026-03-30 12:00:00', 'Regional warehouse', '2026-03-29 09:00:00'),
(50028, 'tenant_default', 'WR-2026-028', NULL, 'Gebre Mariam', 'Gebre Mariam', 2041, 'WH-004', 275000.00, 261250.00, 13750.00, 'completed', 'Gebre Mariam', 'Gebre Mariam', '2026-04-01 15:00:00', '5% rejected', '2026-03-31 09:00:00'),
(50029, 'tenant_default', 'WR-2026-029', NULL, 'Dawit Haile', 'Dawit Haile', 2001, 'WH-001', 38000.00, 38000.00, 0.00, 'completed', 'Dawit Haile', 'Dawit Haile', '2026-04-03 14:00:00', 'General supplies', '2026-04-02 10:00:00'),
(50030, 'tenant_default', 'WR-2026-030', NULL, 'Bekele Alemu', 'Bekele Alemu', 2010, 'WH-003', 52000.00, 49400.00, 2600.00, 'completed', 'Bekele Alemu', 'Bekele Alemu', '2026-04-05 11:00:00', '5% rejected', '2026-04-04 09:00:00'),
(50031, 'tenant_default', 'WR-2026-031', NULL, 'Kidus Entoto', 'Kidus Entoto', 2062, 'WH-005', 98000.00, 98000.00, 0.00, 'completed', 'Kidus Entoto', 'Kidus Entoto', '2026-04-07 13:00:00', 'IT peripherals', '2026-04-06 10:00:00'),
(50032, 'tenant_default', 'WR-2026-032', NULL, 'Dawit Haile', 'Dawit Haile', 2001, 'WH-001', 73000.00, 69350.00, 3650.00, 'completed', 'Dawit Haile', 'Dawit Haile', '2026-04-09 14:00:00', '5% rejected', '2026-04-08 10:00:00'),
(50033, 'tenant_default', 'WR-2026-033', NULL, 'Sara Mengistu', 'Sara Mengistu', 2001, 'WH-002', 88000.00, 88000.00, 0.00, 'completed', 'Sara Mengistu', 'Sara Mengistu', '2026-04-11 12:00:00', 'Regional stock', '2026-04-10 09:00:00'),
(50034, 'tenant_default', 'WR-2026-034', NULL, 'Gebre Mariam', 'Gebre Mariam', 2041, 'WH-004', 410000.00, 389500.00, 20500.00, 'completed', 'Gebre Mariam', 'Gebre Mariam', '2026-04-13 15:00:00', '5% rejected', '2026-04-12 09:00:00'),
(50035, 'tenant_default', 'WR-2026-035', NULL, 'Dawit Haile', 'Dawit Haile', 2001, 'WH-001', 46000.00, 46000.00, 0.00, 'completed', 'Dawit Haile', 'Dawit Haile', '2026-04-15 14:00:00', 'Maintenance supplies', '2026-04-14 10:00:00'),
(50036, 'tenant_default', 'WR-2026-036', NULL, 'Bekele Alemu', 'Bekele Alemu', 2010, 'WH-003', 48000.00, 45600.00, 2400.00, 'completed', 'Bekele Alemu', 'Bekele Alemu', '2026-04-17 11:00:00', '5% rejected', '2026-04-16 09:00:00'),
(50037, 'tenant_default', 'WR-2026-037', NULL, 'Kidus Entoto', 'Kidus Entoto', 2062, 'WH-005', 115000.00, 115000.00, 0.00, 'completed', 'Kidus Entoto', 'Kidus Entoto', '2026-04-19 13:00:00', 'IT accessories', '2026-04-18 10:00:00');

COMMIT;
