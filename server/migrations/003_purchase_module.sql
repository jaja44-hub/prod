-- Phase 2: Purchase Module Database Schema
-- This migration creates tables for purchase requisitions, purchase orders, and related functionality

-- ============================================
-- Purchase Requisitions
-- ============================================

CREATE TABLE purchase_requisitions (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  requisition_number VARCHAR(50) NOT NULL,
  requisition_date DATE NOT NULL DEFAULT CURRENT_DATE,
  requested_by VARCHAR(255) NOT NULL,
  requested_by_name VARCHAR(255) NOT NULL,
  requested_by_role VARCHAR(50),
  department_id VARCHAR(50),
  cost_center_id VARCHAR(50),
  project_id VARCHAR(50),
  category_id INTEGER REFERENCES esic_categories(id),
  priority VARCHAR(20) DEFAULT 'normal',
  urgency VARCHAR(20) DEFAULT 'normal',
  justification TEXT,
  total_amount DECIMAL(18,2) DEFAULT 0.00,
  currency VARCHAR(3) DEFAULT 'ETB',
  budget_id INTEGER REFERENCES budgets(id),
  budget_validated BOOLEAN DEFAULT false,
  budget_validation_message TEXT,
  status VARCHAR(20) DEFAULT 'draft',
  workflow_instance_id INTEGER REFERENCES approval_workflow_instances(id),
  approved_by VARCHAR(255),
  approved_by_name VARCHAR(255),
  approved_at TIMESTAMP,
  rejected_by VARCHAR(255),
  rejected_by_name VARCHAR(255),
  rejected_at TIMESTAMP,
  rejection_reason TEXT,
  expected_delivery_date DATE,
  delivery_location VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, requisition_number)
);

CREATE INDEX idx_purchase_requisitions_tenant ON purchase_requisitions(tenant_id);
CREATE INDEX idx_purchase_requisitions_number ON purchase_requisitions(requisition_number);
CREATE INDEX idx_purchase_requisitions_status ON purchase_requisitions(status);
CREATE INDEX idx_purchase_requisitions_requested_by ON purchase_requisitions(requested_by);
CREATE INDEX idx_purchase_requisitions_category ON purchase_requisitions(category_id);
CREATE INDEX idx_purchase_requisitions_budget ON purchase_requisitions(budget_id);
CREATE INDEX idx_purchase_requisitions_workflow ON purchase_requisitions(workflow_instance_id);
CREATE INDEX idx_purchase_requisitions_date ON purchase_requisitions(requisition_date);

-- ============================================
-- Purchase Requisition Line Items
-- ============================================

CREATE TABLE purchase_requisition_items (
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

CREATE INDEX idx_requisition_items_requisition ON purchase_requisition_items(requisition_id);
CREATE INDEX idx_requisition_items_product ON purchase_requisition_items(product_id);
CREATE INDEX idx_requisition_items_category ON purchase_requisition_items(category_id);

-- ============================================
-- Purchase Orders
-- ============================================

CREATE TABLE purchase_orders (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  po_number VARCHAR(50) NOT NULL,
  po_date DATE NOT NULL DEFAULT CURRENT_DATE,
  requisition_id INTEGER REFERENCES purchase_requisitions(id),
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
  supplier_name VARCHAR(255) NOT NULL,
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

CREATE INDEX idx_purchase_orders_tenant ON purchase_orders(tenant_id);
CREATE INDEX idx_purchase_orders_number ON purchase_orders(po_number);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_requisition ON purchase_orders(requisition_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_category ON purchase_orders(category_id);
CREATE INDEX idx_purchase_orders_workflow ON purchase_orders(workflow_instance_id);
CREATE INDEX idx_purchase_orders_date ON purchase_orders(po_date);

-- ============================================
-- Purchase Order Line Items
-- ============================================

CREATE TABLE purchase_order_items (
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

CREATE INDEX idx_po_items_po ON purchase_order_items(po_id);
CREATE INDEX idx_po_items_product ON purchase_order_items(product_id);
CREATE INDEX idx_po_items_requisition_item ON purchase_order_items(requisition_item_id);
CREATE INDEX idx_po_items_category ON purchase_order_items(category_id);

-- ============================================
-- Supplier Quotations
-- ============================================

CREATE TABLE supplier_quotations (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  quotation_number VARCHAR(50) NOT NULL,
  quotation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  requisition_id INTEGER REFERENCES purchase_requisitions(id),
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
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

CREATE INDEX idx_supplier_quotations_tenant ON supplier_quotations(tenant_id);
CREATE INDEX idx_supplier_quotations_number ON supplier_quotations(quotation_number);
CREATE INDEX idx_supplier_quotations_supplier ON supplier_quotations(supplier_id);
CREATE INDEX idx_supplier_quotations_requisition ON supplier_quotations(requisition_id);

-- ============================================
-- Supplier Quotation Line Items
-- ============================================

CREATE TABLE supplier_quotation_items (
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

CREATE INDEX idx_quotation_items_quotation ON supplier_quotation_items(quotation_id);
CREATE INDEX idx_quotation_items_product ON supplier_quotation_items(product_id);

-- ============================================
-- Budget Commitments
-- ============================================

CREATE TABLE budget_commitments (
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

CREATE INDEX idx_budget_commitments_tenant ON budget_commitments(tenant_id);
CREATE INDEX idx_budget_commitments_budget ON budget_commitments(budget_id);
CREATE INDEX idx_budget_commitments_reference ON budget_commitments(reference_type, reference_id);
CREATE INDEX idx_budget_commitments_status ON budget_commitments(status);

-- ============================================
-- Purchase Documents
-- ============================================

CREATE TABLE purchase_documents (
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

CREATE INDEX idx_purchase_documents_tenant ON purchase_documents(tenant_id);
CREATE INDEX idx_purchase_documents_reference ON purchase_documents(reference_type, reference_id);
CREATE INDEX idx_purchase_documents_type ON purchase_documents(document_type);

-- ============================================
-- Purchase Comments/Communication
-- ============================================

CREATE TABLE purchase_comments (
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

CREATE INDEX idx_purchase_comments_tenant ON purchase_comments(tenant_id);
CREATE INDEX idx_purchase_comments_reference ON purchase_comments(reference_type, reference_id);
CREATE INDEX idx_purchase_comments_type ON purchase_comments(comment_type);

-- ============================================
-- Trigger for updated_at timestamp
-- ============================================

CREATE TRIGGER update_purchase_requisitions_updated_at BEFORE UPDATE ON purchase_requisitions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_requisition_items_updated_at BEFORE UPDATE ON purchase_requisition_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_order_items_updated_at BEFORE UPDATE ON purchase_order_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supplier_quotations_updated_at BEFORE UPDATE ON supplier_quotations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Warehouse Receipts
-- ============================================

CREATE TABLE warehouse_receipts (
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

CREATE INDEX idx_warehouse_receipts_tenant ON warehouse_receipts(tenant_id);
CREATE INDEX idx_warehouse_receipts_number ON warehouse_receipts(receipt_number);
CREATE INDEX idx_warehouse_receipts_po ON warehouse_receipts(po_id);
CREATE INDEX idx_warehouse_receipts_status ON warehouse_receipts(status);
CREATE INDEX idx_warehouse_receipts_category ON warehouse_receipts(category_id);
CREATE INDEX idx_warehouse_receipts_received_by ON warehouse_receipts(received_by);
CREATE INDEX idx_warehouse_receipts_received_at ON warehouse_receipts(received_at);

-- ============================================
-- Warehouse Receipt Items
-- ============================================

CREATE TABLE warehouse_receipt_items (
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

CREATE INDEX idx_warehouse_receipt_items_receipt ON warehouse_receipt_items(receipt_id);
CREATE INDEX idx_warehouse_receipt_items_po_item ON warehouse_receipt_items(po_item_id);
CREATE INDEX idx_warehouse_receipt_items_product ON warehouse_receipt_items(product_id);
CREATE INDEX idx_warehouse_receipt_items_category ON warehouse_receipt_items(category_id);

-- ============================================
-- Trigger for updated_at timestamp
-- ============================================

CREATE TRIGGER update_warehouse_receipts_updated_at BEFORE UPDATE ON warehouse_receipts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_warehouse_receipt_items_updated_at BEFORE UPDATE ON warehouse_receipt_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
