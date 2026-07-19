-- Phase 1: Core Infrastructure Database Schema
-- This migration creates the foundational tables for the ERP system
-- including ESIC categories, product/supplier masters, budgets, and approval workflows

-- Enable UUID extension for unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ESIC Category Classification System
-- ============================================

CREATE TABLE esic_categories (
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

CREATE INDEX idx_esic_categories_code ON esic_categories(code);
CREATE INDEX idx_esic_categories_parent ON esic_categories(parent_id);
CREATE INDEX idx_esic_categories_level ON esic_categories(level);

-- ============================================
-- Product Master Data
-- ============================================

CREATE TABLE products (
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

CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(active);

-- ============================================
-- Supplier Master Data
-- ============================================

CREATE TABLE suppliers (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  supplier_code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  tax_id VARCHAR(50),
  category_id INTEGER REFERENCES esic_categories(id),
  address TEXT,
  city VARCHAR(100),
  region VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Ethiopia',
  phone VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(255),
  contact_person VARCHAR(255),
  contact_phone VARCHAR(20),
  contact_email VARCHAR(255),
  payment_terms INTEGER DEFAULT 30,
  credit_limit DECIMAL(18,2) DEFAULT 0.00,
  bank_name VARCHAR(255),
  bank_account VARCHAR(50),
  bank_branch VARCHAR(100),
  vat_registered BOOLEAN DEFAULT TRUE,
  vat_registration_number VARCHAR(50),
  rating INTEGER DEFAULT 3 CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, supplier_code)
);

CREATE INDEX idx_suppliers_tenant ON suppliers(tenant_id);
CREATE INDEX idx_suppliers_code ON suppliers(supplier_code);
CREATE INDEX idx_suppliers_category ON suppliers(category_id);
CREATE INDEX idx_suppliers_active ON suppliers(active);

-- ============================================
-- Customer Master Data
-- ============================================

CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  customer_code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  tax_id VARCHAR(50),
  category_id INTEGER REFERENCES esic_categories(id),
  address TEXT,
  city VARCHAR(100),
  region VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Ethiopia',
  phone VARCHAR(20),
  email VARCHAR(255),
  contact_person VARCHAR(255),
  contact_phone VARCHAR(20),
  contact_email VARCHAR(255),
  payment_terms INTEGER DEFAULT 30,
  credit_limit DECIMAL(18,2) DEFAULT 0.00,
  credit_days INTEGER DEFAULT 30,
  vat_registered BOOLEAN DEFAULT FALSE,
  vat_registration_number VARCHAR(50),
  customer_type VARCHAR(20) DEFAULT 'individual',
  industry VARCHAR(100),
  notes TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, customer_code)
);

CREATE INDEX idx_customers_tenant ON customers(tenant_id);
CREATE INDEX idx_customers_code ON customers(customer_code);
CREATE INDEX idx_customers_category ON customers(category_id);
CREATE INDEX idx_customers_active ON customers(active);

-- ============================================
-- Budget Structure
-- ============================================

CREATE TABLE budgets (
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

CREATE INDEX idx_budgets_tenant ON budgets(tenant_id);
CREATE INDEX idx_budgets_category ON budgets(category_id);
CREATE INDEX idx_budgets_fiscal_year ON budgets(fiscal_year);
CREATE INDEX idx_budgets_status ON budgets(status);

-- ============================================
-- Approval Workflow Configuration
-- ============================================

CREATE TABLE approval_workflow_configurations (
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

CREATE INDEX idx_approval_config_tenant ON approval_workflow_configurations(tenant_id);
CREATE INDEX idx_approval_config_type ON approval_workflow_configurations(workflow_type);

-- ============================================
-- Approval Workflow Stages
-- ============================================

CREATE TABLE approval_workflow_stages (
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

CREATE INDEX idx_approval_stages_config ON approval_workflow_stages(configuration_id);

-- ============================================
-- Approval Workflow Instances
-- ============================================

CREATE TABLE approval_workflow_instances (
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

CREATE INDEX idx_approval_instances_tenant ON approval_workflow_instances(tenant_id);
CREATE INDEX idx_approval_instances_reference ON approval_workflow_instances(reference_type, reference_id);
CREATE INDEX idx_approval_instances_status ON approval_workflow_instances(status);

-- ============================================
-- Approval Workflow Actions
-- ============================================

CREATE TABLE approval_workflow_actions (
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

CREATE INDEX idx_approval_actions_instance ON approval_workflow_actions(instance_id);

-- ============================================
-- Transaction Logging Infrastructure
-- ============================================

CREATE TABLE transaction_log (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  transaction_type VARCHAR(50) NOT NULL,
  transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reference_type VARCHAR(50) NOT NULL,
  reference_id VARCHAR(255) NOT NULL,
  amount DECIMAL(18,2),
  currency VARCHAR(3) DEFAULT 'ETB',
  description TEXT,
  user_id VARCHAR(255) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  user_role VARCHAR(50),
  ip_address INET,
  user_agent TEXT,
  status VARCHAR(20) DEFAULT 'completed',
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transaction_log_tenant ON transaction_log(tenant_id);
CREATE INDEX idx_transaction_log_type ON transaction_log(transaction_type);
CREATE INDEX idx_transaction_log_reference ON transaction_log(reference_type, reference_id);
CREATE INDEX idx_transaction_log_date ON transaction_log(transaction_date);
CREATE INDEX idx_transaction_log_user ON transaction_log(user_id);

-- ============================================
-- Audit Trail
-- ============================================

CREATE TABLE audit_trail (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  record_id INTEGER NOT NULL,
  action_type VARCHAR(20) NOT NULL,
  old_values JSONB,
  new_values JSONB,
  changed_fields JSONB,
  changed_by VARCHAR(255) NOT NULL,
  changed_by_name VARCHAR(255) NOT NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address INET,
  user_agent TEXT,
  reason TEXT
);

CREATE INDEX idx_audit_trail_tenant ON audit_trail(tenant_id);
CREATE INDEX idx_audit_trail_table ON audit_trail(table_name);
CREATE INDEX idx_audit_trail_record ON audit_trail(table_name, record_id);
CREATE INDEX idx_audit_trail_changed_by ON audit_trail(changed_by);
CREATE INDEX idx_audit_trail_changed_at ON audit_trail(changed_at);

-- ============================================
-- System Configuration
-- ============================================

CREATE TABLE system_configuration (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  config_key VARCHAR(100) NOT NULL,
  config_value TEXT,
  config_type VARCHAR(20) DEFAULT 'string',
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, config_key)
);

CREATE INDEX idx_system_config_tenant ON system_configuration(tenant_id);
CREATE INDEX idx_system_config_key ON system_configuration(config_key);

-- ============================================
-- Financial Periods
-- ============================================

CREATE TABLE financial_periods (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  period_type VARCHAR(20) NOT NULL,
  period_code VARCHAR(20) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  fiscal_year INTEGER NOT NULL,
  is_current BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'open',
  closed_by VARCHAR(255),
  closed_by_name VARCHAR(255),
  closed_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, period_code)
);

CREATE INDEX idx_financial_periods_tenant ON financial_periods(tenant_id);
CREATE INDEX idx_financial_periods_type ON financial_periods(period_type);
CREATE INDEX idx_financial_periods_status ON financial_periods(status);

-- ============================================
-- Trigger for updated_at timestamp
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_esic_categories_updated_at BEFORE UPDATE ON esic_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_approval_configurations_updated_at BEFORE UPDATE ON approval_workflow_configurations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_configuration_updated_at BEFORE UPDATE ON system_configuration
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
