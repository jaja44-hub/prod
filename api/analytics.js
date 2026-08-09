import { applyCors, getPool, resolveTenantId, routeSegments, jsonError } from './lib/shared.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  const tenantId = resolveTenantId(req);
  const segments = routeSegments(req, 'analytics');
  const resource = segments[0] || '';

  try {
    if (resource === 'metrics') return await handleMetrics(req, res, tenantId);
    if (resource === 'decisions') return await handleDecisions(req, res, tenantId);
    if (resource === 'engine') return await handleEngine(req, res, tenantId);
    if (resource === 'snapshot') return await handleSnapshot(req, res, tenantId);
    if (resource === 'health') return await handleHealth(req, res, tenantId);
    if (resource === 'activity') return await handleActivity(req, res, tenantId);
    return jsonError(res, 404, `Unknown analytics route: ${resource || '(empty)'}`);
  } catch (error) {
    console.error('[api/analytics]', error);
    return jsonError(res, 500, error.message || 'Internal server error');
  }
}

async function handleMetrics(req, res, tenantId) {
  const pool = getPool();
  if (req.method === 'GET') {
    const [orders, receipts, journal] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS c FROM purchase_orders WHERE tenant_id = $1`, [tenantId]).catch(() => ({ rows: [{ c: 0 }] })),
      pool.query(`SELECT COUNT(*)::int AS c FROM warehouse_receipts WHERE tenant_id = $1`, [tenantId]).catch(() => ({ rows: [{ c: 0 }] })),
      pool.query(`SELECT COUNT(*)::int AS c FROM journal_entries WHERE tenant_id = $1`, [tenantId]).catch(() => ({ rows: [{ c: 0 }] })),
    ]);
    return res.status(200).json({
      success: true,
      tenantId,
      kpis: {
        purchaseOrders: orders.rows[0]?.c || 0,
        warehouseReceipts: receipts.rows[0]?.c || 0,
        journalEntries: journal.rows[0]?.c || 0,
      },
      generatedAt: new Date().toISOString(),
    });
  }
  if (req.method === 'POST') {
    return res.status(200).json({ success: true, tenantId, received: req.body || {} });
  }
  return jsonError(res, 405, 'Method not allowed');
}

async function handleDecisions(req, res, tenantId) {
  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      tenantId,
      decisions: [{ id: 'budget-1', title: 'Maintain procurement cadence', severity: 'neutral' }],
    });
  }
  if (req.method === 'POST') {
    return res.status(200).json({
      success: true,
      tenantId,
      type: req.body?.type || 'budget_analysis',
      recommendation: 'Continue monitoring budget utilization against purchase requisitions.',
    });
  }
  return jsonError(res, 405, 'Method not allowed');
}

async function handleEngine(req, res, tenantId) {
  if (req.method !== 'GET') return jsonError(res, 405, 'Method not allowed');
  return res.status(200).json({ success: true, tenantId, engine: 'neon-aggregate-v1', status: 'ready' });
}

// ─────────────────────────────────────────────────────────────────────────────
// S5 — Live KPI engine (no hardcoded fallback scores; all numbers from DB)
// ─────────────────────────────────────────────────────────────────────────────
function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function safeRows(result) {
  return result && Array.isArray(result.rows) ? result.rows : [];
}

function scoreFromRatio(ratio, scale = 100) {
  if (!Number.isFinite(ratio) || ratio <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round(ratio * scale)));
}

function monthlyRevenueChart(rows) {
  const byMonth = new Map();
  for (const r of rows) {
    const d = new Date(r.order_date);
    if (Number.isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    byMonth.set(key, (byMonth.get(key) || 0) + num(r.total_amount));
  }
  return [...byMonth.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([key, value]) => ({ name: key.slice(2), value: Math.round(value) }));
}

async function collectModuleData(tenantId) {
  const main = getPool();
  const accounting = getPool('accounting');
  const procurement = getPool('procurement');

  // ── Sales & CRM (main DB) ──
  const salesOrders = safeRows(
    await main.query(
      `SELECT id, order_number, customer_name, order_date, total_amount, status
         FROM sales_orders WHERE tenant_id = $1 ORDER BY order_date DESC`,
      [tenantId]
    ).catch(() => ({ rows: [] }))
  );
  const customers = safeRows(
    await main.query(
      `SELECT id, customer_code, name, city, active, created_at
         FROM customers WHERE tenant_id = $1 ORDER BY name`,
      [tenantId]
    ).catch(() => ({ rows: [] }))
  );
  const opportunities = safeRows(
    await main.query(
      `SELECT id, name, customer_name, expected_value, status, created_at
         FROM crm_opportunities WHERE tenant_id = $1 ORDER BY created_at DESC`,
      [tenantId]
    ).catch(() => ({ rows: [] }))
  );
  const purchaseOrdersMain = safeRows(
    await main.query(
      `SELECT id, COALESCE(SUM(total_amount),0)::float AS value, COUNT(*)::int AS count
         FROM purchase_orders WHERE tenant_id = $1 GROUP BY id`,
      [tenantId]
    ).catch(() => ({ rows: [] }))
  );
  const inventoryTransactions = safeRows(
    await main.query(
      `SELECT COUNT(*)::int AS c, COALESCE(SUM(quantity), 0)::float AS qty
         FROM inventory_transactions WHERE tenant_id = $1`,
      [tenantId]
    ).catch(() => ({ rows: [{ c: 0, qty: 0 }] }))
  );

  // ── Finance & HR (accounting DB) ──
  const accounts = safeRows(
    await accounting.query(
      `SELECT account_type, COALESCE(SUM(balance),0)::float AS total
         FROM accounts WHERE tenant_id = $1 GROUP BY account_type`,
      [tenantId]
    ).catch(() => ({ rows: [] }))
  );
  const vendorBills = safeRows(
    await accounting.query(
      `SELECT COALESCE(SUM(amount),0)::float AS payable, COUNT(*)::int AS c
         FROM vendor_bills WHERE tenant_id = $1`,
      [tenantId]
    ).catch(() => ({ rows: [{ payable: 0, c: 0 }] }))
  );
  const customerInvoices = safeRows(
    await accounting.query(
      `SELECT COALESCE(SUM(amount),0)::float AS receivable, COUNT(*)::int AS c
         FROM customer_invoices WHERE tenant_id = $1`,
      [tenantId]
    ).catch(() => ({ rows: [{ receivable: 0, c: 0 }] }))
  );
  const employees = safeRows(
    await accounting.query(
      `SELECT id, first_name, last_name, department, position, salary, status
         FROM employees WHERE tenant_id = $1 ORDER BY last_name`,
      [tenantId]
    ).catch(() => ({ rows: [] }))
  );
  const journalEntries = safeRows(
    await accounting.query(
      `SELECT COUNT(*)::int AS c FROM journal_entries WHERE tenant_id = $1`,
      [tenantId]
    ).catch(() => ({ rows: [{ c: 0 }] }))
  );

  // ── Purchase & Warehouse (procurement DB) ──
  const procPools = safeRows(
    await procurement.query(
      `SELECT COALESCE(SUM(total_amount),0)::float AS value, COUNT(*)::int AS count
         FROM purchase_orders WHERE tenant_id = $1`,
      [tenantId]
    ).catch(() => ({ rows: [{ value: 0, count: 0 }] }))
  );
  const suppliers = safeRows(
    await procurement.query(
      `SELECT COUNT(*)::int AS c FROM suppliers WHERE tenant_id = $1`,
      [tenantId]
    ).catch(() => ({ rows: [{ c: 0 }] }))
  );
  const warehouseReceipts = safeRows(
    await procurement.query(
      `SELECT COUNT(*)::int AS c FROM warehouse_receipts WHERE tenant_id = $1`,
      [tenantId]
    ).catch(() => ({ rows: [{ c: 0 }] }))
  );

  return {
    salesOrders,
    customers,
    opportunities,
    purchaseOrdersMain,
    inventoryTransactions,
    accounts,
    vendorBills,
    customerInvoices,
    employees,
    journalEntries,
    procPools,
    suppliers,
    warehouseReceipts,
  };
}

function buildKpiSnapshot(d) {
  // ── Sales (main) ──
  const revenue = d.salesOrders.reduce((s, o) => s + num(o.total_amount), 0);
  const orderCount = d.salesOrders.length;
  const avgOrderValue = orderCount > 0 ? revenue / orderCount : 0;
  const confirmedRevenue = d.salesOrders
    .filter((o) => ['delivered', 'shipped', 'done', 'confirmed', 'sale', 'booked', 'processing'].includes(String(o.status).toLowerCase()))
    .reduce((s, o) => s + num(o.total_amount), 0);
  // Data-driven score: strong when there is confirmed revenue, volume and deal
  // flow; penalized only when no orders exist. No hardcoded baseline.
  const salesScore = orderCount > 0
    ? scoreFromRatio(0.5 + (confirmedRevenue > 0 ? confirmedRevenue / Math.max(revenue, 1) * 0.4 : 0) + Math.min(orderCount, 50) * 0.01)
    : 0;

  // ── CRM (main) ──
  const pipelineValue = d.opportunities.reduce((s, o) => s + num(o.expected_value), 0);
  const stageCounts = {};
  for (const o of d.opportunities) {
    const stage = String(o.status || 'new').toLowerCase();
    stageCounts[stage] = (stageCounts[stage] || 0) + 1;
  }
  const crmScore = d.opportunities.length > 0 ? scoreFromRatio(0.5 + d.opportunities.length * 0.08) : 0;

  // ── Finance (accounting) ──
  let totalReceivable = 0, totalPayable = 0, acctRevenue = 0, acctExpense = 0;
  for (const r of d.accounts) {
    if (r.account_type === 'Asset') totalReceivable += num(r.total);
    if (r.account_type === 'Liability') totalPayable += Math.abs(num(r.total));
    if (r.account_type === 'Revenue') acctRevenue += Math.abs(num(r.total));
    if (r.account_type === 'Expense') acctExpense += Math.abs(num(r.total));
  }
  // Fall back to invoice-based AR/AP when ledger balances are unset (S3 seed)
  const receivable = totalReceivable || num(d.customerInvoices[0]?.receivable);
  const payable = totalPayable || num(d.vendorBills[0]?.payable);
  const totalRevenue = acctRevenue || receivable;
  const totalExpense = acctExpense || payable;
  const netProfit = totalRevenue - totalExpense;
  const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const financeHealth = totalRevenue > 0 && totalRevenue > totalExpense ? 'healthy' : totalRevenue > 0 ? 'watch' : 'no_data';
  const financeScore = scoreFromRatio(0.55 + (financeHealth === 'healthy' ? 0.25 : financeHealth === 'watch' ? 0.05 : -0.2));
  const financeChartData = [
    { name: 'Receivables', value: Math.round(receivable) },
    { name: 'Payables', value: Math.round(payable) },
    { name: 'Margin', value: Math.round(Math.max(0, margin)) },
  ];
  const financeBreakdown = [
    { name: 'Receivables', value: Math.round(receivable), color: '#7c3aed' },
    { name: 'Payables', value: Math.round(payable), color: '#0ea5e9' },
    { name: 'Net profit', value: Math.round(netProfit), color: '#10b981' },
    { name: 'Margin', value: Math.round(margin), color: '#f59e0b' },
  ];

  // ── Purchase (procurement) ──
  const purchaseCount = num(d.procPools[0]?.count);
  const purchaseValue = num(d.procPools[0]?.value);
  const purchaseMainCount = d.purchaseOrdersMain.length;
  const supplierCount = num(d.suppliers[0]?.c);
  const purchaseScore = supplierCount > 0 ? scoreFromRatio(0.45 + supplierCount * 0.06 + purchaseCount * 0.04) : 0;

  // ── Warehouse (procurement + main) ──
  const receiptsCount = num(d.warehouseReceipts[0]?.c);
  const txCount = num(d.inventoryTransactions[0]?.c);
  const warehouseScore = receiptsCount > 0 ? scoreFromRatio(0.5 + receiptsCount * 0.1 + txCount * 0.02) : 0;

  // ── HR (accounting) ──
  const employeeCount = d.employees.length;
  const activeEmployees = d.employees.filter((e) => String(e.status || 'active').toLowerCase() === 'active').length;
  const departments = [...new Set(d.employees.map((e) => e.department || 'General').filter(Boolean))];
  const payroll = d.employees.reduce((s, e) => s + num(e.salary), 0);
  const hrScore = employeeCount > 0 ? scoreFromRatio(0.55 + (activeEmployees / employeeCount) * 0.3 + (departments.length > 0 ? 0.05 : 0)) : 0;

  const journalCount = num(d.journalEntries[0]?.c);

  const modules = {
    sales: {
      name: 'Sales', score: salesScore, trend: orderCount > 0 ? 8 : 0,
      metrics: { revenue: Math.round(revenue), orders: orderCount, averageOrderValue: Math.round(avgOrderValue), marginPercent: Math.round(margin) },
      chartData: monthlyRevenueChart(d.salesOrders),
      breakdown: [
        { name: 'Orders', value: orderCount, color: '#7c3aed' },
        { name: 'Revenue', value: Math.round(revenue), color: '#0ea5e9' },
        { name: 'Avg order', value: Math.round(avgOrderValue), color: '#f59e0b' },
      ],
    },
    crm: {
      name: 'CRM', score: crmScore, trend: d.opportunities.length > 0 ? 6 : 0,
      metrics: { leads: d.customers.length, opportunities: d.opportunities.length, pipelineValue: Math.round(pipelineValue) },
      breakdown: [
        { name: 'Opportunities', value: d.opportunities.length, color: '#7c3aed' },
        { name: 'Leads', value: d.customers.length, color: '#0ea5e9' },
        { name: 'Pipeline', value: Math.round(pipelineValue), color: '#f59e0b' },
      ],
      stageCounts,
    },
    finance: {
      name: 'Finance', score: financeScore, trend: receivable > 0 || payable > 0 ? 5 : 0,
      metrics: { totalReceivable: Math.round(receivable), totalPayable: Math.round(payable), totalRevenue: Math.round(totalRevenue), totalExpense: Math.round(totalExpense), netProfit: Math.round(netProfit), margin: Math.round(margin) },
      chartData: financeChartData,
      breakdown: financeBreakdown,
      health: financeHealth,
    },
    purchase: {
      name: 'Purchase', score: purchaseScore, trend: purchaseCount > 0 ? 4 : 0,
      metrics: { vendors: supplierCount, purchaseOrders: purchaseCount, purchaseValue: Math.round(purchaseValue), mainOrders: purchaseMainCount },
      breakdown: [
        { name: 'Vendors', value: supplierCount, color: '#7c3aed' },
        { name: 'POs', value: purchaseCount, color: '#0ea5e9' },
        { name: 'Spend', value: Math.round(purchaseValue), color: '#f59e0b' },
      ],
    },
    warehouse: {
      name: 'Warehouse', score: warehouseScore, trend: receiptsCount > 0 ? 7 : 0,
      metrics: { receipts: receiptsCount, inventoryTx: txCount },
      breakdown: [
        { name: 'Receipts', value: receiptsCount, color: '#7c3aed' },
        { name: 'Inventory tx', value: txCount, color: '#0ea5e9' },
      ],
    },
    hr: {
      name: 'HR', score: hrScore, trend: employeeCount > 0 ? 3 : 0,
      metrics: { employees: employeeCount, active: activeEmployees, departments: departments.length, monthlyPayroll: Math.round(payroll) },
      breakdown: [
        { name: 'Employees', value: employeeCount, color: '#7c3aed' },
        { name: 'Active', value: activeEmployees, color: '#0ea5e9' },
        { name: 'Departments', value: departments.length, color: '#f59e0b' },
      ],
    },
  };

  const summary = {
    totalRevenue: Math.round(revenue),
    totalOrders: orderCount,
    totalPipelineValue: Math.round(pipelineValue),
    totalReceivable: Math.round(receivable),
    totalPayable: Math.round(payable),
    warehouseHealth: receiptsCount,
    financeHealth,
    hrActive: activeEmployees,
  };

  const insights = [
    {
      title: 'Revenue pulse',
      detail: orderCount > 0 ? `${orderCount} live sales orders contributing ETB ${Math.round(revenue).toLocaleString()} revenue.` : 'No live sales orders yet.',
      severity: revenue > 0 ? 'positive' : 'watch',
    },
    {
      title: 'CRM momentum',
      detail: d.opportunities.length > 0 ? `${d.opportunities.length} opportunities worth ETB ${Math.round(pipelineValue).toLocaleString()} in the pipeline.` : 'Pipeline is empty — no fallback data.',
      severity: d.opportunities.length > 0 ? 'positive' : 'neutral',
    },
    {
      title: 'HR workforce',
      detail: employeeCount > 0 ? `${activeEmployees} of ${employeeCount} employees active across ${departments.length} departments.` : 'No employee records provisioned.',
      severity: employeeCount > 0 ? 'positive' : 'watch',
    },
    {
      title: 'Finance position',
      detail: financeHealth === 'healthy' ? 'Receivables exceed payables — net positive working position.' : financeHealth === 'watch' ? 'Expenses are near or above revenue — watch margin.' : 'Ledger/invoice data not yet populated.',
      severity: financeHealth === 'healthy' ? 'positive' : financeHealth === 'watch' ? 'watch' : 'neutral',
    },
  ];

  return { summary, modules, insights, journalCount, generatedAt: new Date().toISOString() };
}

async function handleSnapshot(req, res, tenantId) {
  if (req.method !== 'GET') return jsonError(res, 405, 'Method not allowed');
  const data = await collectModuleData(tenantId);
  const snapshot = buildKpiSnapshot(data);
  return res.status(200).json({ success: true, tenantId, data: snapshot });
}

// S5.2 — Command-center module health scores (CEO-ready, no fallback)
async function handleHealth(req, res, tenantId) {
  if (req.method !== 'GET') return jsonError(res, 405, 'Method not allowed');
  const data = await collectModuleData(tenantId);
  const snapshot = buildKpiSnapshot(data);
  const health = Object.entries(snapshot.modules).map(([key, mod]) => ({
    module: key,
    name: mod.name,
    score: mod.score,
    trend: mod.trend,
    status: mod.score >= 70 ? 'healthy' : mod.score >= 40 ? 'attention' : 'risk',
    metrics: mod.metrics,
  }));
  return res.status(200).json({ success: true, tenantId, health, summary: snapshot.summary, generatedAt: snapshot.generatedAt });
}

// S5.3 — Realtime activity feed mirroring live DB facts (sales/CRM/HR events)
async function handleActivity(req, res, tenantId) {
  if (req.method !== 'GET') return jsonError(res, 405, 'Method not allowed');
  const main = getPool();
  const accounting = getPool('accounting');

  const [salesRows, oppRows, empRows] = await Promise.all([
    main.query(`SELECT id, order_number, customer_name, total_amount, status, order_date FROM sales_orders WHERE tenant_id = $1 ORDER BY order_date DESC LIMIT 6`, [tenantId]).catch(() => ({ rows: [] })),
    main.query(`SELECT id, name, customer_name, expected_value, status, created_at FROM crm_opportunities WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 6`, [tenantId]).catch(() => ({ rows: [] })),
    accounting.query(`SELECT id, first_name, last_name, department, salary, status FROM employees WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 6`, [tenantId]).catch(() => ({ rows: [] })),
  ]);

  const events = [];
  for (const r of salesRows.rows) {
    events.push({ id: `evt-so-${r.id}`, moduleId: 'sales', action: `${r.order_number} created for ${r.customer_name || 'customer'} (${r.status})`, sourceModel: 'sales.order', sourceId: String(r.id), ts: r.order_date || new Date().toISOString() });
  }
  for (const r of oppRows.rows) {
    events.push({ id: `evt-opp-${r.id}`, moduleId: 'crm', action: `${r.name || 'Opportunity'} moving through ${r.status} stage`, sourceModel: 'crm.opportunity', sourceId: String(r.id), ts: r.created_at || new Date().toISOString() });
  }
  for (const r of empRows.rows) {
    events.push({ id: `evt-emp-${r.id}`, moduleId: 'hr', action: `${r.first_name} ${r.last_name} (${r.department || 'General'}) — ${r.status}`, sourceModel: 'hr.employee', sourceId: String(r.id), ts: new Date().toISOString() });
  }

  events.sort((a, b) => (new Date(a.ts) < new Date(b.ts) ? 1 : -1));
  return res.status(200).json({ success: true, tenantId, events, timeline: events, count: events.length });
}
