import pg from 'pg';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const match = env.match(/DATABASE_URL\s*=\s*(.+)/);

const pool = new pg.Pool({
  connectionString: match[1].trim(),
  ssl: { rejectUnauthorized: false },
  max: 2,
  connectionTimeoutMillis: 15000,
});

async function verify() {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT count(*) as count FROM esic_categories');
    console.log(`ESIC Categories count: ${result.rows[0].count}`);
    
    const categories = await client.query('SELECT code, name, level FROM esic_categories ORDER BY code');
    console.log('\nCategories:');
    categories.rows.forEach(cat => {
      console.log(`  ${cat.code}: ${cat.name} (Level ${cat.level})`);
    });
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await client.end();
    await pool.end();
  }
}

verify();