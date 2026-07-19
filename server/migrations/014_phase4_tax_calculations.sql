-- Phase 4: Tax Calculations (VAT, Withholding, ESIC-based)
BEGIN;

-- Tax Configuration Table
CREATE TABLE IF NOT EXISTS tax_configuration (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  tax_type VARCHAR(50) NOT NULL,
  tax_code VARCHAR(20) NOT NULL,
  tax_name VARCHAR(255) NOT NULL,
  tax_rate DECIMAL(5,4) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  effective_from DATE,
  effective_to DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, tax_code)
);

-- ESIC Category Tax Mapping Table
CREATE TABLE IF NOT EXISTS esic_category_tax_mapping (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  category_id INTEGER NOT NULL REFERENCES esic_categories(id),
  tax_type VARCHAR(50) NOT NULL,
  tax_rate DECIMAL(5,4) NOT NULL,
  is_exempt BOOLEAN DEFAULT FALSE,
  exemption_reason TEXT,
  effective_from DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, category_id, tax_type)
);

-- Seed Tax Configuration ( ethiopian tax rates)
INSERT INTO tax_configuration (id, tenant_id, tax_type, tax_code, tax_name, tax_rate, effective_from) VALUES
(1, 'tenant_default', 'VAT', 'VAT-15', 'Value Added Tax (Standard)', 0.1500, '2026-01-01'),
(2, 'tenant_default', 'VAT', 'VAT-0', 'Value Added Tax (Zero Rated)', 0.0000, '2026-01-01'),
(3, 'tenant_default', 'VAT', 'VAT-EX', 'Value Added Tax (Exempt)', 0.0000, '2026-01-01'),
(4, 'tenant_default', 'WITHHOLDING', 'WHT-2', 'Withholding Tax (2%)', 0.0200, '2026-01-01'),
(5, 'tenant_default', 'WITHHOLDING', 'WHT-5', 'Withholding Tax (5%)', 0.0500, '2026-01-01'),
(6, 'tenant_default', 'WITHHOLDING', 'WHT-10', 'Withholding Tax (10%)', 0.1000, '2026-01-01');

-- Seed ESIC Category Tax Mapping (based on Ethiopian tax regulations)
INSERT INTO esic_category_tax_mapping (id, tenant_id, category_id, tax_type, tax_rate, is_exempt, effective_from) VALUES
-- Agriculture (2001) - VAT exempt for agricultural products
(1, 'tenant_default', 2001, 'VAT', 0.0000, TRUE, 'Agricultural products exempt from VAT', '2026-01-01'),
(2, 'tenant_default', 2001, 'WITHHOLDING', 0.0200, FALSE, '2% withholding on agricultural supplies', '2026-01-01'),
-- Food Products (2010) - VAT exempt for basic food items
(3, 'tenant_default', 2010, 'VAT', 0.0000, TRUE, 'Basic food items exempt from VAT', '2026-01-01'),
(4, 'tenant_default', 2010, 'WITHHOLDING', 0.0200, FALSE, '2% withholding on food products', '2026-01-01'),
-- Construction Materials (2041) - Standard VAT
(5, 'tenant_default', 2041, 'VAT', 0.1500, FALSE, '15% VAT on construction materials', '2026-01-01'),
(6, 'tenant_default', 2041, 'WITHHOLDING', 0.0500, FALSE, '5% withholding on construction services', '2026-01-01'),
-- IT Equipment (2062) - Standard VAT
(7, 'tenant_default', 2062, 'VAT', 0.1500, FALSE, '15% VAT on IT equipment', '2026-01-01'),
(8, 'tenant_default', 2062, 'WITHHOLDING', 0.0200, FALSE, '2% withholding on IT equipment', '2026-01-01'),
-- Office Supplies (2001) - Standard VAT
(9, 'tenant_default', 2003, 'VAT', 0.1500, FALSE, '15% VAT on office supplies', '2026-01-01'),
(10, 'tenant_default', 2003, 'WITHHOLDING', 0.0200, FALSE, '2% withholding on office supplies', '2026-01-01');

-- Tax Liability Tracking Table
DROP TABLE IF EXISTS tax_liability CASCADE;

CREATE TABLE tax_liability (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  tax_type VARCHAR(50) NOT NULL,
  tax_period VARCHAR(20) NOT NULL,
  tax_amount DECIMAL(18,2) NOT NULL,
  due_date DATE,
  status VARCHAR(20) DEFAULT 'pending',
  reference_type VARCHAR(50),
  reference_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Tax Liability Records from Financial Documents
INSERT INTO tax_liability (tenant_id, tax_type, tax_period, tax_amount, due_date, status, reference_type, reference_id) VALUES
-- VAT Liability from PO 30001 (Agricultural - Exempt)
('tenant_default', 'VAT', '2026-02', 0.00, '2026-03-15', 'settled', 'financial_document', 100001),
-- VAT Liability from PO 30002 (Food - Exempt)
('tenant_default', 'VAT', '2026-02', 0.00, '2026-03-15', 'settled', 'financial_document', 100002),
-- VAT Liability from PO 30003 (Construction - 15%)
('tenant_default', 'VAT', '2026-02', 126975.00, '2026-03-15', 'pending', 'financial_document', 100003),
-- VAT Liability from PO 30006 (Office Supplies - 15%)
('tenant_default', 'VAT', '2026-02', 6750.00, '2026-03-15', 'pending', 'financial_document', 100004),
-- Withholding Tax Liability from Payment Vouchers
('tenant_default', 'WITHHOLDING', '2026-02', 3795.00, '2026-03-15', 'pending', 'financial_document', 100009),
('tenant_default', 'WITHHOLDING', '2026-03', 2015.38, '2026-04-15', 'pending', 'financial_document', 100010),
('tenant_default', 'WITHHOLDING', '2026-02', 48673.75, '2026-03-15', 'pending', 'financial_document', 100011);

COMMIT;
