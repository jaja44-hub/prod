#!/usr/bin/env node
import pg from 'pg';
const { Client } = pg;

const TENANTFINANCE_DB_URL = process.env.NEON_TENANTFINANCE_DB_URL;

if (!TENANTFINANCE_DB_URL) {
  console.error('Set NEON_TENANTFINANCE_DB_URL in .env.local before running this script (no hardcoded credentials).');
  process.exit(1);
}

async function seedTenantFinanceData() {
  const client = new Client({ connectionString: TENANTFINANCE_DB_URL });
  await client.connect();
  
  console.log('Seeding tenant finance data...\n');
  
  const subscriptions = [
    { tenant_id: 'tenant_default', plan_type: 'Enterprise', start_date: '2026-01-01', end_date: '2026-12-31', monthly_fee: 5000, status: 'active' },
    { tenant_id: 'tenant_demo', plan_type: 'Professional', start_date: '2026-02-01', end_date: '2026-08-31', monthly_fee: 2500, status: 'active' },
    { tenant_id: 'tenant_test', plan_type: 'Starter', start_date: '2026-03-01', end_date: '2026-06-30', monthly_fee: 1000, status: 'trial' }
  ];
  
  console.log('Inserting tenant subscriptions...');
  for (const sub of subscriptions) {
    await client.query(
      `INSERT INTO tenant_subscriptions (tenant_id, plan_type, start_date, end_date, monthly_fee, status) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       ON CONFLICT (tenant_id) DO UPDATE SET 
       plan_type = EXCLUDED.plan_type, 
       end_date = EXCLUDED.end_date, 
       monthly_fee = EXCLUDED.monthly_fee, 
       status = EXCLUDED.status`,
      [sub.tenant_id, sub.plan_type, sub.start_date, sub.end_date, sub.monthly_fee, sub.status]
    );
  }
  console.log(`✓ ${subscriptions.length} subscriptions inserted`);
  
  const billing = [
    { tenant_id: 'tenant_default', billing_period: '2026-01-01', amount: 5000, status: 'paid', due_date: '2026-02-15', paid_date: '2026-02-10' },
    { tenant_id: 'tenant_default', billing_period: '2026-02-01', amount: 5000, status: 'paid', due_date: '2026-03-15', paid_date: '2026-03-12' },
    { tenant_id: 'tenant_default', billing_period: '2026-03-01', amount: 5000, status: 'pending', due_date: '2026-04-15', paid_date: null },
    { tenant_id: 'tenant_demo', billing_period: '2026-02-01', amount: 2500, status: 'paid', due_date: '2026-03-15', paid_date: '2026-03-14' },
    { tenant_id: 'tenant_demo', billing_period: '2026-03-01', amount: 2500, status: 'pending', due_date: '2026-04-15', paid_date: null }
  ];
  
  console.log('Inserting tenant billing records...');
  for (const bill of billing) {
    await client.query(
      `INSERT INTO tenant_billing (tenant_id, billing_period, amount, status, due_date, paid_date) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [bill.tenant_id, bill.billing_period, bill.amount, bill.status, bill.due_date, bill.paid_date]
    );
  }
  console.log(`✓ ${billing.length} billing records inserted`);
  
  const usageMetrics = [
    { tenant_id: 'tenant_default', metric_name: 'api_calls', metric_value: 15000, recorded_at: '2026-01-31' },
    { tenant_id: 'tenant_default', metric_name: 'storage_mb', metric_value: 2500, recorded_at: '2026-01-31' },
    { tenant_id: 'tenant_default', metric_name: 'active_users', metric_value: 45, recorded_at: '2026-01-31' },
    { tenant_id: 'tenant_default', metric_name: 'api_calls', metric_value: 18000, recorded_at: '2026-02-28' },
    { tenant_id: 'tenant_default', metric_name: 'storage_mb', metric_value: 2800, recorded_at: '2026-02-28' },
    { tenant_id: 'tenant_default', metric_name: 'active_users', metric_value: 52, recorded_at: '2026-02-28' },
    { tenant_id: 'tenant_demo', metric_name: 'api_calls', metric_value: 5000, recorded_at: '2026-02-28' },
    { tenant_id: 'tenant_demo', metric_name: 'storage_mb', metric_value: 800, recorded_at: '2026-02-28' },
    { tenant_id: 'tenant_demo', metric_name: 'active_users', metric_value: 15, recorded_at: '2026-02-28' }
  ];
  
  console.log('Inserting tenant usage metrics...');
  for (const metric of usageMetrics) {
    await client.query(
      `INSERT INTO tenant_usage_metrics (tenant_id, metric_name, metric_value, recorded_at) 
       VALUES ($1, $2, $3, $4)`,
      [metric.tenant_id, metric.metric_name, metric.metric_value, metric.recorded_at]
    );
  }
  console.log(`✓ ${usageMetrics.length} usage metrics inserted`);
  
  await client.end();
  console.log('\n✅ Tenant finance data seeded successfully!');
}

seedTenantFinanceData().catch(console.error);
