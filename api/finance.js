import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false });

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization, X-Correlation-ID, X-Tenant-ID');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const tenantId = req.query.tenant_id || 'tenant_default';
    const path = req.url.split('?')[0];
    if (path.includes('/journal')) return handleJournal(req, res, tenantId);
    res.status(404).json({ success: false, error: 'Endpoint not found' });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
}

async function handleJournal(req, res, tenantId) {
  if (req.method === 'GET') {
    const result = await pool.query(`SELECT id, entry_date, account_id, account_name, debit, credit, reference, status, created_at FROM journal_entries WHERE tenant_id = $1 ORDER BY entry_date DESC LIMIT 100`, [tenantId]);
    res.status(200).json({ success: true, data: result.rows, count: result.rows.length });
  } else if (req.method === 'POST') {
    const { entry_date, account_id, account_name, debit, credit, reference } = req.body;
    const result = await pool.query(`INSERT INTO journal_entries (tenant_id, entry_date, account_id, account_name, debit, credit, reference, status) VALUES ($1, $2, $3, $4, $5, $6, $7, 'posted') RETURNING *`, [tenantId, entry_date, account_id, account_name, debit, credit, reference]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } else res.status(405).json({ success: false, error: 'Method not allowed' });
}
