-- Phase 4: Financial Documents Generation
BEGIN;

-- Financial Documents Table
CREATE TABLE IF NOT EXISTS financial_documents (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  document_number VARCHAR(50) NOT NULL,
  document_type VARCHAR(50) NOT NULL,
  document_date DATE NOT NULL,
  reference_type VARCHAR(50),
  reference_id INTEGER,
  counterparty_id INTEGER,
  counterparty_name VARCHAR(255),
  counterparty_type VARCHAR(50),
  currency VARCHAR(10) DEFAULT 'ETB',
  subtotal DECIMAL(18,2) DEFAULT 0.00,
  vat_amount DECIMAL(18,2) DEFAULT 0.00,
  withholding_tax_amount DECIMAL(18,2) DEFAULT 0.00,
  total_amount DECIMAL(18,2) DEFAULT 0.00,
  status VARCHAR(20) DEFAULT 'draft',
  notes TEXT,
  created_by VARCHAR(255),
  created_by_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, document_number)
);

-- Generate Purchase Order Documents
INSERT INTO financial_documents (id, tenant_id, document_number, document_type, document_date, reference_type, reference_id, counterparty_id, counterparty_name, counterparty_type, currency, subtotal, vat_amount, total_amount, status, created_by, created_by_name) VALUES
(100001, 'tenant_default', 'PO-DOC-2026-001', 'PURCHASE_ORDER', '2026-02-15', 'purchase_order', 30001, 1, 'Sheger Agro Industrial PLC', 'SUPPLIER', 'ETB', 66000.00, 9900.00, 75900.00, 'posted', 'Abebe Kebede', 'Abebe Kebede'),
(100002, 'tenant_default', 'PO-DOC-2026-002', 'PURCHASE_ORDER', '2026-02-18', 'purchase_order', 30002, 4, 'Chamo Lake Fisheries & Feed', 'SUPPLIER', 'ETB', 35050.00, 5257.50, 40307.50, 'posted', 'Abebe Kebede', 'Abebe Kebede'),
(100003, 'tenant_default', 'PO-DOC-2026-003', 'PURCHASE_ORDER', '2026-02-10', 'purchase_order', 30003, 5, 'Highland Construction Materials', 'SUPPLIER', 'ETB', 846500.00, 126975.00, 973475.00, 'posted', 'Tewodros Assefa', 'Tewodros Assefa'),
(100004, 'tenant_default', 'PO-DOC-2026-006', 'PURCHASE_ORDER', '2026-02-20', 'purchase_order', 30006, 2, 'Abay Manufacturing Enterprise', 'SUPPLIER', 'ETB', 45000.00, 6750.00, 51750.00, 'posted', 'Kassahun Bekele', 'Kassahun Bekele');

-- Generate Warehouse Receipt Documents
INSERT INTO financial_documents (id, tenant_id, document_number, document_type, document_date, reference_type, reference_id, counterparty_id, counterparty_name, counterparty_type, currency, subtotal, vat_amount, total_amount, status, created_by, created_by_name) VALUES
(100005, 'tenant_default', 'WR-DOC-2026-001', 'WAREHOUSE_RECEIPT', '2026-03-01', 'warehouse_receipt', 50001, 1, 'Sheger Agro Industrial PLC', 'SUPPLIER', 'ETB', 66000.00, 9900.00, 75900.00, 'posted', 'Dawit Haile', 'Dawit Haile'),
(100006, 'tenant_default', 'WR-DOC-2026-002', 'WAREHOUSE_RECEIPT', '2026-03-05', 'warehouse_receipt', 50002, 4, 'Chamo Lake Fisheries & Feed', 'SUPPLIER', 'ETB', 35050.00, 5257.50, 40307.50, 'posted', 'Sara Mengistu', 'Sara Mengistu'),
(100007, 'tenant_default', 'WR-DOC-2026-003', 'WAREHOUSE_RECEIPT', '2026-02-11', 'warehouse_receipt', 50003, 5, 'Highland Construction Materials', 'SUPPLIER', 'ETB', 846500.00, 126975.00, 973475.00, 'posted', 'Gebre Mariam', 'Gebre Mariam'),
(100008, 'tenant_default', 'WR-DOC-2026-005', 'WAREHOUSE_RECEIPT', '2026-02-25', 'warehouse_receipt', 50005, 2, 'Abay Manufacturing Enterprise', 'SUPPLIER', 'ETB', 45000.00, 6750.00, 51750.00, 'posted', 'Dawit Haile', 'Dawit Haile');

-- Generate Payment Vouchers
INSERT INTO financial_documents (id, tenant_id, document_number, document_type, document_date, reference_type, reference_id, counterparty_id, counterparty_name, counterparty_type, currency, subtotal, withholding_tax_amount, total_amount, status, created_by, created_by_name) VALUES
(100009, 'tenant_default', 'PV-DOC-2026-001', 'PAYMENT_VOUCHER', '2026-02-28', 'purchase_order', 30001, 1, 'Sheger Agro Industrial PLC', 'SUPPLIER', 'ETB', 75900.00, 3795.00, 72105.00, 'posted', 'Sara Girma', 'Sara Girma'),
(100010, 'tenant_default', 'PV-DOC-2026-002', 'PAYMENT_VOUCHER', '2026-03-07', 'purchase_order', 30002, 4, 'Chamo Lake Fisheries & Feed', 'SUPPLIER', 'ETB', 40307.50, 2015.38, 38292.12, 'posted', 'Sara Girma', 'Sara Girma'),
(100011, 'tenant_default', 'PV-DOC-2026-003', 'PAYMENT_VOUCHER', '2026-02-15', 'purchase_order', 30003, 5, 'Highland Construction Materials', 'SUPPLIER', 'ETB', 973475.00, 48673.75, 924801.25, 'posted', 'Sara Girma', 'Sara Girma');

COMMIT;
