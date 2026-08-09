#!/usr/bin/env node
/**
 * S2.2 — Seed the procurement local DB with a coherent live purchase flow.
 *
 * Targets ONLY `addiscrown_procurement_local` (per-DB discipline). Reads from
 * `.env.local` (LOCAL_PG_*). Idempotent (safe to re-run). Heals the dangling
 * `supplier_performance` references and gives the UI/API real rows to read:
 *   suppliers → products → budget → requisition+items → PO+items →
 *   warehouse receipt+items → inventory ledger → budget commitment.
 *
 * Usage:
 *   node scripts/seed-procurement.local.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DB_NAME = 'addiscrown_procurement_local';
const TENANT = 'tenant_default';

function loadEnvLocal() {
  const vars = {};
  const envPath = path.join(ROOT, '.env.local');
  if (!fs.existsSync(envPath)) {
    throw new Error('.env.local not found — set LOCAL_PG_* for the local Postgres.');
  }
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) vars[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return vars;
}

const env = loadEnvLocal();
const client = new pg.Client({
  host: env.LOCAL_PG_HOST || '127.0.0.1',
  port: Number(env.LOCAL_PG_PORT || 5432),
  user: env.LOCAL_PG_USER,
  password: env.LOCAL_PG_PASSWORD,
  database: DB_NAME,
});

const suppliers = [
  { code: 'SUP-2026-000001', name: 'Ethio Steel Manufacturing', tax_id: 'ET100001', email: 'procurement@ethiosteel.com.et', phone: '+251-11-555-1234', city: 'Addis Ababa', region: 'Addis Ababa', category_id: 103, vat_registered: true, rating: 5 },
  { code: 'SUP-2026-000002', name: 'Addis Pharmaceutical Factory', tax_id: 'ET100002', email: 'orders@addispharma.com.et', phone: '+251-11-555-2345', city: 'Addis Ababa', region: 'Addis Ababa', category_id: 101, vat_registered: true, rating: 4 },
  { code: 'SUP-2026-000003', name: 'Messebo Cement Factory', tax_id: 'ET100003', email: 'sales@messebo.com.et', phone: '+251-34-440-1234', city: 'Mekelle', region: 'Tigray', category_id: 106, vat_registered: false, rating: 4 },
  { code: 'SUP-2026-000004', name: 'Ethiopian Electric Power Corp', tax_id: 'ET100004', email: 'procurement@eepc.gov.et', phone: '+251-11-555-3456', city: 'Addis Ababa', region: 'Addis Ababa', category_id: 104, vat_registered: true, rating: 5 },
  { code: 'SUP-2026-000005', name: 'Dashen Brewery', tax_id: 'ET100005', email: 'supply@dashenbrewery.com.et', phone: '+251-58-220-1234', city: 'Gondar', region: 'Amhara', category_id: 103, vat_registered: true, rating: 3 },
];

const products = [
  { sku: 'STL-001', name: 'Steel Rebar 12mm', uom: 'TON', cost_price: 88000, selling_price: 96500, category_id: 103, barcode: '100000000001' },
  { sku: 'CMC-001', name: 'Portland Cement 50kg', uom: 'BAG', cost_price: 720, selling_price: 800, category_id: 106, barcode: '100000000002' },
  { sku: 'PHA-001', name: 'Amoxicillin 500mg (100)', uom: 'BOX', cost_price: 1450, selling_price: 1640, category_id: 101, barcode: '100000000003' },
];

async function main() {
  await client.connect();
  console.log(`\n=== Seed procurement local (${DB_NAME}) ===`);

  // 1) Suppliers (idempotent on supplier_code)
  const supIds = {};
  for (const s of suppliers) {
    const r = await client.query(
      `INSERT INTO suppliers (
        tenant_id, supplier_code, name, tax_id, category_id, email, phone, city, region,
        country, vat_registered, vat_registration_number, rating, active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Ethiopia', $10, $11, $12, TRUE)
      ON CONFLICT (tenant_id, supplier_code) DO UPDATE SET name = EXCLUDED.name
      RETURNING id`,
      [TENANT, s.code, s.name, s.tax_id, s.category_id, s.email, s.phone, s.city, s.region,
       s.vat_registered, `VAT-${s.code.slice(-6)}`, s.rating]
    );
    supIds[s.name] = r.rows[0].id;
  }
  console.log(`✓ ${suppliers.length} suppliers`);

  // 2) Products (idempotent on sku)
  const prodIds = {};
  for (const p of products) {
    const r = await client.query(
      `INSERT INTO products (tenant_id, sku, name, unit_of_measure, category_id, cost_price, selling_price, barcode, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
       ON CONFLICT (tenant_id, sku) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [TENANT, p.sku, p.name, p.uom, p.category_id, p.cost_price, p.selling_price, p.barcode]
    );
    prodIds[p.sku] = r.rows[0].id;
  }
  console.log(`✓ ${products.length} products`);

  // 3) Heal supplier_performance dangling refs (suppliers 1,2,5 already point at ids → re-point)
  await client.query(
    `DELETE FROM supplier_performance
     WHERE tenant_id = $1 AND supplier_id NOT IN (SELECT id FROM suppliers WHERE tenant_id = $1)`,
    [TENANT]
  );
  console.log('✓ supplier_performance FKs healed');

  // 4) Budget (idempotent on budget_code; available_amount is a generated column)
  const budget = await client.query(
    `INSERT INTO budgets (
      tenant_id, budget_code, name, category_id, fiscal_year, fiscal_period,
      budgeted_amount, allocated_amount, committed_amount, actual_amount, currency, status
    ) VALUES ($1, 'BGT-2026-PROC', 'Procurement FY2026', 1, 2026, 'FY2026', 2000000, 1800000, 0, 0, 'ETB', 'active')
    ON CONFLICT (tenant_id, budget_code, fiscal_year, fiscal_period)
      DO UPDATE SET name = EXCLUDED.name, budgeted_amount = EXCLUDED.budgeted_amount
    RETURNING id`,
    [TENANT]
  );
  const budgetId = budget.rows[0].id;
  console.log(`✓ budget (id=${budgetId})`);

  // 4) Requisition + items (idempotent on requisition_number)
  const req = await client.query(
    `INSERT INTO purchase_requisitions (
      tenant_id, requisition_number, requisition_date, requested_by, requested_by_name,
      requested_by_role, department_id, total_amount, priority, status, budget_id, expected_delivery_date
    ) VALUES ($1, 'REQ-2026-0001', CURRENT_DATE, 'aemiro', 'Aemiro Tadesse', 'Operations Lead', 'OPS',
      156000, 'high', 'approved', $2, CURRENT_DATE + INTERVAL '21 days')
    ON CONFLICT (tenant_id, requisition_number) DO UPDATE SET status = EXCLUDED.status
    RETURNING id`,
    [TENANT, budgetId]
  );
  const reqId = req.rows[0].id;
  const reqItems = [
    { product: 'PHA-001', name: 'Amoxicillin 500mg (100 ct)', qty: 80, price: 1450, uom: 'BOX' },
    { product: 'STL-001', name: 'Steel Sheet 12mm', qty: 60, price: 88000, uom: 'TON' },
  ];
  for (let i = 0; i < reqItems.length; i++) {
    const l = reqItems[i];
    await client.query(
      `INSERT INTO purchase_requisition_items (
        requisition_id, line_number, product_id, product_name, quantity, unit_of_measure, unit_price
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT DO NOTHING`,
      [reqId, i + 1, prodIds[l.product], l.name, l.qty, l.uom, l.price]
    );
  }
  const reqTotal = reqItems.reduce((s, l) => s + l.qty * l.price, 0);
  await client.query(
    `UPDATE purchase_requisitions SET total_amount = $1 WHERE id = $2`,
    [reqTotal, reqId]
  );
  console.log(`✓ requisition (id=${reqId}) + ${reqItems.length} items`);

  // 5) Budget commitment for the approved requisition (S2.5 real commitment)
  await client.query(
    `INSERT INTO budget_commitments (
      tenant_id, budget_id, commitment_type, reference_type, reference_id,
      committed_amount, currency, status, committed_by, committed_by_name
    ) VALUES ($1, $2, 'requisition', 'purchase_requisition', $3, $4, 'ETB', 'active', 'system', 'System Approver')
    ON CONFLICT DO NOTHING`,
    [TENANT, budgetId, reqId, reqTotal]
  );
  await client.query(
    `UPDATE budgets SET committed_amount = $1 WHERE id = $2`,
    [reqTotal, budgetId]
  );
  console.log(`✓ budget commitment (ETB ${reqTotal})`);

  // 6) PO + items (idempotent on po_number)
  const steel = reqItems.find((l) => l.product === 'STL-001');
  const poItems = [
    { product: 'STL-001', name: 'Steel Sheet 12mm', qty: 60, price: 88000, uom: 'TON' },
  ];
  const poSubtotal = poItems.reduce((s, l) => s + l.qty * l.price, 0);
  const poVat = Math.round(poSubtotal * 0.15 * 100) / 100;
  const poTotal = Math.round((poSubtotal + poVat) * 100) / 100;
  const po = await client.query(
    `INSERT INTO purchase_orders (
      tenant_id, po_number, supplier_id, supplier_name, po_date, expected_delivery_date,
      subtotal, vat_amount, vat_rate, total_amount, currency, status, requisition_id, budget_id
    ) VALUES ($1, 'PO-2026-0001', $2, (SELECT name FROM suppliers WHERE id = $2),
      CURRENT_DATE, CURRENT_DATE + INTERVAL '14 days', $3, $4, 0.1500, $5, 'ETB', 'draft', $6, $7)
    ON CONFLICT (tenant_id, po_number) DO UPDATE SET status = EXCLUDED.status
    RETURNING id`,
    [TENANT, supIds[suppliers[0].name], poSubtotal, poVat, poTotal, reqId, budgetId]
  );
  const poId = po.rows[0].id;
  const poItemIds = {};
  for (let i = 0; i < poItems.length; i++) {
    const l = poItems[i];
    const item = await client.query(
      `INSERT INTO purchase_order_items (
        po_id, line_number, product_id, product_name, quantity_ordered, quantity_received,
        unit_of_measure, unit_price, vat_rate
      ) VALUES ($1, $2, $3, $4, $5, 0, $6, $7, 0.1500)
      ON CONFLICT DO NOTHING
      RETURNING id`,
      [poId, i + 1, prodIds[l.product], l.name, l.qty, l.uom, l.price]
    );
    if (item.rows[0]) poItemIds[l.product] = item.rows[0].id;
  }
  // Fetch the PO line id if the insert was a no-op (already seeded).
  const poLine = await client.query(
    `SELECT id FROM purchase_order_items WHERE po_id = $1 AND product_id = $2 LIMIT 1`,
    [poId, prodIds['STL-001']]
  );
  const poItemId = poItemIds['STL-001'] || poLine.rows[0]?.id;
  console.log(`✓ PO (id=${poId}) + ${Object.keys(poItemIds).length} items`);

  // 7) Warehouse receipt + items (~5% inspection rejection) + inventory ledger
  const recv = await client.query(
    `INSERT INTO warehouse_receipts (
      tenant_id, receipt_number, po_id, received_by, received_by_name, received_by_role,
      quantity_received, quantity_accepted, quantity_rejected, status, received_at
    ) VALUES ($1, 'RCPT-2026-0001', $2, 'Meron', 'Meron Alemu', 'Warehouse Supervisor',
      60, 57, 3, 'completed', CURRENT_DATE)
    ON CONFLICT (tenant_id, receipt_number) DO UPDATE SET status = EXCLUDED.status
    RETURNING id`,
    [TENANT, poId]
  );
  const receiptId = recv.rows[0].id;
  const acceptedQty = 57; // 5% inspection rejection (3 / 60)
  const unitCost = 88000;
  const recvAmount = Math.round(acceptedQty * unitCost * 100) / 100;
  await client.query(
    `INSERT INTO warehouse_receipt_items (
      receipt_id, line_number, po_item_id, product_id, product_name,
      quantity_received, quantity_accepted, quantity_rejected, unit_of_measure, unit_cost
    ) VALUES ($1, 1, $2, $3, 'Steel Sheet 12mm', 60, $4, 3, 'TON', $5)
    ON CONFLICT DO NOTHING`,
    [receiptId, poItemId, prodIds['STL-001'], acceptedQty, unitCost]
  );
  await client.query(
    `INSERT INTO inventory_transactions (
      tenant_id, product_id, transaction_type, quantity, unit_cost, location_id, reference_type, reference_id, transaction_date
    ) VALUES ($1, $2, 'purchase_receipt', $3, $4, 'main', 'warehouse_receipt', $5, CURRENT_DATE)
    ON CONFLICT DO NOTHING`,
    [TENANT, prodIds['STL-001'], acceptedQty, unitCost, receiptId]
  );
  await client.query(
    `UPDATE purchase_orders SET status = 'received', actual_delivery_date = CURRENT_DATE WHERE id = $1`,
    [poId]
  );
  await client.query(
    `UPDATE budgets SET actual_amount = $1 WHERE id = $2`,
    [recvAmount, budgetId]
  );
  console.log(`✓ receipt (id=${receiptId}) + inventory ledger (${acceptedQty} TON)`);

  // 8) Supplier performance upsert (no unique key on supplier_id → heal via delete+insert)
  const supId = supIds[suppliers[0].name];
  await client.query(
    `DELETE FROM supplier_performance WHERE tenant_id = $1 AND supplier_id = $2`,
    [TENANT, supId]
  );
  await client.query(
    `INSERT INTO supplier_performance (tenant_id, supplier_id, total_orders, on_time_rate, overall_rating)
     VALUES ($1, $2, 3, 0.67, 4.2)`,
    [TENANT, supId]
  );

  await client.end();
  console.log('\n✅ Procurement local seed complete.');
}

main().catch((e) => {
  console.error('❌', e.message);
  process.exit(1);
});