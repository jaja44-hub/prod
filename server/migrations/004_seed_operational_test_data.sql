-- /home/ja/Documents/production-submodule/server/migrations/004_seed_operational_test_data.sql
-- Fixed Operational Test Data Seeding for Ethiopian ERP (Fiscal Year 2026)
BEGIN;

-- Wipe tables and dependencies to ensure a clean state
TRUNCATE TABLE approval_workflow_actions CASCADE;
TRUNCATE TABLE approval_workflow_instances CASCADE;
TRUNCATE TABLE approval_workflow_stages CASCADE;
TRUNCATE TABLE approval_workflow_configurations CASCADE;
TRUNCATE TABLE purchase_order_items CASCADE;
TRUNCATE TABLE purchase_orders CASCADE;
TRUNCATE TABLE purchase_requisition_items CASCADE;
TRUNCATE TABLE purchase_requisitions CASCADE;
TRUNCATE TABLE budgets CASCADE;
TRUNCATE TABLE products CASCADE;
TRUNCATE TABLE suppliers CASCADE;

-- ============================================================================
-- 1. SUPPLIERS (IDs: 1 - 100)
-- Schema matches: suppliers (tenant_id, supplier_code, name, tax_id, address, city, phone, email, payment_terms, rating, active, contact_person, contact_phone, contact_email)
-- ============================================================================
INSERT INTO suppliers (id, tenant_id, supplier_code, name, tax_id, address, city, phone, email, payment_terms, rating, active, contact_person, contact_phone, contact_email) VALUES
(1, 'tenant_default', 'SUP001', 'Sheger Agro Industrial PLC', 'TIN987654321', 'Bole Subcity, Woreda 03', 'Addis Ababa', '+251116123456', 'info@shegeragro.et', 30, 5, TRUE, 'Abebe Sheger', '+251911112233', 'abebe@shegeragro.et'),
(2, 'tenant_default', 'SUP002', 'Abay Manufacturing Enterprise', 'TIN987654322', 'Industrial Zone, Block A', 'Bahir Dar', '+251582201122', 'contact@abaymfg.et', 15, 4, TRUE, 'Mulugeta Abay', '+251911223344', 'mulugeta@abaymfg.et'),
(3, 'tenant_default', 'SUP003', 'Rift Valley Trading', 'TIN987654323', 'Tabour Subcity, Main Road', 'Hawassa', '+251462203344', 'sales@riftvalley.et', 0, 3, TRUE, 'Chala Rift', '+251911334455', 'chala@riftvalley.et'),
(4, 'tenant_default', 'SUP004', 'Chamo Lake Fisheries & Feed', 'TIN987654324', 'Lake Area, Woreda 01', 'Arba Minch', '+251468811223', 'chamo.fish@gmail.com', 30, 4, TRUE, 'Daniel Chamo', '+251911445566', 'daniel@chamo.fish'),
(5, 'tenant_default', 'SUP005', 'Highland Construction Materials', 'TIN987654325', 'Hadnet Subcity, Woreda 05', 'Mekelle', '+251344405566', 'highland.materials@gmail.com', 45, 2, TRUE, 'Gebre Highland', '+251911556677', 'gebre@highland.materials'),
(6, 'tenant_default', 'SUP006', 'Entoto Tech Solutions PLC', 'TIN987654326', 'Yeka Subcity, Signal', 'Addis Ababa', '+251116677889', 'support@entototech.et', 30, 5, TRUE, 'Kidus Entoto', '+251911667788', 'kidus@entototech.et'),
(7, 'tenant_default', 'SUP007', 'Nile Stationery and Office Supply', 'TIN987654327', 'Kirkos Subcity, Kazanchis', 'Addis Ababa', '+251115511223', 'nile.office@gmail.com', 15, 3, TRUE, 'Aster Nile', '+251911778899', 'aster@nile.office'),
(8, 'tenant_default', 'SUP008', 'Red Sea Logistics and Freight', 'TIN987654328', 'Station Road, Kebele 04', 'Adama', '+251221112233', 'ops@redsealogistics.et', 60, 4, TRUE, 'Ahmed Redsea', '+251911889900', 'ahmed@redsealogistics.et');

-- ============================================================================
-- 2. PRODUCTS (IDs: 1000 - 2000)
-- Schema matches: products (tenant_id, sku, name, description, category_id, unit_of_measure, cost_price, selling_price, lead_time_days, active)
-- ============================================================================
INSERT INTO products (id, tenant_id, sku, name, description, category_id, unit_of_measure, cost_price, selling_price, lead_time_days, active) VALUES
(1001, 'tenant_default', 'PRD-AG-001', 'High-Yield Teff Seed (50kg)', 'Improved Teff Seed variety certified for Ethiopian highlands', 2001, 'BAG', 4500.00, 5200.00, 5, TRUE),
(1002, 'tenant_default', 'PRD-AG-002', 'Organic Fertilizer Compound (25kg)', 'Natural soil enrichment compost', 2001, 'BAG', 2100.00, 2500.00, 7, TRUE),
(1003, 'tenant_default', 'PRD-FD-001', 'Premium Processed Beef Quarters', 'Grade A local processed beef', 2010, 'KG', 650.00, 800.00, 3, TRUE),
(1004, 'tenant_default', 'PRD-FD-002', 'Refined Sunflower Oil (5L)', 'Fortified cooking sunflower oil', 2010, 'BOTTLE', 850.00, 1050.00, 4, TRUE),
(1005, 'tenant_default', 'PRD-CS-001', 'Portland Cement OPC (Grade 42.5N)', 'Standard strength construction cement', 2041, 'BAG', 950.00, 1100.00, 10, TRUE),
(1006, 'tenant_default', 'PRD-CS-002', 'Reinforced Deformed Steel Bar (12mm)', 'High tensile strength reinforcement bar', 2041, 'TON', 78000.00, 85000.00, 14, TRUE),
(1007, 'tenant_default', 'PRD-IT-001', 'Enterprise Cloud Hosting Service (Monthly)', 'Local low-latency secure server hosting', 2062, 'MONTH', 12500.00, 15000.00, 1, TRUE),
(1008, 'tenant_default', 'PRD-IT-002', 'Relational Database Orchestrator License', 'Enterprise database architecture framework engine', 2062, 'LICENSE', 85000.00, 95000.00, 2, TRUE),
(1009, 'tenant_default', 'PRD-LG-001', 'Corporate Legal Advisory (Hourly)', 'Senior counsel advisory on Ethiopian commercial code', 2069, 'HOUR', 3500.00, 4500.00, 1, TRUE),
(1010, 'tenant_default', 'PRD-LG-002', 'Tax Compliance Audit (Service package)', 'Full year business financial audit verification', 2069, 'PACKAGE', 120000.00, 140000.00, 30, TRUE),
(1016, 'tenant_default', 'PRD-FI-001', 'Hatchery Fingerling (Tilapia)', 'A-grade fresh aquaculture fingerlings', 2003, 'PCS', 15.00, 22.00, 10, TRUE);

-- ============================================================================
-- 3. BUDGETS (IDs: 5000 - 6000)
-- Schema matches: budgets (tenant_id, budget_code, name, category_id, fiscal_year, fiscal_period, budgeted_amount, actual_amount, status)
-- ============================================================================
INSERT INTO budgets (id, tenant_id, budget_code, name, category_id, fiscal_year, fiscal_period, budgeted_amount, actual_amount, status) VALUES
(5001, 'tenant_default', 'BGT-2026-AG01', 'Agriculture Crops Q1 Budget', 2001, 2026, 'Q1', 1500000.00, 450000.00, 'active'),
(5002, 'tenant_default', 'BGT-2026-FD01', 'Food Processing Q1 Budget', 2010, 2026, 'Q1', 2000000.00, 1950000.00, 'active'),
(5003, 'tenant_default', 'BGT-2026-CS01', 'Construction HQ Extension Q1', 2041, 2026, 'Q1', 5000000.00, 5800000.00, 'active'),
(5004, 'tenant_default', 'BGT-2026-IT01', 'IT Cloud Orchestration Q1', 2062, 2026, 'Q1', 3500000.00, 1200000.00, 'active'),
(5005, 'tenant_default', 'BGT-2026-LG01', 'Legal Advocacy & Audit Q1', 2069, 2026, 'Q1', 800000.00, 780000.00, 'active');

-- ============================================================================
-- 4. APPROVAL WORKFLOW CONFIGURATIONS (IDs: 10 - 50)
-- Schema matches: approval_workflow_configurations (tenant_id, workflow_type, workflow_name, description, active)
-- ============================================================================
INSERT INTO approval_workflow_configurations (id, tenant_id, workflow_type, workflow_name, description, active) VALUES
(10, 'tenant_default', 'purchase_requisition', 'Purchase Requisition Validation', 'Multi-stage validation routing for internal material requests', TRUE),
(20, 'tenant_default', 'purchase_order', 'Purchase Order Authorization', 'Authorization chain for binding supplier contract issuance', TRUE),
(30, 'tenant_default', 'budget_allocation', 'Budget Modification Control', 'Strict multi-layer control for adjusting allocated department funds', TRUE);

-- ============================================================================
-- 5. APPROVAL WORKFLOW STAGES (IDs: 100 - 500)
-- Schema matches: approval_workflow_stages (configuration_id, stage_number, stage_name, approval_role, timeout_hours, can_delegate)
-- ============================================================================
INSERT INTO approval_workflow_stages (id, configuration_id, stage_number, stage_name, approval_role, timeout_hours, can_delegate) VALUES
-- Requisition Workflow Stages
(101, 10, 1, 'Department Head Review', 'DEPARTMENT_MANAGER', 48, TRUE),
(102, 10, 2, 'Financial Control Validation', 'FINANCE_CONTROLLER', 24, TRUE),
(103, 10, 3, 'Executive Director Signoff', 'GENERAL_DIRECTOR', 72, FALSE),
-- Purchase Order Workflow Stages
(201, 20, 1, 'Procurement Verification', 'PROCUREMENT_OFFICER', 24, TRUE),
(202, 20, 2, 'Budget Compliance Check', 'FINANCE_CONTROLLER', 24, TRUE),
(203, 20, 3, 'Managing Director Approval', 'GENERAL_DIRECTOR', 48, FALSE);

-- ============================================================================
-- 6. PURCHASE REQUISITIONS (IDs: 10000 - 20000)
-- Schema matches: purchase_requisitions (tenant_id, requisition_number, requisition_date, requested_by, requested_by_name, priority, urgency, status, total_amount, expected_delivery_date, justification)
-- ============================================================================
INSERT INTO purchase_requisitions (id, tenant_id, requisition_number, requisition_date, requested_by, requested_by_name, priority, urgency, status, total_amount, expected_delivery_date, justification) VALUES
-- Normal flow
(10001, 'tenant_default', 'REQ-2026-001', '2026-02-15 08:30:00', 'Abebe Kebede', 'Abebe Kebede', 'MEDIUM', 'NORMAL', 'approved', 66000.00, '2026-03-15', 'Bulk seasonal seed and compost supply for standard demonstration farm setup'),
(10002, 'tenant_default', 'REQ-2026-002', '2026-02-18 10:15:00', 'Marta Demeke', 'Marta Demeke', 'LOW', 'NORMAL', 'approved', 35050.00, '2026-03-20', 'Raw meat procurement baseline processing run'),
(10003, 'tenant_default', 'REQ-2026-003', '2026-03-01 14:00:00', 'Yonas Alemu', 'Yonas Alemu', 'HIGH', 'NORMAL', 'pending', 97500.00, '2026-03-25', 'Quarterly Cloud database and storage monitoring capacity addition'),
-- Urgent flow
(10004, 'tenant_default', 'REQ-2026-004', '2026-02-05 09:00:00', 'Tewodros Assefa', 'Tewodros Assefa', 'CRITICAL', 'EMERGENCY', 'approved', 850100.00, '2026-02-10', 'EMERGENCY: Urgent structural reinforcing items for unexpected foundation water log'),
-- Delayed flow
(10005, 'tenant_default', 'REQ-2026-005', '2026-03-10 11:30:00', 'Selam Tesfaye', 'Selam Tesfaye', 'MEDIUM', 'DELAYED', 'pending', 120000.00, '2026-04-01', 'Delayed annual tax audit advisory service package clearance request'),
-- Edge Case: Rejection / Budget Run Over limits
(10006, 'tenant_default', 'REQ-2026-006', '2026-02-11 13:00:00', 'Tewodros Assefa', 'Tewodros Assefa', 'HIGH', 'NORMAL', 'rejected', 2000000.00, '2026-02-15', 'High volume block purchase crossing baseline quarterly ceiling limit'),
(10007, 'tenant_default', 'REQ-2026-007', '2026-03-12 16:30:00', 'Almaz Ayana', 'Almaz Ayana', 'LOW', 'NORMAL', 'draft', 15000.00, '2026-05-01', 'Fingerlings replenishment inventory preliminary request');

-- ============================================================================
-- 7. PURCHASE REQUISITION ITEMS (IDs: 20000 - 30000)
-- Schema matches: purchase_requisition_items (requisition_id, line_number, product_id, category_id, quantity, unit_price, unit_of_measure, product_name)
-- Note: total_price is GENERATED column (quantity * unit_price)
-- ============================================================================
INSERT INTO purchase_requisition_items (id, requisition_id, line_number, product_id, category_id, quantity, unit_price, unit_of_measure, product_name) VALUES
-- Requisition 10001 (Normal)
(20001, 10001, 1, 1001, 2001, 10, 4500.00, 'BAG', 'High-Yield Teff Seed (50kg)'),
(20002, 10001, 2, 1002, 2001, 10, 2100.00, 'BAG', 'Organic Fertilizer Compound (25kg)'),
-- Requisition 10002 (Normal)
(20003, 10002, 1, 1003, 2010, 50, 650.00, 'KG', 'Premium Processed Beef Quarters'),
(20004, 10002, 2, 1004, 2010, 3, 850.00, 'BOTTLE', 'Refined Sunflower Oil (5L)'),
-- Requisition 10003 (Pending)
(20005, 10003, 1, 1007, 2062, 1, 12500.00, 'MONTH', 'Enterprise Cloud Hosting Service (Monthly)'),
(20006, 10003, 2, 1008, 2062, 1, 85000.00, 'LICENSE', 'Relational Database Orchestrator License'),
-- Requisition 10004 (Emergency Approved)
(20007, 10004, 1, 1006, 2041, 10, 78000.00, 'TON', 'Reinforced Deformed Steel Bar (12mm)'),
(20008, 10004, 2, 1005, 2041, 70, 950.00, 'BAG', 'Portland Cement OPC (Grade 42.5N)'),
-- Requisition 10005 (Delayed)
(20010, 10005, 1, 1010, 2069, 1, 120000.00, 'PACKAGE', 'Tax Compliance Audit (Service package)'),
-- Requisition 10006 (Rejected Overrun)
(20011, 10006, 1, 1006, 2041, 25, 78000.00, 'TON', 'Reinforced Deformed Steel Bar (12mm)'),
-- Requisition 10007 (Draft)
(20013, 10007, 1, 1016, 2003, 1000, 15.00, 'PCS', 'Hatchery Fingerling (Tilapia)');

-- ============================================================================
-- 8. PURCHASE ORDERS (IDs: 30000 - 40000)
-- Schema matches: purchase_orders (tenant_id, requisition_id, supplier_id, supplier_name, po_number, po_date, expected_delivery_date, status, currency, subtotal, vat_amount, total_amount)
-- ============================================================================
INSERT INTO purchase_orders (id, tenant_id, requisition_id, supplier_id, supplier_name, po_number, po_date, expected_delivery_date, status, currency, subtotal, vat_amount, total_amount) VALUES
-- Normal flow POs (From approved Requisitions)
(30001, 'tenant_default', 10001, 1, 'Sheger Agro Industrial PLC', 'PO-2026-001', '2026-03-01 09:00:00', '2026-03-08', 'completed', 'ETB', 66000.00, 9900.00, 75900.00),
(30002, 'tenant_default', 10002, 3, 'Rift Valley Trading', 'PO-2026-002', '2026-03-05 10:30:00', '2026-03-12', 'sent', 'ETB', 35050.00, 5257.50, 40307.50),
-- Urgent flow POs (From Emergency Requisition)
(30003, 'tenant_default', 10004, 5, 'Highland Construction Materials', 'PO-2026-003', '2026-02-11 08:15:00', '2026-02-15', 'acknowledged', 'ETB', 846500.00, 126975.00, 973475.00),
-- Edge Case Flow: Partially received, delayed, and cancelled POs
(30004, 'tenant_default', 10001, 4, 'Chamo Lake Fisheries & Feed', 'PO-2026-004', '2026-03-02 11:00:00', '2026-03-15', 'partially_received', 'ETB', 66000.00, 9900.00, 75900.00),
(30005, 'tenant_default', 10006, 2, 'Abay Manufacturing Enterprise', 'PO-2026-005', '2026-02-20 14:00:00', '2026-02-28', 'draft', 'ETB', 1950000.00, 292500.00, 2242500.00);

-- ============================================================================
-- 9. PURCHASE ORDER ITEMS (IDs: 40000 - 50000)
-- Schema matches: purchase_order_items (po_id, line_number, requisition_item_id, product_id, quantity_ordered, quantity_received, unit_price, unit_of_measure, product_name)
-- Note: total_price is GENERATED column (quantity_ordered * unit_price)
-- ============================================================================
INSERT INTO purchase_order_items (id, po_id, line_number, requisition_item_id, product_id, quantity_ordered, quantity_received, unit_price, unit_of_measure, product_name) VALUES
-- PO 30001 (Completed)
(40001, 30001, 1, 20001, 1001, 10, 10, 4500.00, 'BAG', 'High-Yield Teff Seed (50kg)'),
(40002, 30001, 2, 20002, 1002, 10, 10, 2100.00, 'BAG', 'Organic Fertilizer Compound (25kg)'),
-- PO 30002 (Sent)
(40003, 30002, 1, 20003, 1003, 50, 0, 650.00, 'KG', 'Premium Processed Beef Quarters'),
(40004, 30002, 2, 20004, 1004, 3, 0, 850.00, 'BOTTLE', 'Refined Sunflower Oil (5L)'),
-- PO 30003 (Emergency - Acknowledged)
(40005, 30003, 1, 20007, 1006, 10, 0, 78000.00, 'TON', 'Reinforced Deformed Steel Bar (12mm)'),
(40006, 30003, 2, 20008, 1005, 70, 0, 950.00, 'BAG', 'Portland Cement OPC (Grade 42.5N)'),
-- PO 30004 (Edge case: Partially Received)
(40008, 30004, 1, 20001, 1001, 10, 10, 4500.00, 'BAG', 'High-Yield Teff Seed (50kg)'),
(40009, 30004, 2, 20002, 1002, 10, 4, 2100.00, 'BAG', 'Organic Fertilizer Compound (25kg)');

-- ============================================================================
-- 10. APPROVAL WORKFLOW INSTANCES (IDs: 50000 - 60000)
-- Schema matches: approval_workflow_instances (tenant_id, configuration_id, workflow_type, reference_type, reference_id, current_stage, status, initiator_id, initiator_name, started_at, completed_at)
-- ============================================================================
INSERT INTO approval_workflow_instances (id, tenant_id, configuration_id, workflow_type, reference_type, reference_id, current_stage, status, initiator_id, initiator_name, started_at, completed_at) VALUES
(50001, 'tenant_default', 10, 'purchase_requisition', 'purchase_requisition', '10001', 3, 'approved', 'Abebe Kebede', 'Abebe Kebede', '2026-03-01 09:00:00', '2026-03-03 14:20:00'),
(50002, 'tenant_default', 10, 'purchase_requisition', 'purchase_requisition', '10002', 3, 'approved', 'Marta Demeke', 'Marta Demeke', '2026-03-02 10:30:00', '2026-03-04 11:15:00'),
(50003, 'tenant_default', 10, 'purchase_requisition', 'purchase_requisition', '10003', 2, 'in_progress', 'Yonas Alemu', 'Yonas Alemu', '2026-03-10 14:00:00', NULL),
(50004, 'tenant_default', 10, 'purchase_requisition', 'purchase_requisition', '10004', 3, 'approved', 'Tewodros Assefa', 'Tewodros Assefa', '2026-02-08 08:15:00', '2026-02-09 17:45:00'),
(50005, 'tenant_default', 10, 'purchase_requisition', 'purchase_requisition', '10005', 1, 'in_progress', 'Selam Tesfaye', 'Selam Tesfaye', '2026-03-14 11:00:00', NULL),
(50006, 'tenant_default', 10, 'purchase_requisition', 'purchase_requisition', '10006', 2, 'rejected', 'Tewodros Assefa', 'Tewodros Assefa', '2026-02-12 13:00:00', '2026-02-13 16:00:00');

-- ============================================================================
-- 11. APPROVAL WORKFLOW ACTIONS (IDs: 60000 - 70000)
-- Schema matches: approval_workflow_actions (instance_id, stage_number, action_type, actor_id, actor_name, action_timestamp, comments)
-- ============================================================================
INSERT INTO approval_workflow_actions (id, instance_id, stage_number, action_type, actor_id, actor_name, action_timestamp, comments) VALUES
(60001, 50001, 1, 'APPROVE', 'USR-009', 'Tadesse Hailu', '2026-03-01 16:30:00', 'Items valid for Q1 demonstration farm target.'),
(60002, 50001, 2, 'APPROVE', 'USR-012', 'Sara Girma', '2026-03-02 11:00:00', 'Budget allocation cleared under category 2001.'),
(60003, 50001, 3, 'APPROVE', 'USR-001', 'Elias Zerihun', '2026-03-03 14:20:00', 'Approved. Proceed to order.'),
(60004, 50002, 1, 'APPROVE', 'USR-009', 'Tadesse Hailu', '2026-03-02 15:45:00', 'Food processing materials verified.'),
(60005, 50002, 2, 'APPROVE', 'USR-012', 'Sara Girma', '2026-03-03 10:10:00', 'Budget cleared.'),
(60006, 50002, 3, 'APPROVE', 'USR-001', 'Elias Zerihun', '2026-03-04 11:15:00', 'Confirmed execution permission.'),
(60007, 50003, 1, 'APPROVE', 'USR-014', 'Hiwot Wolde', '2026-03-11 09:30:00', 'Tech requirements justified.'),
(60008, 50004, 1, 'APPROVE', 'USR-020', 'Kassahun Bekele', '2026-02-08 11:00:00', 'CRITICAL structural risk detected at site. Expediting.'),
(60009, 50004, 2, 'APPROVE', 'USR-012', 'Sara Girma', '2026-02-09 10:30:00', 'Emergency funds allocated. Budget category 2041 modified.'),
(60010, 50004, 3, 'APPROVE', 'USR-001', 'Elias Zerihun', '2026-02-09 17:45:00', 'Urgent structural bypass authorized. Issue immediate PO.'),
(60011, 50006, 1, 'APPROVE', 'USR-020', 'Kassahun Bekele', '2026-02-12 15:00:00', 'Forwarding to finance to evaluate limits.'),
(60012, 50006, 2, 'REJECT', 'USR-012', 'Sara Girma', '2026-02-13 16:00:00', 'REJECTED: Order total creates critical budget overrun for Category 2041 in Q1.');

COMMIT;