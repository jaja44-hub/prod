/**
 * Test database connection
 */

const { Pool } = require('pg');
require('dotenv').config();

console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✓ Database connection successful');
    const result = await client.query('SELECT NOW()');
    console.log('Current time:', result.rows[0].now);
    client.release();
    await pool.end();
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    console.error('Error details:', error);
    await pool.end();
  }
}

testConnection();
