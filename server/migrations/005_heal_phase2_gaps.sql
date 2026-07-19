-- Healing Phase 2 Gaps - Data-Driven Development Enhancement
BEGIN;

-- Supplier Quotations
INSERT INTO supplier_quotations (id, tenant_id, quotation_number, quotation_date, requisition_id, supplier_id, supplier_name, valid_until, quotation_status, subtotal, vat_amount, total_amount, currency, received_by, received_by_name) VALUES
(70001, 'tenant_default', 'QT-2026-001', '2026-02-16', 10001, 1, 'Sheger Agro Industrial PLC', '2026-03-15', 'received', 66000.00, 9900.00, 75900.00, 'ETB', 'Abebe Kebede', 'Abebe Kebede'),
(70002, 'tenant_default', 'QT-2026-002', '2026-02-16', 10001, 3, 'Rift Valley Trading', '2026-03-15', 'received', 68000.00, 10200.00, 78200.00, 'ETB', 'Abebe Kebede', 'Abebe Kebede'),
(70003, 'tenant_default', 'QT-2026-003', '2026-02-06', 10004, 5, 'Highland Construction Materials', '2026-02-15', 'accepted', 846500.00, 126975.00, 973475.00, 'ETB', 'Tewodros Assefa', 'Tewodros Assefa');

INSERT INTO supplier_quotation_items (id, quotation_id, line_number, requisition_item_id, product_id, product_name, category_id, quantity, unit_of_measure, unit_price) VALUES
(80001, 70001, 1, 20001, 1001, 'High-Yield Teff Seed (50kg)', 2001, 10, 'BAG', 4500.00),
(80002, 70001, 2, 20002, 1002, 'Organic Fertilizer Compound (25kg)', 2001, 10, 'BAG', 2100.00),
(80003, 70002, 1, 20001, 1001, 'High-Yield Teff Seed (50kg)', 2001, 10, 'BAG', 4650.00),
(80004, 70002, 2, 20002, 1002, 'Organic Fertilizer Compound (25kg)', 2001, 10, 'BAG', 2150.00),
(80005, 70003, 1, 20007, 1006, 'Reinforced Deformed Steel Bar (12mm)', 2041, 10, 'TON', 78000.00),
(80006, 70003, 2, 20008, 1005, 'Portland Cement OPC (Grade 42.5N)', 2041, 70, 'BAG', 950.00);

-- Budget Commitments
INSERT INTO budget_commitments (id, tenant_id, budget_id, commitment_type, reference_type, reference_id, committed_amount, currency, status, committed_by, committed_by_name, notes) VALUES
(90001, 'tenant_default', 5001, 'purchase_requisition', 'purchase_requisition', 10001, 66000.00, 'ETB', 'active', 'Abebe Kebede', 'Abebe Kebede', 'Seasonal seed and compost supply'),
(90002, 'tenant_default', 5002, 'purchase_requisition', 'purchase_requisition', 10002, 35050.00, 'ETB', 'active', 'Marta Demeke', 'Marta Demeke', 'Raw meat procurement baseline'),
(90003, 'tenant_default', 5003, 'purchase_requisition', 'purchase_requisition', 10004, 850100.00, 'ETB', 'active', 'Tewodros Assefa', 'Tewodros Assefa', 'Emergency structural reinforcement'),
(90004, 'tenant_default', 5004, 'purchase_requisition', 'purchase_requisition', 10003, 97500.00, 'ETB', 'active', 'Yonas Alemu', 'Yonas Alemu', 'Cloud database capacity addition'),
(90005, 'tenant_default', 5005, 'purchase_requisition', 'purchase_requisition', 10005, 120000.00, 'ETB', 'active', 'Selam Tesfaye', 'Selam Tesfaye', 'Annual tax audit advisory');

-- Purchase Documents
INSERT INTO purchase_documents (id, tenant_id, document_type, reference_type, reference_id, document_name, document_url, document_size, document_mime_type, uploaded_by, uploaded_by_name, description) VALUES
(100001, 'tenant_default', 'specification', 'purchase_requisition', 10001, 'Seed_Specification_2026.pdf', 'https://storage.example.com/docs/seed_spec_2026.pdf', 2456789, 'application/pdf', 'Abebe Kebede', 'Abebe Kebede', 'Technical specification for teff seed'),
(100002, 'tenant_default', 'quotation', 'purchase_requisition', 10001, 'Supplier_Quote_Sheger.pdf', 'https://storage.example.com/docs/quote_sheger_2026.pdf', 1234567, 'application/pdf', 'Abebe Kebede', 'Abebe Kebede', 'Official quotation from Sheger Agro'),
(100003, 'tenant_default', 'inspection_report', 'purchase_requisition', 10004, 'Foundation_Inspection_Report.pdf', 'https://storage.example.com/docs/foundation_inspect_2026.pdf', 3456789, 'application/pdf', 'Tewodros Assefa', 'Tewodros Assefa', 'Emergency foundation inspection'),
(100004, 'tenant_default', 'purchase_order', 'purchase_order', 30001, 'PO-2026-001_Signed.pdf', 'https://storage.example.com/docs/po_2026_001_signed.pdf', 789012, 'application/pdf', 'Abebe Kebede', 'Abebe Kebede', 'Signed purchase order');

-- Purchase Comments
INSERT INTO purchase_comments (id, tenant_id, comment_type, reference_type, reference_id, comment_text, commented_by, commented_by_name, commented_by_role, is_internal) VALUES
(110001, 'tenant_default', 'clarification', 'purchase_requisition', 10001, 'Please confirm delivery timeline for Q1 planting season', 'Abebe Kebede', 'Abebe Kebede', 'Department Manager', FALSE),
(110002, 'tenant_default', 'approval', 'purchase_requisition', 10001, 'Budget allocation confirmed under category 2001', 'Sara Girma', 'Sara Girma', 'Finance Controller', TRUE),
(110003, 'tenant_default', 'urgent', 'purchase_requisition', 10004, 'CRITICAL: Foundation water damage requires immediate structural reinforcement', 'Tewodros Assefa', 'Tewodros Assefa', 'Site Engineer', FALSE),
(110004, 'tenant_default', 'approval', 'purchase_requisition', 10004, 'Emergency funds allocated. Budget category 2041 modified', 'Sara Girma', 'Sara Girma', 'Finance Controller', TRUE),
(110005, 'tenant_default', 'approval', 'purchase_requisition', 10004, 'Urgent structural bypass authorized. Issue immediate PO.', 'Elias Zerihun', 'Elias Zerihun', 'General Director', TRUE),
(110006, 'tenant_default', 'clarification', 'purchase_requisition', 10003, 'Tech requirements justified. Need finance validation', 'Hiwot Wolde', 'Hiwot Wolde', 'IT Manager', FALSE),
(110007, 'tenant_default', 'rejection', 'purchase_requisition', 10006, 'REJECTED: Order total creates critical budget overrun for Category 2041 in Q1', 'Sara Girma', 'Sara Girma', 'Finance Controller', FALSE);

-- Scale Up: Additional Purchase Requisitions (13 more to reach 20 total)
INSERT INTO purchase_requisitions (id, tenant_id, requisition_number, requisition_date, requested_by, requested_by_name, priority, urgency, status, total_amount, expected_delivery_date, justification) VALUES
(10008, 'tenant_default', 'REQ-2026-008', '2026-02-20 09:00:00', 'Kassahun Bekele', 'Kassahun Bekele', 'MEDIUM', 'NORMAL', 'approved', 45000.00, '2026-03-25', 'Office furniture replacement for regional branch'),
(10009, 'tenant_default', 'REQ-2026-009', '2026-02-22 14:30:00', 'Almaz Ayana', 'Almaz Ayana', 'LOW', 'NORMAL', 'approved', 28000.00, '2026-03-30', 'Laboratory equipment calibration supplies'),
(10010, 'tenant_default', 'REQ-2026-010', '2026-02-25 11:00:00', 'Dawit Haile', 'Dawit Haile', 'MEDIUM', 'NORMAL', 'approved', 125000.00, '2026-04-05', 'IT network infrastructure upgrade components'),
(10011, 'tenant_default', 'REQ-2026-011', '2026-02-28 16:45:00', 'Sara Mengistu', 'Sara Mengistu', 'HIGH', 'NORMAL', 'pending', 89000.00, '2026-04-10', 'Vehicle maintenance parts for fleet service'),
(10012, 'tenant_default', 'REQ-2026-012', '2026-03-03 10:15:00', 'Bekele Alemu', 'Bekele Alemu', 'LOW', 'NORMAL', 'approved', 35000.00, '2026-04-15', 'Safety equipment and protective gear'),
(10013, 'tenant_default', 'REQ-2026-013', '2026-03-05 08:30:00', 'Gebre Mariam', 'Gebre Mariam', 'HIGH', 'NORMAL', 'approved', 450000.00, '2026-04-20', 'Bulk construction materials for new warehouse'),
(10014, 'tenant_default', 'REQ-2026-014', '2026-03-08 13:00:00', 'Kidus Entoto', 'Kidus Entoto', 'HIGH', 'NORMAL', 'pending', 320000.00, '2026-04-25', 'Industrial machinery parts inventory replenishment'),
(10015, 'tenant_default', 'REQ-2026-015', '2026-03-12 09:45:00', 'Aster Nile', 'Aster Nile', 'MEDIUM', 'DELAYED', 'pending', 55000.00, '2026-05-10', 'Delayed office supplies delivery due to supplier stockout'),
(10016, 'tenant_default', 'REQ-2026-016', '2026-03-15 14:20:00', 'Ahmed Redsea', 'Ahmed Redsea', 'MEDIUM', 'DELAYED', 'in_progress', 78000.00, '2026-05-15', 'Logistics services delayed due to customs clearance'),
(10017, 'tenant_default', 'REQ-2026-017', '2026-03-18 11:30:00', 'Chala Rift', 'Chala Rift', 'CRITICAL', 'EMERGENCY', 'approved', 150000.00, '2026-03-22', 'EMERGENCY: Critical production line replacement parts'),
(10018, 'tenant_default', 'REQ-2026-018', '2026-03-20 15:00:00', 'Mekonnen Blue', 'Mekonnen Blue', 'LOW', 'NORMAL', 'draft', 18000.00, '2026-06-01', 'Stationery and office supplies quarterly restock'),
(10019, 'tenant_default', 'REQ-2026-019', '2026-03-22 10:30:00', 'Tigist Awash', 'Tigist Awash', 'MEDIUM', 'NORMAL', 'approved', 67000.00, '2026-04-30', 'Marketing materials for Q2 campaign'),
(10020, 'tenant_default', 'REQ-2026-020', '2026-03-25 09:15:00', 'Fikre Omo', 'Fikre Omo', 'HIGH', 'NORMAL', 'pending', 145000.00, '2026-05-05', 'Quality control equipment upgrade');

-- Scale Up: Additional Purchase Orders (10 more to reach 15 total)
INSERT INTO purchase_orders (id, tenant_id, requisition_id, supplier_id, supplier_name, po_number, po_date, expected_delivery_date, status, currency, subtotal, vat_amount, total_amount) VALUES
(30006, 'tenant_default', 10008, 2, 'Abay Manufacturing Enterprise', 'PO-2026-006', '2026-02-21 10:00:00', '2026-03-25', 'completed', 'ETB', 45000.00, 6750.00, 51750.00),
(30007, 'tenant_default', 10009, 4, 'Chamo Lake Fisheries & Feed', 'PO-2026-007', '2026-02-23 15:00:00', '2026-03-30', 'completed', 'ETB', 28000.00, 4200.00, 32200.00),
(30008, 'tenant_default', 10010, 6, 'Entoto Tech Solutions PLC', 'PO-2026-008', '2026-02-26 12:00:00', '2026-04-05', 'sent', 'ETB', 125000.00, 18750.00, 143750.00),
(30009, 'tenant_default', 10013, 5, 'Highland Construction Materials', 'PO-2026-009', '2026-03-06 09:00:00', '2026-04-20', 'acknowledged', 'ETB', 450000.00, 67500.00, 517500.00),
(30010, 'tenant_default', 10017, 1, 'Sheger Agro Industrial PLC', 'PO-2026-010', '2026-03-18 12:00:00', '2026-03-22', 'completed', 'ETB', 150000.00, 22500.00, 172500.00),
(30011, 'tenant_default', 10019, 3, 'Rift Valley Trading', 'PO-2026-011', '2026-03-23 11:00:00', '2026-04-30', 'sent', 'ETB', 67000.00, 10050.00, 77050.00),
(30012, 'tenant_default', 10012, 2, 'Abay Manufacturing Enterprise', 'PO-2026-012', '2026-03-04 14:00:00', '2026-04-15', 'partially_received', 'ETB', 35000.00, 5250.00, 40250.00),
(30013, 'tenant_default', 10011, 5, 'Highland Construction Materials', 'PO-2026-013', '2026-03-01 10:00:00', '2026-04-10', 'draft', 'ETB', 89000.00, 13350.00, 102350.00),
(30014, 'tenant_default', 10014, 6, 'Entoto Tech Solutions PLC', 'PO-2026-014', '2026-03-09 13:00:00', '2026-04-25', 'draft', 'ETB', 320000.00, 48000.00, 368000.00),
(30015, 'tenant_default', 10020, 1, 'Sheger Agro Industrial PLC', 'PO-2026-015', '2026-03-26 10:00:00', '2026-05-05', 'sent', 'ETB', 145000.00, 21750.00, 166750.00);

COMMIT;
