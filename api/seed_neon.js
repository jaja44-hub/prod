import { getPool } from './lib/shared.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  const pool = getPool();
  
  try {
    const tenantId = 'tenant_default';

    // 1. Suppliers
    await pool.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id VARCHAR(50) PRIMARY KEY,
        supplier_code VARCHAR(50),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        city VARCHAR(100),
        country VARCHAR(100),
        active BOOLEAN DEFAULT true,
        tenant_id VARCHAR(50) DEFAULT 'tenant_default',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      INSERT INTO suppliers (id, supplier_code, name, email, phone, city, country, tenant_id)
      VALUES 
      ('sup-001', 'SUP-001', 'Addis Crown Materials Ltd', 'contact@addiscrown.et', '+251-1-234-5678', 'Addis Ababa', 'Ethiopia', $1),
      ('sup-002', 'SUP-002', 'Bekele Trading Export', 'sales@bekeletrading.et', '+251-1-555-9876', 'Addis Ababa', 'Ethiopia', $1)
      ON CONFLICT (id) DO NOTHING
    `, [tenantId]);

    // 2. Purchase Orders
    await pool.query(`
      CREATE TABLE IF NOT EXISTS purchase_orders (
        id VARCHAR(50) PRIMARY KEY DEFAULT 'po-' || md5(random()::text),
        po_number VARCHAR(50) UNIQUE NOT NULL,
        supplier_id VARCHAR(50),
        supplier_name VARCHAR(255),
        po_date DATE NOT NULL,
        expected_delivery_date DATE,
        total_amount DECIMAL(15, 2) NOT NULL,
        status VARCHAR(50) NOT NULL,
        notes TEXT,
        items JSONB,
        tenant_id VARCHAR(50) DEFAULT 'tenant_default',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      INSERT INTO purchase_orders (po_number, supplier_id, supplier_name, po_date, total_amount, status, tenant_id)
      VALUES 
      ('PO-1001', 'sup-001', 'Addis Crown Materials Ltd', CURRENT_DATE - 5, 1085000, 'draft', $1),
      ('PO-1002', 'sup-002', 'Bekele Trading Export', CURRENT_DATE - 2, 1000000, 'confirmed', $1)
      ON CONFLICT (po_number) DO NOTHING
    `, [tenantId]);

    // 3. Sales Orders
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sales_orders (
        id VARCHAR(50) PRIMARY KEY DEFAULT 'so-' || md5(random()::text),
        order_number VARCHAR(50) UNIQUE NOT NULL,
        customer_id VARCHAR(50),
        customer_name VARCHAR(255),
        order_date DATE NOT NULL,
        delivery_date DATE,
        total_amount DECIMAL(15, 2) NOT NULL,
        status VARCHAR(50) NOT NULL,
        payment_status VARCHAR(50),
        notes TEXT,
        items JSONB,
        tenant_id VARCHAR(50) DEFAULT 'tenant_default',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      INSERT INTO sales_orders (order_number, customer_id, customer_name, order_date, total_amount, status, tenant_id)
      VALUES 
      ('SO-ABC123', 'partner-bole', 'Bole Construction', CURRENT_DATE - 2, 550000, 'draft', $1),
      ('SO-DEF456', 'partner-megenagna', 'Megenagna Complex', CURRENT_DATE - 1, 2295000, 'confirmed', $1)
      ON CONFLICT (order_number) DO NOTHING
    `, [tenantId]);

    // 4. Chart of Accounts
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chart_of_accounts (
        id VARCHAR(50) PRIMARY KEY DEFAULT 'acc-' || md5(random()::text),
        account_code VARCHAR(50) UNIQUE NOT NULL,
        account_name VARCHAR(255) NOT NULL,
        account_type VARCHAR(50),
        balance_type VARCHAR(10),
        is_active BOOLEAN DEFAULT true,
        tenant_id VARCHAR(50) DEFAULT 'tenant_default',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      INSERT INTO chart_of_accounts (account_code, account_name, account_type, balance_type, tenant_id)
      VALUES 
      ('1000', 'Cash and Cash Equivalents', 'Asset', 'debit', $1),
      ('1200', 'Accounts Receivable', 'Asset', 'debit', $1),
      ('2000', 'Accounts Payable', 'Liability', 'credit', $1),
      ('4000', 'Sales Revenue', 'Revenue', 'credit', $1),
      ('5000', 'Cost of Goods Sold', 'Expense', 'debit', $1)
      ON CONFLICT (account_code) DO NOTHING
    `, [tenantId]);

    // 5. Journal Entries
    await pool.query(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id VARCHAR(50) PRIMARY KEY DEFAULT 'je-' || md5(random()::text),
        entry_number VARCHAR(50) UNIQUE NOT NULL,
        entry_date DATE NOT NULL,
        entry_type VARCHAR(50),
        description TEXT,
        status VARCHAR(50),
        total_debit DECIMAL(15, 2) NOT NULL DEFAULT 0,
        total_credit DECIMAL(15, 2) NOT NULL DEFAULT 0,
        reference_type VARCHAR(50),
        reference_id VARCHAR(50),
        tenant_id VARCHAR(50) DEFAULT 'tenant_default',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      INSERT INTO journal_entries (entry_number, entry_date, entry_type, description, status, total_debit, total_credit, tenant_id)
      VALUES 
      ('JE-0001', CURRENT_DATE, 'SALES_INVOICE', 'Sale to Bole Construction', 'posted', 550000, 550000, $1),
      ('JE-0002', CURRENT_DATE - 1, 'PURCHASE_ORDER', 'Purchase from Addis Crown', 'draft', 1085000, 1085000, $1)
      ON CONFLICT (entry_number) DO NOTHING
    `, [tenantId]);

    // 6. Customers
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(50) PRIMARY KEY DEFAULT 'cust-' || md5(random()::text),
        customer_code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        city VARCHAR(100),
        country VARCHAR(100),
        credit_limit DECIMAL(15, 2) DEFAULT 0,
        active BOOLEAN DEFAULT true,
        tenant_id VARCHAR(50) DEFAULT 'tenant_default',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      INSERT INTO customers (customer_code, name, email, phone, city, country, credit_limit, tenant_id)
      VALUES 
      ('CUST-001', 'Bole Construction', 'billing@bole.et', '+251-1-111-2222', 'Addis Ababa', 'Ethiopia', 1000000, $1),
      ('CUST-002', 'Megenagna Complex', 'finance@megenagna.et', '+251-1-333-4444', 'Addis Ababa', 'Ethiopia', 5000000, $1)
      ON CONFLICT (customer_code) DO NOTHING
    `, [tenantId]);

    // 7. Warehouse Receipts
    await pool.query(`
      CREATE TABLE IF NOT EXISTS warehouse_receipts (
        id VARCHAR(50) PRIMARY KEY DEFAULT 'wr-' || md5(random()::text),
        receipt_number VARCHAR(50) UNIQUE NOT NULL,
        po_id VARCHAR(50),
        supplier_name VARCHAR(255),
        receipt_date DATE NOT NULL,
        status VARCHAR(50) NOT NULL,
        notes TEXT,
        items JSONB,
        tenant_id VARCHAR(50) DEFAULT 'tenant_default',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      INSERT INTO warehouse_receipts (receipt_number, po_id, supplier_name, receipt_date, status, tenant_id)
      VALUES 
      ('WR-001', 'PO-1001', 'Addis Crown Materials Ltd', CURRENT_DATE - 3, 'pending', $1),
      ('WR-002', 'PO-1002', 'Bekele Trading Export', CURRENT_DATE - 1, 'matched', $1)
      ON CONFLICT (receipt_number) DO NOTHING
    `, [tenantId]);
    
    // 9. Products (Inventory)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(50) PRIMARY KEY,
        sku VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        cost_price DECIMAL(15,2) DEFAULT 0,
        selling_price DECIMAL(15,2) DEFAULT 0,
        reorder_level INTEGER DEFAULT 10,
        active BOOLEAN DEFAULT true,
        tenant_id VARCHAR(50) DEFAULT 'tenant_default',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      INSERT INTO products (id, sku, name, cost_price, selling_price, reorder_level, tenant_id)
      VALUES 
      ('prod-001', 'SKU-1001', 'Crown Glass 4mm', 4200, 5200, 20, $1),
      ('prod-002', 'SKU-1002', 'Crown Glass 6mm', 10500, 12500, 10, $1),
      ('prod-003', 'SKU-1003', 'Aluminum Frame 1.5m', 800, 1200, 15, $1)
      ON CONFLICT (sku) DO NOTHING
    `, [tenantId]);

    // 10. Inventory Transactions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS inventory_transactions (
        id SERIAL PRIMARY KEY,
        product_id VARCHAR(50),
        transaction_type VARCHAR(50),
        quantity DECIMAL(15,2) NOT NULL,
        unit_cost DECIMAL(15,2),
        location_id VARCHAR(50),
        reference_type VARCHAR(50),
        reference_id VARCHAR(50),
        transaction_date DATE NOT NULL,
        tenant_id VARCHAR(50) DEFAULT 'tenant_default',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      INSERT INTO inventory_transactions (product_id, transaction_type, quantity, unit_cost, transaction_date, tenant_id)
      VALUES 
      ('prod-001', 'receipt', 100, 4200, CURRENT_DATE - 3, $1),
      ('prod-002', 'receipt', 50, 10500, CURRENT_DATE - 3, $1),
      ('prod-001', 'issue', -20, 4200, CURRENT_DATE - 1, $1)
    `, [tenantId]);

    return res.status(200).json({ success: true, message: 'Neon database tables provisioned and seeded successfully.' });

  } catch (error) {
    console.error('Seed error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
