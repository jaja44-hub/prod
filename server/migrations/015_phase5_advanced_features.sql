-- Phase 5: Advanced Features
BEGIN;

CREATE TABLE IF NOT EXISTS vat_returns (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  return_period VARCHAR(20) NOT NULL,
  output_vat DECIMAL(18,2) DEFAULT 0.00,
  input_vat DECIMAL(18,2) DEFAULT 0.00,
  status VARCHAR(20) DEFAULT 'draft',
  UNIQUE(tenant_id, return_period)
);

CREATE TABLE IF NOT EXISTS paye_calculations (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  employee_id VARCHAR(255) NOT NULL,
  tax_period VARCHAR(20) NOT NULL,
  gross_income DECIMAL(18,2) NOT NULL,
  paye_amount DECIMAL(18,2) NOT NULL,
  UNIQUE(tenant_id, employee_id, tax_period)
);

CREATE TABLE IF NOT EXISTS supplier_performance (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  supplier_id INTEGER NOT NULL,
  total_orders INTEGER DEFAULT 0,
  on_time_rate DECIMAL(5,4) DEFAULT 0.00,
  overall_rating DECIMAL(5,2) DEFAULT 0.00
);

INSERT INTO vat_returns (tenant_id, return_period, output_vat, input_vat, status) VALUES
('tenant_default', '2026-02', 0.00, 133725.00, 'pending');

INSERT INTO supplier_performance (tenant_id, supplier_id, total_orders, on_time_rate, overall_rating) VALUES
('tenant_default', 1, 3, 0.67, 4.2),
('tenant_default', 2, 2, 1.00, 4.5),
('tenant_default', 5, 2, 0.50, 3.8);

COMMIT;
