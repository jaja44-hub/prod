import pg from 'pg';

console.log('🔌 Testing Neon DB Connectivity');
console.log('================================\n');

// Test 1: Basic connection with pooled endpoint
async function testPooledConnection() {
  console.log('📡 Test 1: Pooled connection...');
  const client = new pg.Client({
    connectionString: 'postgresql://neondb_owner:npg_3ILp5RwOHjor@ep-patient-fog-at5jnnt6-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require',
  });
  
  try {
    await client.connect();
    console.log('  ✅ Connected to pooled endpoint');
    const result = await client.query('SELECT NOW()');
    console.log(`  ✅ Query successful: ${result.rows[0].now}`);
    await client.end();
    return true;
  } catch (err) {
    console.error('  ❌ Failed:', err.message);
    try { await client.end(); } catch {}
    return false;
  }
}

// Test 2: Non-pooled connection
async function testUnpooledConnection() {
  console.log('📡 Test 2: Unpooled connection...');
  const client = new pg.Client({
    connectionString: 'postgresql://neondb_owner:npg_3ILp5RwOHjor@ep-patient-fog-at5jnnt6.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require',
  });
  
  try {
    await client.connect();
    console.log('  ✅ Connected to unpooled endpoint');
    const result = await client.query('SELECT NOW()');
    console.log(`  ✅ Query successful: ${result.rows[0].now}`);
    await client.end();
    return true;
  } catch (err) {
    console.error('  ❌ Failed:', err.message);
    try { await client.end(); } catch {}
    return false;
  }
}

// Test 3: Check if tables exist
async function testTableExists() {
  console.log('📡 Test 3: Check if tables exist...');
  const client = new pg.Client({
    connectionString: 'postgresql://neondb_owner:npg_3ILp5RwOHjor@ep-patient-fog-at5jnnt6-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require',
  });
  
  try {
    await client.connect();
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    console.log(`  ✅ Found ${result.rows.length} tables:`);
    result.rows.forEach(row => {
      console.log(`     - ${row.table_name}`);
    });
    await client.end();
    return true;
  } catch (err) {
    console.error('  ❌ Failed:', err.message);
    try { await client.end(); } catch {}
    return false;
  }
}

// Test 4: Check data counts
async function testDataCounts() {
  console.log('📡 Test 4: Check data counts...');
  const client = new pg.Client({
    connectionString: 'postgresql://neondb_owner:npg_3ILp5RwOHjor@ep-patient-fog-at5jnnt6-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require',
  });
  
  try {
    await client.connect();
    
    const tables = ['vendor_bills', 'customer_invoices', 'warehouse_metrics', 'sales_analytics'];
    for (const table of tables) {
      try {
        const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`     ${table}: ${result.rows[0].count} records`);
      } catch (err) {
        console.log(`     ${table}: ERROR - ${err.message}`);
      }
    }
    
    await client.end();
    return true;
  } catch (err) {
    console.error('  ❌ Failed:', err.message);
    try { await client.end(); } catch {}
    return false;
  }
}

async function main() {
  const results = {
    pooled: await testPooledConnection(),
    unpooled: await testUnpooledConnection(),
    tables: await testTableExists(),
    data: await testDataCounts(),
  };

  console.log('\n' + '='.repeat(60));
  console.log('📋 CONNECTIVITY SUMMARY');
  console.log('='.repeat(60));
  console.log(`Pooled: ${results.pooled ? '✅' : '❌'}`);
  console.log(`Unpooled: ${results.unpooled ? '✅' : '❌'}`);
  console.log(`Tables: ${results.tables ? '✅' : '❌'}`);
  console.log(`Data: ${results.data ? '✅' : '❌'}`);
  console.log('='.repeat(60) + '\n');

  if (results.pooled || results.unpooled) {
    console.log('✅ Neon DB is accessible\n');
  } else {
    console.log('❌ Neon DB is NOT accessible - check network/firewall\n');
  }
}

main();
