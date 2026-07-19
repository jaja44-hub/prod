-- Phase 4: Journal Entries from Phase 1-3 Transactions
BEGIN;

-- Add missing description columns if they don't exist
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE journal_entry_lines ADD COLUMN IF NOT EXISTS description TEXT;

-- Journal Entry for PO 30001 (Purchase Order)
INSERT INTO journal_entries (id, tenant_id, entry_number, entry_date, entry_type, reference_type, reference_id, description, total_debit, total_credit) VALUES
(80001, 'tenant_default', 'JE-2026-001', '2026-02-15', 'PURCHASE_ORDER', 'purchase_order', 30001, 'Purchase Order 30001 - Agricultural Supplies', 66000.00, 66000.00);

INSERT INTO journal_entry_lines (id, tenant_id, journal_entry_id, line_number, account_id, debit_amount, credit_amount, description) VALUES
(90001, 'tenant_default', 80001, 1, 24, 66000.00, 0.00, 'Purchases - Agricultural Supplies'),
(90002, 'tenant_default', 80001, 2, 12, 0.00, 66000.00, 'Accounts Payable - Sheger Agro Industrial PLC');

-- Journal Entry for PO 30002 (Purchase Order)
INSERT INTO journal_entries (id, tenant_id, entry_number, entry_date, entry_type, reference_type, reference_id, description, total_debit, total_credit) VALUES
(80002, 'tenant_default', 'JE-2026-002', '2026-02-18', 'PURCHASE_ORDER', 'purchase_order', 30002, 'Purchase Order 30002 - Food Products', 35050.00, 35050.00);

INSERT INTO journal_entry_lines (id, tenant_id, journal_entry_id, line_number, account_id, debit_amount, credit_amount, description) VALUES
(90003, 'tenant_default', 80002, 1, 24, 35050.00, 0.00, 'Purchases - Food Products'),
(90004, 'tenant_default', 80002, 2, 12, 0.00, 35050.00, 'Accounts Payable - Chamo Lake Fisheries & Feed');

-- Journal Entry for PO 30003 (Emergency Construction)
INSERT INTO journal_entries (id, tenant_id, entry_number, entry_date, entry_type, reference_type, reference_id, description, total_debit, total_credit) VALUES
(80003, 'tenant_default', 'JE-2026-003', '2026-02-10', 'PURCHASE_ORDER', 'purchase_order', 30003, 'Purchase Order 30003 - Emergency Construction Materials', 846500.00, 846500.00);

INSERT INTO journal_entry_lines (id, tenant_id, journal_entry_id, line_number, account_id, debit_amount, credit_amount, description) VALUES
(90005, 'tenant_default', 80003, 1, 24, 846500.00, 0.00, 'Purchases - Construction Materials'),
(90006, 'tenant_default', 80003, 2, 12, 0.00, 846500.00, 'Accounts Payable - Highland Construction Materials');

-- Journal Entry for Warehouse Receipt 50001 (Inventory Receipt)
INSERT INTO journal_entries (id, tenant_id, entry_number, entry_date, entry_type, reference_type, reference_id, description, total_debit, total_credit) VALUES
(80004, 'tenant_default', 'JE-2026-004', '2026-03-01', 'WAREHOUSE_RECEIPT', 'warehouse_receipt', 50001, 'Warehouse Receipt 50001 - Agricultural Supplies Received', 66000.00, 66000.00);

INSERT INTO journal_entry_lines (id, tenant_id, journal_entry_id, line_number, account_id, debit_amount, credit_amount, description) VALUES
(90007, 'tenant_default', 80004, 1, 7, 66000.00, 0.00, 'Inventory - Agricultural Supplies'),
(90008, 'tenant_default', 80004, 2, 24, 0.00, 66000.00, 'Purchases - Agricultural Supplies (COGS Recognition)');

-- Journal Entry for Warehouse Receipt 50002 (Inventory Receipt)
INSERT INTO journal_entries (id, tenant_id, entry_number, entry_date, entry_type, reference_type, reference_id, description, total_debit, total_credit) VALUES
(80005, 'tenant_default', 'JE-2026-005', '2026-03-05', 'WAREHOUSE_RECEIPT', 'warehouse_receipt', 50002, 'Warehouse Receipt 50002 - Food Products Received', 35050.00, 35050.00);

INSERT INTO journal_entry_lines (id, tenant_id, journal_entry_id, line_number, account_id, debit_amount, credit_amount, description) VALUES
(90009, 'tenant_default', 80005, 1, 7, 35050.00, 0.00, 'Inventory - Food Products'),
(90010, 'tenant_default', 80005, 2, 24, 0.00, 35050.00, 'Purchases - Food Products (COGS Recognition)');

-- Journal Entry for Warehouse Receipt 50003 (Emergency Construction)
INSERT INTO journal_entries (id, tenant_id, entry_number, entry_date, entry_type, reference_type, reference_id, description, total_debit, total_credit) VALUES
(80006, 'tenant_default', 'JE-2026-006', '2026-02-11', 'WAREHOUSE_RECEIPT', 'warehouse_receipt', 50003, 'Warehouse Receipt 50003 - Emergency Construction Materials Received', 846500.00, 846500.00);

INSERT INTO journal_entry_lines (id, tenant_id, journal_entry_id, line_number, account_id, debit_amount, credit_amount, description) VALUES
(90011, 'tenant_default', 80006, 1, 7, 846500.00, 0.00, 'Inventory - Construction Materials'),
(90012, 'tenant_default', 80006, 2, 24, 0.00, 846500.00, 'Purchases - Construction Materials (COGS Recognition)');

-- Journal Entry for PO 30006 (Office Furniture)
INSERT INTO journal_entries (id, tenant_id, entry_number, entry_date, entry_type, reference_type, reference_id, description, total_debit, total_credit) VALUES
(80007, 'tenant_default', 'JE-2026-007', '2026-02-20', 'PURCHASE_ORDER', 'purchase_order', 30006, 'Purchase Order 30006 - Office Furniture', 45000.00, 45000.00);

INSERT INTO journal_entry_lines (id, tenant_id, journal_entry_id, line_number, account_id, debit_amount, credit_amount, description) VALUES
(90013, 'tenant_default', 80007, 1, 23, 45000.00, 0.00, 'Operating Expenses - Office Furniture'),
(90014, 'tenant_default', 80007, 2, 12, 0.00, 45000.00, 'Accounts Payable - Abay Manufacturing Enterprise');

-- Journal Entry for Warehouse Receipt 50005 (Office Furniture Received)
INSERT INTO journal_entries (id, tenant_id, entry_number, entry_date, entry_type, reference_type, reference_id, description, total_debit, total_credit) VALUES
(80008, 'tenant_default', 'JE-2026-008', '2026-02-25', 'WAREHOUSE_RECEIPT', 'warehouse_receipt', 50005, 'Warehouse Receipt 50005 - Office Furniture Received', 45000.00, 45000.00);

INSERT INTO journal_entry_lines (id, tenant_id, journal_entry_id, line_number, account_id, debit_amount, credit_amount, description) VALUES
(90015, 'tenant_default', 80008, 1, 9, 45000.00, 0.00, 'Property, Plant and Equipment - Office Furniture'),
(90016, 'tenant_default', 80008, 2, 23, 0.00, 45000.00, 'Operating Expenses - Office Furniture (Capitalization)');

COMMIT;
