import { queryNeon } from './neonClient.js';

export async function createAgingTables() {
  const createVendorBillsTable = `
    CREATE TABLE IF NOT EXISTS vendor_bills (
      id SERIAL PRIMARY KEY,
      invoice_id VARCHAR(50) UNIQUE NOT NULL,
      vendor_name VARCHAR(255) NOT NULL,
      due_date DATE NOT NULL,
      amount DECIMAL(15, 2) NOT NULL,
      currency VARCHAR(10) DEFAULT 'ETB',
      tenant_id VARCHAR(50) DEFAULT 'production',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  const createCustomerInvoicesTable = `
    CREATE TABLE IF NOT EXISTS customer_invoices (
      id SERIAL PRIMARY KEY,
      invoice_id VARCHAR(50) UNIQUE NOT NULL,
      customer_name VARCHAR(255) NOT NULL,
      due_date DATE NOT NULL,
      amount DECIMAL(15, 2) NOT NULL,
      currency VARCHAR(10) DEFAULT 'ETB',
      tenant_id VARCHAR(50) DEFAULT 'production',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  const createIndexes = `
    CREATE INDEX IF NOT EXISTS idx_vendor_bills_tenant ON vendor_bills(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_vendor_bills_due_date ON vendor_bills(due_date);
    CREATE INDEX IF NOT EXISTS idx_customer_invoices_tenant ON customer_invoices(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_customer_invoices_due_date ON customer_invoices(due_date);
  `;
  
  try {
    await queryNeon(createVendorBillsTable);
    await queryNeon(createCustomerInvoicesTable);
    await queryNeon(createIndexes);
    console.log('[neonAging] Tables and indexes created successfully');
  } catch (err) {
    console.error('[neonAging] Failed to create tables:', err);
    throw err;
  }
}

export async function computeAgingBuckets(tenantId = 'production') {
  // Simplified approach: fetch raw data and bucket in JavaScript
  const vendorQuery = `
    SELECT 
      invoice_id,
      vendor_name,
      due_date,
      amount,
      currency
    FROM vendor_bills
    WHERE tenant_id = $1;
  `;
  
  const customerQuery = `
    SELECT 
      invoice_id,
      customer_name,
      due_date,
      amount,
      currency
    FROM customer_invoices
    WHERE tenant_id = $1;
  `;
  
  try {
    const vendorResult = await queryNeon(vendorQuery, [tenantId]);
    const customerResult = await queryNeon(customerQuery, [tenantId]);
    
    const accountsPayable = {
      current: [],
      days30: [],
      days60: [],
      days90: [],
      over90: [],
    };
    
    const now = new Date();
    for (const row of vendorResult.rows) {
      const dueDate = new Date(row.due_date);
      const ageDays = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
      const line = {
        invoiceId: row.invoice_id,
        vendorName: row.vendor_name,
        dueDate: row.due_date,
        amount: Number(row.amount),
        currency: row.currency,
        ageDays,
      };
      
      if (ageDays <= 0) accountsPayable.current.push(line);
      else if (ageDays <= 30) accountsPayable.days30.push(line);
      else if (ageDays <= 60) accountsPayable.days60.push(line);
      else if (ageDays <= 90) accountsPayable.days90.push(line);
      else accountsPayable.over90.push(line);
    }
    
    const accountsReceivable = {
      current: [],
      days30: [],
      days60: [],
      days90: [],
      over90: [],
    };
    
    for (const row of customerResult.rows) {
      const dueDate = new Date(row.due_date);
      const ageDays = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
      const line = {
        invoiceId: row.invoice_id,
        customerName: row.customer_name,
        dueDate: row.due_date,
        amount: Number(row.amount),
        currency: row.currency,
        ageDays,
      };
      
      if (ageDays <= 0) accountsReceivable.current.push(line);
      else if (ageDays <= 30) accountsReceivable.days30.push(line);
      else if (ageDays <= 60) accountsReceivable.days60.push(line);
      else if (ageDays <= 90) accountsReceivable.days90.push(line);
      else accountsReceivable.over90.push(line);
    }
    
    const summaryQuery = `
      SELECT 
        (SELECT COALESCE(SUM(amount), 0) FROM vendor_bills WHERE tenant_id = $1) as total_payable,
        (SELECT COUNT(*) FROM vendor_bills WHERE tenant_id = $1) as vendor_count,
        (SELECT COALESCE(SUM(amount), 0) FROM customer_invoices WHERE tenant_id = $1) as total_receivable,
        (SELECT COUNT(*) FROM customer_invoices WHERE tenant_id = $1) as customer_count;
    `;
    
    const summaryResult = await queryNeon(summaryQuery, [tenantId]);
    const summary = summaryResult.rows[0];
    
    return {
      generatedAt: new Date().toISOString(),
      accountsPayable,
      accountsReceivable,
      summary: {
        totalPayable: Number(summary.total_payable),
        totalReceivable: Number(summary.total_receivable),
        vendorCount: Number(summary.vendor_count),
        customerCount: Number(summary.customer_count),
      },
    };
  } catch (err) {
    console.error('[neonAging] Failed to compute aging buckets:', err);
    throw err;
  }
}

export async function getWarehouseMetrics(tenantId = 'production') {
  const query = `
    SELECT 
      picking_id,
      picking_type,
      state,
      scheduled_date,
      location_src,
      location_dest
    FROM warehouse_metrics
    WHERE tenant_id = $1
    ORDER BY scheduled_date DESC;
  `;
  
  try {
    const result = await queryNeon(query, [tenantId]);
    return result.rows;
  } catch (err) {
    console.error('[neonAging] Failed to get warehouse metrics:', err);
    throw err;
  }
}

export async function getSalesAnalytics(tenantId = 'production') {
  const query = `
    SELECT 
      order_id,
      order_name,
      state,
      date_order,
      amount_total,
      currency,
      partner_id,
      partner_name
    FROM sales_analytics
    WHERE tenant_id = $1
    ORDER BY date_order DESC;
  `;
  
  try {
    const result = await queryNeon(query, [tenantId]);
    return result.rows;
  } catch (err) {
    console.error('[neonAging] Failed to get sales analytics:', err);
    throw err;
  }
}

export async function getFinanceAging(tenantId = 'production') {
  return await computeAgingBuckets(tenantId);
}

export async function syncOdooToNeon(vendorBills, customerInvoices, tenantId = 'production') {
  const insertVendorBills = `
    INSERT INTO vendor_bills (invoice_id, vendor_name, due_date, amount, currency, tenant_id)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (invoice_id) 
    DO UPDATE SET 
      vendor_name = EXCLUDED.vendor_name,
      due_date = EXCLUDED.due_date,
      amount = EXCLUDED.amount,
      currency = EXCLUDED.currency,
      updated_at = CURRENT_TIMESTAMP;
  `;
  
  const insertCustomerInvoices = `
    INSERT INTO customer_invoices (invoice_id, customer_name, due_date, amount, currency, tenant_id)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (invoice_id) 
    DO UPDATE SET 
      customer_name = EXCLUDED.customer_name,
      due_date = EXCLUDED.due_date,
      amount = EXCLUDED.amount,
      currency = EXCLUDED.currency,
      updated_at = CURRENT_TIMESTAMP;
  `;
  
  const client = await (await import('./neonClient.js')).getNeonClient();
  if (!client) {
    throw new Error('Neon DB not available');
  }
  
  try {
    await client.query('BEGIN');
    
    for (const bill of vendorBills) {
      await client.query(insertVendorBills, [
        bill.invoiceId,
        bill.vendorName,
        bill.dueDate,
        bill.amount,
        bill.currency,
        tenantId,
      ]);
    }
    
    for (const invoice of customerInvoices) {
      await client.query(insertCustomerInvoices, [
        invoice.invoiceId,
        invoice.customerName,
        invoice.dueDate,
        invoice.amount,
        invoice.currency,
        tenantId,
      ]);
    }
    
    await client.query('COMMIT');
    console.log(`[neonAging] Synced ${vendorBills.length} vendor bills and ${customerInvoices.length} customer invoices`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[neonAging] Failed to sync Odoo data:', err);
    throw err;
  } finally {
    client.release();
  }
}

export default {
  createAgingTables,
  computeAgingBuckets,
  syncOdooToNeon,
};
