import pg from 'pg';
const { Pool } = pg;
// Use the remote Neon procurement database URL from .env
const pool = new Pool({ 
  connectionString: 'postgresql://neondb_owner:npg_gt5VHKpS8RDk@ep-red-dust-avdqp1ld.c-11.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});
const res = await pool.query("SELECT id, code, name, parent_id, level FROM esic_categories ORDER BY level, code");
console.table(res.rows);
await pool.end();
