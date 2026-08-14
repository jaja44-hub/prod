import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: 'postgresql://ja:localdev@127.0.0.1:5432/addiscrown_procurement_local' });
const res = await pool.query("SELECT id, code, name, parent_id, level FROM esic_categories ORDER BY level, code");
console.table(res.rows);
await pool.end();
