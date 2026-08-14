import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: 'postgresql://ja:localdev@127.0.0.1:5432/addiscrown_procurement_local' });
const res = await pool.query("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'esic_categories' ORDER BY ordinal_position");
console.table(res.rows);
await pool.end();
