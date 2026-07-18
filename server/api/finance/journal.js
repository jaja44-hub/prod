const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL });

async function generateJournalEntryNumber(tenantId) {
  const result = await pool.query(`SELECT COALESCE(MAX(CAST(SUBSTRING(entry_number FROM 11) AS INTEGER)), 0) + 1 as next_number FROM journal_entries WHERE tenant_id = $1`, [tenantId]);
  return `JE-${new Date().getFullYear()}-${String(result.rows[0].next_number).padStart(6, '0')}`;
}

async function calculateTax(poId) {
  const result = await pool.query(`SELECT po.*, ec.vat_rate, ec.vat_exempt, ec.withholding_rate FROM purchase_orders po LEFT JOIN esic_categories ec ON po.category_id = ec.id WHERE po.id = $1`, [poId]);
  const po = result.rows[0];
  const vatRate = po.vat_rate || 0.15;
  const withholdingRate = po.withholding_rate || 0;
  const exempt = po.vat_exempt || false;
  const vatAmount = exempt ? 0 : po.subtotal * vatRate;
  return { vat_rate: vatRate, vat_amount: vatAmount, withholding_tax_rate: withholdingRate, withholding_tax_amount: po.subtotal * withholdingRate };
}

async function createJournalEntryFromPO(poId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const poResult = await client.query(`SELECT po.*, s.name as supplier_name, ec.name as category_name FROM purchase_orders po LEFT JOIN suppliers s ON po.supplier_id = s.id LEFT JOIN esic_categories ec ON po.category_id = ec.id WHERE po.id = $1`, [poId]);
    const po = poResult.rows[0];
    if (!po) throw new Error('PO not found');
    
    const existing = await client.query(`SELECT id FROM journal_entries WHERE reference_type = 'purchase_order' AND reference_id = $1`, [poId]);
    if (existing.rows.length > 0) { await client.query('ROLLBACK'); return { message: 'Journal entry already exists', journal_entry_id: existing.rows[0].id }; }
    
    const entryNumber = await generateJournalEntryNumber(po.tenant_id);
    const tax = await calculateTax(poId);
    
    const entryResult = await client.query(`INSERT INTO journal_entries (tenant_id, entry_number, entry_date, entry_type, reference_type, reference_id, description, total_debit, total_credit) VALUES ($1, $2, $3, 'PURCHASE_ORDER', 'purchase_order', $4, $5, $6, $7) RETURNING *`, [po.tenant_id, entryNumber, po.po_date, poId, `Purchase Order ${po.po_number} - ${po.category_name || 'Supplies'}`, po.subtotal + tax.vat_amount, po.subtotal + tax.vat_amount]);
    const journalEntry = entryResult.rows[0];
    
    await client.query(`INSERT INTO journal_entry_lines (tenant_id, journal_entry_id, line_number, account_id, debit_amount, credit_amount, description) VALUES ($1, $2, 1, 23, $3, 0, $4)`, [po.tenant_id, journalEntry.id, po.subtotal, `Purchases - ${po.category_name || 'Supplies'}`]);
    if (tax.vat_amount > 0) await client.query(`INSERT INTO journal_entry_lines (tenant_id, journal_entry_id, line_number, account_id, debit_amount, credit_amount, description) VALUES ($1, $2, 2, 13, $3, 0, 'VAT Input')`, [po.tenant_id, journalEntry.id, tax.vat_amount]);
    await client.query(`INSERT INTO journal_entry_lines (tenant_id, journal_entry_id, line_number, account_id, debit_amount, credit_amount, description) VALUES ($1, $2, $3, 12, 0, $4, $5)`, [po.tenant_id, journalEntry.id, tax.vat_amount > 0 ? 3 : 2, po.subtotal + tax.vat_amount, `Accounts Payable - ${po.supplier_name || 'Supplier'}`]);
    
    await client.query('COMMIT');
    return journalEntry;
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}

async function createJournalEntryFromReceipt(receiptId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const receiptResult = await client.query(`SELECT wr.*, po.category_id, ec.name as category_name FROM warehouse_receipts wr LEFT JOIN purchase_orders po ON wr.po_id = po.id LEFT JOIN esic_categories ec ON wr.category_id = ec.id WHERE wr.id = $1`, [receiptId]);
    const receipt = receiptResult.rows[0];
    if (!receipt) throw new Error('Receipt not found');
    
    const existing = await client.query(`SELECT id FROM journal_entries WHERE reference_type = 'warehouse_receipt' AND reference_id = $1`, [receiptId]);
    if (existing.rows.length > 0) { await client.query('ROLLBACK'); return { message: 'Journal entry already exists', journal_entry_id: existing.rows[0].id }; }
    
    const entryNumber = await generateJournalEntryNumber(receipt.tenant_id);
    const entryResult = await client.query(`INSERT INTO journal_entries (tenant_id, entry_number, entry_date, entry_type, reference_type, reference_id, description, total_debit, total_credit) VALUES ($1, $2, $3, 'WAREHOUSE_RECEIPT', 'warehouse_receipt', $4, $5, $6, $7) RETURNING *`, [receipt.tenant_id, entryNumber, receipt.received_at, receiptId, `Warehouse Receipt ${receipt.receipt_number} - ${receipt.category_name || 'Items'}`, receipt.quantity_accepted, receipt.quantity_accepted]);
    const journalEntry = entryResult.rows[0];
    
    await client.query(`INSERT INTO journal_entry_lines (tenant_id, journal_entry_id, line_number, account_id, debit_amount, credit_amount, description) VALUES ($1, $2, 1, 7, $3, 0, $4)`, [receipt.tenant_id, journalEntry.id, receipt.quantity_accepted, `Inventory - ${receipt.category_name || 'Items'}`]);
    await client.query(`INSERT INTO journal_entry_lines (tenant_id, journal_entry_id, line_number, account_id, debit_amount, credit_amount, description) VALUES ($1, $2, 2, 24, 0, $3, $4)`, [receipt.tenant_id, journalEntry.id, receipt.quantity_accepted, `Purchases - ${receipt.category_name || 'Items'} (COGS Recognition)`]);
    
    await client.query('COMMIT');
    return journalEntry;
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}

async function getJournalEntries(filters) {
  const { tenant_id, entry_type, limit = 100 } = filters;
  let query = `SELECT * FROM journal_entries WHERE tenant_id = $1`;
  const values = [tenant_id];
  if (entry_type) { query += ` AND entry_type = $2`; values.push(entry_type); }
  query += ` ORDER BY entry_date DESC LIMIT $${values.length + 1}`;
  values.push(limit);
  const result = await pool.query(query, values);
  return result.rows;
}

async function getBudgetVariance(tenantId, categoryId) {
  const query = `SELECT b.*, COALESCE(SUM(po.total_amount), 0) as actual_spending FROM budgets b LEFT JOIN purchase_orders po ON b.category_id = po.category_id AND po.status IN ('approved', 'sent', 'received') WHERE b.tenant_id = $1 AND b.category_id = $2 GROUP BY b.id`;
  const result = await pool.query(query, [tenantId, categoryId]);
  return result.rows[0];
}

module.exports = { createJournalEntryFromPO, createJournalEntryFromReceipt, getJournalEntries, getBudgetVariance };
