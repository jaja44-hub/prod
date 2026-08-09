/* S4 Audit — live validation across main + accounting DBs */
import { getPool } from '../api/lib/shared.js';

const TENANT = 'tenant_default';

function summarize(label, rows) {
  console.log(`\n=== ${label} ===`);
  console.log(`  count: ${rows.length}`);
  if (rows[0]) console.log('  sample:', JSON.stringify(rows[0], null, 2).slice(0, 600));
}

const main = getPool();
const acct = getPool('accounting');

// Sales — main pool
const salesOrders = (await main.query('SELECT id, order_number, customer_name, order_date, total_amount, status FROM sales_orders WHERE tenant_id = $1 ORDER BY order_date DESC', [TENANT])).rows;
summarize('SALES ORDERS (main DB)', salesOrders);

const salesCustomers = (await main.query('SELECT id, customer_code, name, city, active FROM customers WHERE tenant_id = $1 ORDER BY name', [TENANT])).rows;
summarize('SALES CUSTOMERS (main DB)', salesCustomers);

// Sales order items / receipts for margin%?
const hasOrderItems = (await main.query("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='sales_order_items') ok")).rows[0].ok;
console.log(`\nhas sales_order_items table: ${Boolean(hasOrderItems)}`);
if (hasOrderItems) {
  const items = (await main.query('SELECT count(*)::int c FROM sales_order_items')).rows[0].c;
  console.log('sales_order_items count:', items);
}

// CRM
const crmOpps = (await main.query('SELECT id, name, customer_name, expected_value, status FROM crm_opportunities WHERE tenant_id = $1 ORDER BY created_at DESC', [TENANT])).rows;
summarize('CRM OPPORTUNITIES (main DB)', crmOpps);

// HR employees — accounting DB
const hasEmployees = (await acct.query("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='employees') ok")).rows[0].ok;
console.log(`\nhas employees table (accounting): ${Boolean(hasEmployees)}`);
if (hasEmployees) {
  const cols = (await acct.query("SELECT column_name FROM information_schema.columns WHERE table_name='employees' ORDER BY ordinal_position")).rows.map(r => r.column_name);
  console.log('employees columns:', cols.join(', '));
  const emps = (await acct.query('SELECT id, employee_id, first_name, last_name, department, position, salary, status FROM employees WHERE tenant_id = $1 LIMIT 20', [TENANT])).rows;
  summarize('HR EMPLOYEES (accounting DB)', emps);
}

// Analytics snapshot shape
const acctAccounts = (await acct.query("SELECT account_code, account_type, total FROM accounts WHERE tenant_id = $1 LIMIT 200", [TENANT])).rows;
summarize('ACCOUNTS (accounting DB) — for snapshot', acctAccounts.slice(0, 8));

await main.end();
await acct.end();
console.log('\n✔ S4 live audit complete');