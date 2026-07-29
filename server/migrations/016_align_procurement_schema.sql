-- Phase 16: Align procurement database with the full purchase module schema
-- This migration updates the existing minimal procurement DB schema, adds missing tables,
-- and creates the core reference data needed by the purchase and warehouse APIs.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Core reference tables
CREATE TABLE IF NOT EXISTS esic_categories (
  id SERIAL PRIMARY KEY,
  code VARCHAR(5) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  parent_id INTEGER REFERENCES esic_categories(id),
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 5),
  description TEXT,
  tax_applicable BOOLEAN DEFAULT TRUE,
  vat_rate DECIMAL(5,4) DEFAULT 0.1500,
  vat_exempt BOOLEAN DEFAULT FALSE,
  withholding_applicable BOOLEAN DEFAULT FALSE,
  withholding_rate DECIMAL(5,4) DEFAULT 0.0000,
  excise_applicable BOOLEAN DEFAULT FALSE,
  excise_rate DECIMAL(5,4) DEFAULT 0.0000,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_esic_categories_code ON esic_categories(code);
CREATE INDEX IF NOT EXISTS idx_esic_categories_parent ON esic_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_esic_categories_level ON esic_categories(level);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  sku VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id INTEGER REFERENCES esic_categories(id),
  unit_of_measure VARCHAR(20) NOT NULL,
  cost_price DECIMAL(18,2) DEFAULT 0.00,
  selling_price DECIMAL(18,2) DEFAULT 0.00,
  weight DECIMAL(10,3),
  volume DECIMAL(10,3),
  barcode VARCHAR(50),
  manufacturer VARCHAR(255),
  brand VARCHAR(100),
  model VARCHAR(100),
  reorder_level DECIMAL(18,2) DEFAULT 0.00,
  lead_time_days INTEGER DEFAULT 0,
  shelf_life_days INTEGER,
  storage_requirements TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, sku)
);

CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);

CREATE TABLE IF NOT EXISTS budgets (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  budget_code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  category_id INTEGER REFERENCES esic_categories(id),
  fiscal_year INTEGER NOT NULL,
  fiscal_period VARCHAR(20) NOT NULL,
  department_id VARCHAR(50),
  cost_center_id VARCHAR(50),
  project_id VARCHAR(50),
  budgeted_amount DECIMAL(18,2) NOT NULL,
  allocated_amount DECIMAL(18,2) DEFAULT 0.00,
  committed_amount DECIMAL(18,2) DEFAULT 0.00,
  actual_amount DECIMAL(18,2) DEFAULT 0.00,
  available_amount DECIMAL(18,2) GENERATED ALWAYS AS (budgeted_amount - committed_amount - actual_amount) STORED,
  currency VARCHAR(3) DEFAULT 'ETB',
  status VARCHAR(20) DEFAULT 'active',
  approved_by VARCHAR(255),
  approved_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, budget_code, fiscal_year, fiscal_period)
);

CREATE INDEX IF NOT EXISTS idx_budgets_tenant ON budgets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_fiscal_year ON budgets(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON budgets(status);

CREATE TABLE IF NOT EXISTS approval_workflow_configurations (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  workflow_type VARCHAR(50) NOT NULL,
  workflow_name VARCHAR(255) NOT NULL,
  description TEXT,
  total_stages INTEGER NOT NULL DEFAULT 1,
  auto_approve_under_amount DECIMAL(18,2),
  require_attachment BOOLEAN DEFAULT FALSE,
  require_budget_check BOOLEAN DEFAULT TRUE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, workflow_type)
);

CREATE INDEX IF NOT EXISTS idx_approval_config_tenant ON approval_workflow_configurations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_approval_config_type ON approval_workflow_configurations(workflow_type);

CREATE TABLE IF NOT EXISTS approval_workflow_stages (
  id SERIAL PRIMARY KEY,
  configuration_id INTEGER NOT NULL REFERENCES approval_workflow_configurations(id),
  stage_number INTEGER NOT NULL,
  stage_name VARCHAR(100) NOT NULL,
  approval_role VARCHAR(50) NOT NULL,
  approver_id VARCHAR(255),
  approval_required BOOLEAN DEFAULT TRUE,
  can_delegate BOOLEAN DEFAULT TRUE,
  timeout_hours INTEGER DEFAULT 72,
  auto_approve BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(configuration_id, stage_number)
);

CREATE INDEX IF NOT EXISTS idx_approval_stages_config ON approval_workflow_stages(configuration_id);

CREATE TABLE IF NOT EXISTS approval_workflow_instances (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  configuration_id INTEGER REFERENCES approval_workflow_configurations(id),
  workflow_type VARCHAR(50) NOT NULL,
  reference_type VARCHAR(50) NOT NULL,
  reference_id VARCHAR(255) NOT NULL,
  current_stage INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(20) DEFAULT 'pending',
  initiator_id VARCHAR(255) NOT NULL,
  initiator_name VARCHAR(255) NOT NULL,
  amount DECIMAL(18,2),
  currency VARCHAR(3) DEFAULT 'ETB',
  description TEXT,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  notes TEXT,
  UNIQUE(tenant_id, reference_type, reference_id)
);

CREATE INDEX IF NOT EXISTS idx_approval_instances_tenant ON approval_workflow_instances(tenant_id);
CREATE INDEX IF NOT EXISTS idx_approval_instances_reference ON approval_workflow_instances(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_approval_instances_status ON approval_workflow_instances(status);

CREATE TABLE IF NOT EXISTS approval_workflow_actions (
  id SERIAL PRIMARY KEY,
  instance_id INTEGER NOT NULL REFERENCES approval_workflow_instances(id),
  stage_number INTEGER NOT NULL,
  action_type VARCHAR(20) NOT NULL,
  actor_id VARCHAR(255) NOT NULL,
  actor_name VARCHAR(255) NOT NULL,
  actor_role VARCHAR(50),
  comments TEXT,
  attachment_url VARCHAR(255),
  action_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  delegated_from_id VARCHAR(255),
  delegated_from_name VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_approval_actions_instance ON approval_workflow_actions(instance_id);

-- Purchase module schema additions and alignments
CREATE TABLE IF NOT EXISTS purchase_requisition_items (
  id SERIAL PRIMARY KEY,
  requisition_id INTEGER NOT NULL REFERENCES purchase_requisitions(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  product_id INTEGER REFERENCES products(id),
  product_name VARCHAR(255) NOT NULL,
  product_description TEXT,
  category_id INTEGER REFERENCES esic_categories(id),
  quantity DECIMAL(18,2) NOT NULL,
  unit_of_measure VARCHAR(20) NOT NULL,
  unit_price DECIMAL(18,2) DEFAULT 0.00,
  total_price DECIMAL(18,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  currency VARCHAR(3) DEFAULT 'ETB',
  estimated_delivery_date DATE,
  specification TEXT,
  preferred_supplier_id INTEGER REFERENCES suppliers(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(requisition_id, line_number)
);

CREATE INDEX IF NOT EXISTS idx_requisition_items_requisition ON purchase_requisition_items(requisition_id);
CREATE INDEX IF NOT EXISTS idx_requisition_items_product ON purchase_requisition_items(product_id);
CREATE INDEX IF NOT EXISTS idx_requisition_items_category ON purchase_requisition_items(category_id);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  po_number VARCHAR(50) NOT NULL,
  po_date DATE NOT NULL DEFAULT CURRENT_DATE,
  requisition_id INTEGER REFERENCES purchase_requisitions(id),
  supplier_id INTEGER REFERENCES suppliers(id),
  supplier_name VARCHAR(255),
  supplier_address TEXT,
  supplier_contact VARCHAR(255),
  supplier_phone VARCHAR(20),
  supplier_email VARCHAR(255),
  category_id INTEGER REFERENCES esic_categories(id),
  payment_terms INTEGER DEFAULT 30,
  delivery_terms TEXT,
  shipping_method VARCHAR(50),
  shipping_address TEXT,
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  subtotal DECIMAL(18,2) DEFAULT 0.00,
  vat_amount DECIMAL(18,2) DEFAULT 0.00,
  vat_rate DECIMAL(5,4) DEFAULT 0.1500,
  withholding_tax_amount DECIMAL(18,2) DEFAULT 0.00,
  withholding_tax_rate DECIMAL(5,4) DEFAULT 0.0000,
  total_amount DECIMAL(18,2) DEFAULT 0.00,
  currency VARCHAR(3) DEFAULT 'ETB',
  status VARCHAR(20) DEFAULT 'draft',
  workflow_instance_id INTEGER REFERENCES approval_workflow_instances(id),
  approved_by VARCHAR(255),
  approved_by_name VARCHAR(255),
  approved_at TIMESTAMP,
  sent_to_supplier BOOLEAN DEFAULT false,
  sent_at TIMESTAMP,
  supplier_acknowledged BOOLEAN DEFAULT false,
  supplier_acknowledged_at TIMESTAMP,
  notes TEXT,
  internal_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, po_number)
);


CREATE TABLE IF NOT EXISTS purchase_order_items (
  id SERIAL PRIMARY KEY,
  po_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  requisition_item_id INTEGER REFERENCES purchase_requisition_items(id),
  product_id INTEGER REFERENCES products(id),
  product_name VARCHAR(255) NOT NULL,
  product_description TEXT,
  category_id INTEGER REFERENCES esic_categories(id),
  quantity_ordered DECIMAL(18,2) NOT NULL,
  quantity_received DECIMAL(18,2) DEFAULT 0.00,
  quantity_pending DECIMAL(18,2) GENERATED ALWAYS AS (quantity_ordered - quantity_received) STORED,
  unit_of_measure VARCHAR(20) NOT NULL,
  unit_price DECIMAL(18,2) NOT NULL,
  total_price DECIMAL(18,2) GENERATED ALWAYS AS (quantity_ordered * unit_price) STORED,
  currency VARCHAR(3) DEFAULT 'ETB',
  vat_rate DECIMAL(5,4) DEFAULT 0.1500,
  vat_amount DECIMAL(18,2) GENERATED ALWAYS AS ((quantity_ordered * unit_price) * vat_rate) STORED,
  withholding_tax_rate DECIMAL(5,4) DEFAULT 0.0000,
  withholding_tax_amount DECIMAL(18,2) GENERATED ALWAYS AS ((quantity_ordered * unit_price) * withholding_tax_rate) STORED,
  line_total DECIMAL(18,2) GENERATED ALWAYS AS ((quantity_ordered * unit_price) + ((quantity_ordered * unit_price) * vat_rate) - ((quantity_ordered * unit_price) * withholding_tax_rate)) STORED,
  expected_delivery_date DATE,
  specification TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(po_id, line_number)
);

CREATE INDEX IF NOT EXISTS idx_po_items_po ON purchase_order_items(po_id);
CREATE INDEX IF NOT EXISTS idx_po_items_product ON purchase_order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_po_items_requisition_item ON purchase_order_items(requisition_item_id);
CREATE INDEX IF NOT EXISTS idx_po_items_category ON purchase_order_items(category_id);

CREATE TABLE IF NOT EXISTS supplier_quotations (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  quotation_number VARCHAR(50) NOT NULL,
  quotation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  requisition_id INTEGER REFERENCES purchase_requisitions(id),
  supplier_id INTEGER REFERENCES suppliers(id),
  supplier_name VARCHAR(255) NOT NULL,
  valid_until DATE,
  quotation_status VARCHAR(20) DEFAULT 'received',
  subtotal DECIMAL(18,2) DEFAULT 0.00,
  vat_amount DECIMAL(18,2) DEFAULT 0.00,
  vat_rate DECIMAL(5,4) DEFAULT 0.1500,
  total_amount DECIMAL(18,2) DEFAULT 0.00,
  currency VARCHAR(3) DEFAULT 'ETB',
  payment_terms INTEGER DEFAULT 30,
  delivery_terms TEXT,
  notes TEXT,
  received_by VARCHAR(255),
  received_by_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, quotation_number)
);

CREATE INDEX IF NOT EXISTS idx_supplier_quotations_tenant ON supplier_quotations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_supplier_quotations_number ON supplier_quotations(quotation_number);
CREATE INDEX IF NOT EXISTS idx_supplier_quotations_supplier ON supplier_quotations(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_quotations_requisition ON supplier_quotations(requisition_id);

CREATE TABLE IF NOT EXISTS supplier_quotation_items (
  id SERIAL PRIMARY KEY,
  quotation_id INTEGER NOT NULL REFERENCES supplier_quotations(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  requisition_item_id INTEGER REFERENCES purchase_requisition_items(id),
  product_id INTEGER REFERENCES products(id),
  product_name VARCHAR(255) NOT NULL,
  category_id INTEGER REFERENCES esic_categories(id),
  quantity DECIMAL(18,2) NOT NULL,
  unit_of_measure VARCHAR(20) NOT NULL,
  unit_price DECIMAL(18,2) NOT NULL,
  total_price DECIMAL(18,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  currency VARCHAR(3) DEFAULT 'ETB',
  vat_rate DECIMAL(5,4) DEFAULT 0.1500,
  vat_amount DECIMAL(18,2) GENERATED ALWAYS AS ((quantity * unit_price) * vat_rate) STORED,
  line_total DECIMAL(18,2) GENERATED ALWAYS AS ((quantity * unit_price) + ((quantity * unit_price) * vat_rate)) STORED,
  lead_time_days INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(quotation_id, line_number)
);

CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation ON supplier_quotation_items(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_items_product ON supplier_quotation_items(product_id);

CREATE TABLE IF NOT EXISTS budget_commitments (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  budget_id INTEGER NOT NULL REFERENCES budgets(id),
  commitment_type VARCHAR(50) NOT NULL,
  reference_type VARCHAR(50) NOT NULL,
  reference_id INTEGER NOT NULL,
  committed_amount DECIMAL(18,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'ETB',
  status VARCHAR(20) DEFAULT 'active',
  committed_by VARCHAR(255) NOT NULL,
  committed_by_name VARCHAR(255) NOT NULL,
  committed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  released_by VARCHAR(255),
  released_by_name VARCHAR(255),
  released_at TIMESTAMP,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_budget_commitments_tenant ON budget_commitments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_budget_commitments_budget ON budget_commitments(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_commitments_reference ON budget_commitments(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_budget_commitments_status ON budget_commitments(status);

CREATE TABLE IF NOT EXISTS purchase_documents (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  document_type VARCHAR(50) NOT NULL,
  reference_type VARCHAR(50) NOT NULL,
  reference_id INTEGER NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  document_url VARCHAR(500) NOT NULL,
  document_size INTEGER,
  document_mime_type VARCHAR(100),
  uploaded_by VARCHAR(255) NOT NULL,
  uploaded_by_name VARCHAR(255) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  description TEXT
);

CREATE INDEX IF NOT EXISTS idx_purchase_documents_tenant ON purchase_documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_purchase_documents_reference ON purchase_documents(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_purchase_documents_type ON purchase_documents(document_type);

CREATE TABLE IF NOT EXISTS purchase_comments (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  comment_type VARCHAR(50) NOT NULL,
  reference_type VARCHAR(50) NOT NULL,
  reference_id INTEGER NOT NULL,
  comment_text TEXT NOT NULL,
  commented_by VARCHAR(255) NOT NULL,
  commented_by_name VARCHAR(255) NOT NULL,
  commented_by_role VARCHAR(50),
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_purchase_comments_tenant ON purchase_comments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_purchase_comments_reference ON purchase_comments(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_purchase_comments_type ON purchase_comments(comment_type);

CREATE TABLE IF NOT EXISTS warehouse_receipts (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  receipt_number VARCHAR(50) NOT NULL,
  po_id INTEGER REFERENCES purchase_orders(id),
  received_by VARCHAR(255) NOT NULL,
  received_by_name VARCHAR(255) NOT NULL,
  received_by_role VARCHAR(50),
  category_id INTEGER REFERENCES esic_categories(id),
  delivery_location VARCHAR(255),
  quantity_received DECIMAL(18,2) DEFAULT 0.00,
  quantity_accepted DECIMAL(18,2) DEFAULT 0.00,
  quantity_rejected DECIMAL(18,2) DEFAULT 0.00,
  status VARCHAR(20) DEFAULT 'pending',
  processed_by VARCHAR(255),
  processed_by_name VARCHAR(255),
  processed_at TIMESTAMP,
  notes TEXT,
  received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, receipt_number)
);

CREATE INDEX IF NOT EXISTS idx_warehouse_receipts_tenant ON warehouse_receipts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_receipts_number ON warehouse_receipts(receipt_number);
CREATE INDEX IF NOT EXISTS idx_warehouse_receipts_po ON warehouse_receipts(po_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_receipts_status ON warehouse_receipts(status);
CREATE INDEX IF NOT EXISTS idx_warehouse_receipts_category ON warehouse_receipts(category_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_receipts_received_by ON warehouse_receipts(received_by);
CREATE INDEX IF NOT EXISTS idx_warehouse_receipts_received_at ON warehouse_receipts(received_at);

CREATE TABLE IF NOT EXISTS warehouse_receipt_items (
  id SERIAL PRIMARY KEY,
  receipt_id INTEGER NOT NULL REFERENCES warehouse_receipts(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  po_item_id INTEGER REFERENCES purchase_order_items(id),
  product_id INTEGER REFERENCES products(id),
  product_name VARCHAR(255) NOT NULL,
  product_description TEXT,
  category_id INTEGER REFERENCES esic_categories(id),
  quantity_received DECIMAL(18,2) NOT NULL,
  quantity_accepted DECIMAL(18,2) DEFAULT 0.00,
  quantity_rejected DECIMAL(18,2) DEFAULT 0.00,
  unit_of_measure VARCHAR(20) NOT NULL,
  unit_cost DECIMAL(18,2) NOT NULL,
  total_cost DECIMAL(18,2) GENERATED ALWAYS AS (quantity_received * unit_cost) STORED,
  specification TEXT,
  inspection_notes TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(receipt_id, line_number)
);

CREATE INDEX IF NOT EXISTS idx_warehouse_receipt_items_receipt ON warehouse_receipt_items(receipt_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_receipt_items_po_item ON warehouse_receipt_items(po_item_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_receipt_items_product ON warehouse_receipt_items(product_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_receipt_items_category ON warehouse_receipt_items(category_id);

-- Add missing columns to existing tables
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS supplier_code VARCHAR(50);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS tax_id VARCHAR(50);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES esic_categories(id);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS region VARCHAR(100);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Ethiopia';
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS website VARCHAR(255);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS payment_terms INTEGER DEFAULT 30;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(18,2) DEFAULT 0.00;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS bank_name VARCHAR(255);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS bank_account VARCHAR(50);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS bank_branch VARCHAR(100);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS vat_registered BOOLEAN DEFAULT TRUE;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS vat_registration_number VARCHAR(50);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT 3;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE purchase_requisitions ADD COLUMN IF NOT EXISTS requisition_date DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE purchase_requisitions ADD COLUMN IF NOT EXISTS requested_by_name VARCHAR(255);
ALTER TABLE purchase_requisitions ADD COLUMN IF NOT EXISTS requested_by_role VARCHAR(50);
ALTER TABLE purchase_requisitions ADD COLUMN IF NOT EXISTS department_id VARCHAR(50);
ALTER TABLE purchase_requisitions ADD COLUMN IF NOT EXISTS cost_center_id VARCHAR(50);
ALTER TABLE purchase_requisitions ADD COLUMN IF NOT EXISTS project_id VARCHAR(50);
ALTER TABLE purchase_requisitions ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES esic_categories(id);
ALTER TABLE purchase_requisitions ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal';
ALTER TABLE purchase_requisitions ADD COLUMN IF NOT EXISTS urgency VARCHAR(20) DEFAULT 'normal';
ALTER TABLE purchase_requisitions ADD COLUMN IF NOT EXISTS justification TEXT;
ALTER TABLE purchase_requisitions ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'ETB';
ALTER TABLE purchase_requisitions ADD COLUMN IF NOT EXISTS budget_id INTEGER REFERENCES budgets(id);
ALTER TABLE purchase_requisitions ADD COLUMN IF NOT EXISTS budget_validated BOOLEAN DEFAULT FALSE;
ALTER TABLE purchase_requisitions ADD COLUMN IF NOT EXISTS budget_validation_message TEXT;
ALTER TABLE purchase_requisitions ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft';
ALTER TABLE purchase_requisitions ADD COLUMN IF NOT EXISTS workflow_instance_id INTEGER REFERENCES approval_workflow_instances(id);
ALTER TABLE purchase_requisitions ADD COLUMN IF NOT EXISTS approved_by VARCHAR(255);
ALTER TABLE purchase_requisitions ADD COLUMN IF NOT EXISTS approved_by_name VARCHAR(255);
ALTER TABLE purchase_requisitions ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE purchase_requisitions ADD COLUMN IF NOT EXISTS rejected_by VARCHAR(255);
ALTER TABLE purchase_requisitions ADD COLUMN IF NOT EXISTS rejected_by_name VARCHAR(255);
ALTER TABLE purchase_requisitions ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP;
ALTER TABLE purchase_requisitions ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE purchase_requisitions ADD COLUMN IF NOT EXISTS expected_delivery_date DATE;
ALTER TABLE purchase_requisitions ADD COLUMN IF NOT EXISTS delivery_location VARCHAR(255);
ALTER TABLE purchase_requisitions ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE purchase_requisitions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS po_number VARCHAR(50);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS po_date DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS requisition_id INTEGER REFERENCES purchase_requisitions(id);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS supplier_id INTEGER REFERENCES suppliers(id);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS supplier_name VARCHAR(255);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS supplier_address TEXT;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS supplier_contact VARCHAR(255);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS supplier_phone VARCHAR(20);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS supplier_email VARCHAR(255);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES esic_categories(id);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS delivery_terms TEXT;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS shipping_method VARCHAR(50);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS shipping_address TEXT;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS expected_delivery_date DATE;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS actual_delivery_date DATE;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS subtotal DECIMAL(18,2) DEFAULT 0.00;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS vat_amount DECIMAL(18,2) DEFAULT 0.00;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS vat_rate DECIMAL(5,4) DEFAULT 0.1500;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS withholding_tax_amount DECIMAL(18,2) DEFAULT 0.00;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS withholding_tax_rate DECIMAL(5,4) DEFAULT 0.0000;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'ETB';
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS workflow_instance_id INTEGER REFERENCES approval_workflow_instances(id);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS approved_by VARCHAR(255);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS approved_by_name VARCHAR(255);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS sent_to_supplier BOOLEAN DEFAULT false;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS supplier_acknowledged BOOLEAN DEFAULT false;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS supplier_acknowledged_at TIMESTAMP;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS internal_notes TEXT;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Migrate existing values into new columns when applicable
UPDATE suppliers
SET supplier_code = CONCAT('SUP-', EXTRACT(YEAR FROM CURRENT_DATE)::TEXT, '-', LPAD(id::TEXT, 6, '0'))
WHERE supplier_code IS NULL;

UPDATE purchase_orders
SET po_number = COALESCE(order_number, CONCAT('PO-', id::TEXT)),
    po_date = COALESCE(order_date, CURRENT_DATE)
WHERE po_number IS NULL;

UPDATE purchase_requisitions
SET requisition_date = COALESCE(request_date, CURRENT_DATE)
WHERE requisition_date IS NULL;

ALTER TABLE suppliers ALTER COLUMN supplier_code SET NOT NULL;
ALTER TABLE suppliers ALTER COLUMN country SET NOT NULL;
ALTER TABLE suppliers ALTER COLUMN active SET NOT NULL;

ALTER TABLE purchase_orders ALTER COLUMN po_number SET NOT NULL;
ALTER TABLE purchase_orders ALTER COLUMN po_date SET NOT NULL;

ALTER TABLE purchase_requisitions ALTER COLUMN requisition_date SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_suppliers_code ON suppliers(tenant_id, supplier_code);
CREATE INDEX IF NOT EXISTS idx_purchase_requisitions_number ON purchase_requisitions(requisition_number);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_tenant ON purchase_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_number ON purchase_orders(po_number);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_requisition ON purchase_orders(requisition_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_category ON purchase_orders(category_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_workflow ON purchase_orders(workflow_instance_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_date ON purchase_orders(po_date);

-- Create update timestamp trigger helper if missing
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach updated_at triggers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_esic_categories_updated_at') THEN
    CREATE TRIGGER update_esic_categories_updated_at BEFORE UPDATE ON esic_categories
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_products_updated_at') THEN
    CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_suppliers_updated_at') THEN
    CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_budgets_updated_at') THEN
    CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_approval_configurations_updated_at') THEN
    CREATE TRIGGER update_approval_configurations_updated_at BEFORE UPDATE ON approval_workflow_configurations
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_purchase_requisitions_updated_at') THEN
    CREATE TRIGGER update_purchase_requisitions_updated_at BEFORE UPDATE ON purchase_requisitions
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_purchase_requisition_items_updated_at') THEN
    CREATE TRIGGER update_purchase_requisition_items_updated_at BEFORE UPDATE ON purchase_requisition_items
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_purchase_orders_updated_at') THEN
    CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_purchase_order_items_updated_at') THEN
    CREATE TRIGGER update_purchase_order_items_updated_at BEFORE UPDATE ON purchase_order_items
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_supplier_quotations_updated_at') THEN
    CREATE TRIGGER update_supplier_quotations_updated_at BEFORE UPDATE ON supplier_quotations
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_warehouse_receipts_updated_at') THEN
    CREATE TRIGGER update_warehouse_receipts_updated_at BEFORE UPDATE ON warehouse_receipts
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_warehouse_receipt_items_updated_at') THEN
    CREATE TRIGGER update_warehouse_receipt_items_updated_at BEFORE UPDATE ON warehouse_receipt_items
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;

-- Ensure there is at least one default category and product for new referential logic
INSERT INTO esic_categories(code, name, level, description)
SELECT 'GEN', 'General Expense', 1, 'Default category for general procurement' 
WHERE NOT EXISTS (SELECT 1 FROM esic_categories WHERE code = 'GEN');

INSERT INTO products(tenant_id, sku, name, unit_of_measure, active)
SELECT 'tenant_default', 'DEFAULT-PRODUCT', 'Default Product', 'pcs', true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'DEFAULT-PRODUCT' AND tenant_id = 'tenant_default');
