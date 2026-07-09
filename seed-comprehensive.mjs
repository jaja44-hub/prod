/**
 * seed-comprehensive.mjs
 * Comprehensive Firestore Seeding Script - Production Tenant
 * Respects data dependencies: Phase 1 (foundation) → Phase 2 → Phase 3 → Phase 4
 * Run: node seed-comprehensive.mjs
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SA_PATH = resolve(__dirname, 'service-account.json');

if (!existsSync(SA_PATH)) {
  console.error('❌ service-account.json not found');
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(SA_PATH, 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const TENANT = 'production';
const now = new Date();

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 1: FOUNDATION (No Dependencies)
// ═══════════════════════════════════════════════════════════════════════════

const suppliers = [
  {
    id: 'sup-001',
    name: 'Addis Crown Materials Ltd',
    email: 'contact@addiscrown.et',
    phone: '+251-1-234-5678',
    country: 'Ethiopia',
    onTimePercent: 92,
    qtyAccuracyPercent: 88,
    costVariancePercent: 2,
    rating: 4.5,
    tenantId: TENANT,
    _ts: now,
  },
  {
    id: 'sup-002',
    name: 'Bekele Trading Export',
    email: 'sales@bekeletrading.et',
    phone: '+251-1-555-9876',
    country: 'Ethiopia',
    onTimePercent: 78,
    qtyAccuracyPercent: 85,
    costVariancePercent: -5,
    rating: 4.0,
    tenantId: TENANT,
    _ts: now,
  },
  {
    id: 'sup-003',
    name: 'East Africa Glass & Frames',
    email: 'procurement@eaglass.ke',
    phone: '+254-20-222-3333',
    country: 'Kenya',
    onTimePercent: 88,
    qtyAccuracyPercent: 91,
    costVariancePercent: 1,
    rating: 4.7,
    tenantId: TENANT,
    _ts: now,
  },
  {
    id: 'sup-004',
    name: 'Nile Logistics & Supply',
    email: 'orders@nilelogistics.et',
    phone: '+251-9-876-5432',
    country: 'Ethiopia',
    onTimePercent: 65,
    qtyAccuracyPercent: 72,
    costVariancePercent: 8,
    rating: 3.2,
    tenantId: TENANT,
    _ts: now,
  },
  {
    id: 'sup-005',
    name: 'Red Sea Import Group',
    email: 'supply@redsea.sa',
    phone: '+966-1-411-2233',
    country: 'Saudi Arabia',
    onTimePercent: 85,
    qtyAccuracyPercent: 89,
    costVariancePercent: 0,
    rating: 4.4,
    tenantId: TENANT,
    _ts: now,
  },
];

const orders = [
  {
    id: 'ord-001',
    name: 'SO-ABC123',
    partnerId: 'partner-bole-construction',
    lines: [
      { productId: 'SKU-1001', quantity: 50, unitPrice: 5000 },
      { productId: 'SKU-1002', quantity: 25, unitPrice: 12000 },
    ],
    amount_total: 550000,
    state: 'draft',
    tenantId: TENANT,
    _ts: now,
  },
  {
    id: 'ord-002',
    name: 'SO-DEF456',
    partnerId: 'partner-megenagna-complex',
    lines: [
      { productId: 'SKU-1001', quantity: 200, unitPrice: 5100 },
      { productId: 'SKU-1002', quantity: 100, unitPrice: 12500 },
    ],
    amount_total: 2295000,
    state: 'confirmed',
    tenantId: TENANT,
    _ts: now,
  },
  {
    id: 'ord-003',
    name: 'SO-GHI789',
    partnerId: 'partner-kazanchis-office',
    lines: [
      { productId: 'SKU-1001', quantity: 30, unitPrice: 4900 },
    ],
    amount_total: 147000,
    state: 'done',
    tenantId: TENANT,
    _ts: now,
  },
  {
    id: 'ord-004',
    name: 'SO-JKL012',
    partnerId: 'partner-cmc-villa',
    lines: [
      { productId: 'SKU-1002', quantity: 80, unitPrice: 12300 },
    ],
    amount_total: 984000,
    state: 'draft',
    tenantId: TENANT,
    _ts: now,
  },
  {
    id: 'ord-005',
    name: 'SO-MNO345',
    partnerId: 'partner-bole-construction',
    lines: [
      { productId: 'SKU-1001', quantity: 120, unitPrice: 5050 },
      { productId: 'SKU-1002', quantity: 60, unitPrice: 12400 },
    ],
    amount_total: 1251000,
    state: 'confirmed',
    tenantId: TENANT,
    _ts: now,
  },
];

const cycleSchedulers = [
  {
    id: 'cs-001',
    name: 'Monthly Inventory Check',
    frequency: 'monthly',
    nextTrigger: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastTriggered: now.toISOString(),
    tenantId: TENANT,
    _ts: now,
  },
  {
    id: 'cs-002',
    name: 'Weekly Spot Check',
    frequency: 'weekly',
    nextTrigger: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    lastTriggered: now.toISOString(),
    tenantId: TENANT,
    _ts: now,
  },
  {
    id: 'cs-003',
    name: 'Quarterly Full Audit',
    frequency: 'quarterly',
    nextTrigger: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    lastTriggered: now.toISOString(),
    tenantId: TENANT,
    _ts: now,
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 2: TRANSACTION FLOWS (Depends on Phase 1: suppliers, orders)
// ═══════════════════════════════════════════════════════════════════════════

const rfqs = [
  {
    id: 'rfq-001',
    rfqId: 'rfq-001',
    tenantId: TENANT,
    vendorId: 'sup-001',
    lines: [
      { productId: 'SKU-1001', quantity: 100, unitPrice: 5200 },
      { productId: 'SKU-1002', quantity: 50, unitPrice: 12100 },
    ],
    status: 'sent',
    createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rfq-002',
    rfqId: 'rfq-002',
    tenantId: TENANT,
    vendorId: 'sup-002',
    lines: [
      { productId: 'SKU-1001', quantity: 200, unitPrice: 5000 },
    ],
    status: 'sent',
    createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rfq-003',
    rfqId: 'rfq-003',
    tenantId: TENANT,
    vendorId: 'sup-003',
    lines: [
      { productId: 'SKU-1002', quantity: 80, unitPrice: 12300 },
    ],
    status: 'draft',
    createdAt: now.toISOString(),
  },
];

const purchaseOrders = [
  {
    id: 'po-001',
    poId: 'po-001',
    tenantId: TENANT,
    rfqId: 'rfq-001',
    vendorId: 'sup-001',
    lines: [
      { productId: 'SKU-1001', quantity: 100, unitPrice: 5200 },
      { productId: 'SKU-1002', quantity: 50, unitPrice: 12100 },
    ],
    amount_total: 1085000,
    status: 'draft',
    createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'po-002',
    poId: 'po-002',
    tenantId: TENANT,
    rfqId: 'rfq-002',
    vendorId: 'sup-002',
    lines: [
      { productId: 'SKU-1001', quantity: 200, unitPrice: 5000 },
    ],
    amount_total: 1000000,
    status: 'confirmed',
    createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'po-003',
    poId: 'po-003',
    tenantId: TENANT,
    rfqId: 'rfq-003',
    vendorId: 'sup-003',
    lines: [
      { productId: 'SKU-1002', quantity: 80, unitPrice: 12300 },
    ],
    amount_total: 984000,
    status: 'draft',
    createdAt: now.toISOString(),
  },
];

const receipts = [
  {
    id: 'rec-001',
    tenantId: TENANT,
    poId: 'po-001',
    vendorId: 'sup-001',
    lines: [
      { productId: 'SKU-1001', qtyReceived: 100, unitCost: 5200, condition: 'good' },
      { productId: 'SKU-1002', qtyReceived: 50, unitCost: 12100, condition: 'good' },
    ],
    status: 'matched',
    receivedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    _ts: now,
  },
  {
    id: 'rec-002',
    tenantId: TENANT,
    poId: 'po-002',
    vendorId: 'sup-002',
    lines: [
      { productId: 'SKU-1001', qtyReceived: 150, unitCost: 5000, condition: 'good' },
    ],
    status: 'matched',
    receivedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    _ts: now,
  },
  {
    id: 'rec-003',
    tenantId: TENANT,
    poId: 'po-002',
    vendorId: 'sup-002',
    lines: [
      { productId: 'SKU-1001', qtyReceived: 50, unitCost: 5000, condition: 'damaged' },
    ],
    status: 'matched',
    receivedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    _ts: now,
  },
];

const recurringOrders = [
  {
    id: 'ro-001',
    name: 'Monthly Supply - Bole Construction',
    baseOrderId: 'ord-001',
    frequency: 'monthly',
    nextRun: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    tenantId: TENANT,
    _ts: now,
  },
  {
    id: 'ro-002',
    name: 'Quarterly Supply - Megenagna Complex',
    baseOrderId: 'ord-002',
    frequency: 'quarterly',
    nextRun: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    tenantId: TENANT,
    _ts: now,
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 3: DERIVED DATA (Depends on Phase 2: receipts, orders)
// ═══════════════════════════════════════════════════════════════════════════

const lotTracking = [
  {
    id: 'lot-001',
    lotId: 'lot-001',
    productId: 'SKU-1001',
    lotRef: 'LOT-2026-07-001-SUP-001',
    qty: 100,
    receivedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    meta: { supplierId: 'sup-001', poId: 'po-001' },
    tenantId: TENANT,
    _ts: now,
  },
  {
    id: 'lot-002',
    lotId: 'lot-002',
    productId: 'SKU-1002',
    lotRef: 'LOT-2026-07-002-SUP-001',
    qty: 50,
    receivedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    meta: { supplierId: 'sup-001', poId: 'po-001' },
    tenantId: TENANT,
    _ts: now,
  },
  {
    id: 'lot-003',
    lotId: 'lot-003',
    productId: 'SKU-1001',
    lotRef: 'LOT-2026-07-003-SUP-002',
    qty: 150,
    receivedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    meta: { supplierId: 'sup-002', poId: 'po-002' },
    tenantId: TENANT,
    _ts: now,
  },
  {
    id: 'lot-004',
    lotId: 'lot-004',
    productId: 'SKU-1001',
    lotRef: 'LOT-2026-07-004-SUP-002-DAMAGED',
    qty: 50,
    receivedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    meta: { supplierId: 'sup-002', poId: 'po-002', condition: 'damaged' },
    tenantId: TENANT,
    _ts: now,
  },
];

const commissions = [
  {
    id: 'com-001',
    orderId: 'ord-001',
    salesPersonId: '7gs2x0Gkn2WPl0vpGGDgYk35tIv1',
    rate: 5,
    baseAmount: 550000,
    commissionAmount: 27500,
    status: 'draft',
    tenantId: TENANT,
    _ts: now,
  },
  {
    id: 'com-002',
    orderId: 'ord-002',
    salesPersonId: '7gs2x0Gkn2WPl0vpGGDgYk35tIv1',
    rate: 3,
    baseAmount: 2295000,
    commissionAmount: 68850,
    status: 'approved',
    tenantId: TENANT,
    _ts: now,
  },
  {
    id: 'com-003',
    orderId: 'ord-005',
    salesPersonId: '7gs2x0Gkn2WPl0vpGGDgYk35tIv1',
    rate: 4,
    baseAmount: 1251000,
    commissionAmount: 50040,
    status: 'draft',
    tenantId: TENANT,
    _ts: now,
  },
];

const sales = [
  {
    id: 'sal-001',
    orderId: 'ord-001',
    customerId: 'partner-bole-construction',
    amount: 550000,
    currency: 'ETB',
    date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
    tenantId: TENANT,
    _ts: now,
  },
  {
    id: 'sal-002',
    orderId: 'ord-002',
    customerId: 'partner-megenagna-complex',
    amount: 2295000,
    currency: 'ETB',
    date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    tenantId: TENANT,
    _ts: now,
  },
  {
    id: 'sal-003',
    orderId: 'ord-003',
    customerId: 'partner-kazanchis-office',
    amount: 147000,
    currency: 'ETB',
    date: now.toISOString(),
    status: 'completed',
    tenantId: TENANT,
    _ts: now,
  },
];

const batches = [
  {
    id: 'batch-001',
    name: 'Payment Batch 2026-07-08',
    status: 'submitted',
    payments: [
      { id: 'pmt-001', invoiceId: 'INV-001', amount: 275000, currency: 'ETB', reference: 'rec-001' },
      { id: 'pmt-002', invoiceId: 'INV-002', amount: 500000, currency: 'ETB', reference: 'rec-002' },
    ],
    totalAmount: 775000,
    createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    tenantId: TENANT,
    _ts: now,
  },
  {
    id: 'batch-002',
    name: 'Payment Batch 2026-07-09',
    status: 'draft',
    payments: [
      { id: 'pmt-003', invoiceId: 'INV-003', amount: 300000, currency: 'ETB', reference: 'sal-002' },
    ],
    totalAmount: 300000,
    createdAt: now.toISOString(),
    tenantId: TENANT,
    _ts: now,
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 4: AGGREGATES & SNAPSHOTS (Depends on Phase 3)
// ═══════════════════════════════════════════════════════════════════════════

const snapshots = [
  {
    id: 'snap-001',
    name: 'Inventory Snapshot 2026-07-10 FIFO',
    createdAt: now.toISOString(),
    method: 'fifo',
    items: [
      { productId: 'SKU-1001', qty: 100, unitCost: 5200, lotId: 'lot-001', receivedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString() },
      { productId: 'SKU-1002', qty: 50, unitCost: 12100, lotId: 'lot-002', receivedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString() },
      { productId: 'SKU-1001', qty: 150, unitCost: 5000, lotId: 'lot-003', receivedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString() },
    ],
    totalValue: 1921000,
    tenantId: TENANT,
    _ts: now,
  },
  {
    id: 'snap-002',
    name: 'Inventory Snapshot 2026-07-10 LIFO',
    createdAt: now.toISOString(),
    method: 'lifo',
    items: [
      { productId: 'SKU-1001', qty: 150, unitCost: 5000, lotId: 'lot-003', receivedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString() },
      { productId: 'SKU-1001', qty: 100, unitCost: 5200, lotId: 'lot-001', receivedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString() },
      { productId: 'SKU-1002', qty: 50, unitCost: 12100, lotId: 'lot-002', receivedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString() },
    ],
    totalValue: 1921000,
    tenantId: TENANT,
    _ts: now,
  },
];

const vendorPerformance = [
  {
    id: 'vp-001',
    vendorId: 'sup-001',
    onTimePercent: 92,
    qtyAccuracyPercent: 88,
    costVariancePercent: 2,
    compositeScore: 87.3,
    evaluatedAt: now.toISOString(),
    tenantId: TENANT,
    _ts: now,
  },
  {
    id: 'vp-002',
    vendorId: 'sup-002',
    onTimePercent: 78,
    qtyAccuracyPercent: 85,
    costVariancePercent: -5,
    compositeScore: 80.5,
    evaluatedAt: now.toISOString(),
    tenantId: TENANT,
    _ts: now,
  },
  {
    id: 'vp-003',
    vendorId: 'sup-003',
    onTimePercent: 88,
    qtyAccuracyPercent: 91,
    costVariancePercent: 1,
    compositeScore: 89.7,
    evaluatedAt: now.toISOString(),
    tenantId: TENANT,
    _ts: now,
  },
];

const labels = [
  {
    id: 'label-001',
    trackingId: 'TRK-2026-07-001-FEDEX',
    orderId: 'ord-001',
    carrier: 'fedex',
    status: 'generated',
    generatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    tenantId: TENANT,
    _ts: now,
  },
  {
    id: 'label-002',
    trackingId: 'TRK-2026-07-002-DHL',
    orderId: 'ord-002',
    carrier: 'dhl',
    status: 'shipped',
    generatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    tenantId: TENANT,
    _ts: now,
  },
  {
    id: 'label-003',
    trackingId: 'TRK-2026-07-003-LOCAL',
    orderId: 'ord-003',
    carrier: 'local',
    status: 'generated',
    generatedAt: now.toISOString(),
    tenantId: TENANT,
    _ts: now,
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

async function seedCollection(collectionName, data, phase = '') {
  console.log(`\n${phase} Seeding ${collectionName}...`);
  let successCount = 0;
  let failCount = 0;

  for (const item of data) {
    try {
      await db.collection(collectionName).doc(item.id).set(item);
      successCount++;
    } catch (err) {
      console.error(`  ❌ ${item.id} — ${err.message}`);
      failCount++;
    }
  }

  console.log(`  ✅ ${successCount} docs created, ❌ ${failCount} failed`);
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

async function runSeed() {
  console.log('\n' + '═'.repeat(80));
  console.log('🌱 COMPREHENSIVE FIRESTORE SEEDING');
  console.log(`   Project: ${serviceAccount.project_id}`);
  console.log(`   Tenant: ${TENANT}`);
  console.log('═'.repeat(80));

  try {
    // PHASE 1
    console.log('\n' + '─'.repeat(80));
    console.log('PHASE 1: FOUNDATION (No Dependencies)');
    console.log('─'.repeat(80));
    await seedCollection('suppliers', suppliers, '📦');
    await seedCollection('orders', orders, '📦');
    await seedCollection('cycle_scheduler', cycleSchedulers, '📦');

    // PHASE 2
    console.log('\n' + '─'.repeat(80));
    console.log('PHASE 2: TRANSACTION FLOWS (RFQ → PO → Receipt)');
    console.log('─'.repeat(80));
    await seedCollection('rfq', rfqs, '🔄');
    await seedCollection('purchase_orders', purchaseOrders, '🔄');
    await seedCollection('receipts', receipts, '🔄');
    await seedCollection('recurring_orders', recurringOrders, '🔄');

    // PHASE 3
    console.log('\n' + '─'.repeat(80));
    console.log('PHASE 3: DERIVED DATA (Lot tracking, Commission, Sales, Batches)');
    console.log('─'.repeat(80));
    await seedCollection('lot_tracking', lotTracking, '📊');
    await seedCollection('commission', commissions, '📊');
    await seedCollection('sales', sales, '📊');
    await seedCollection('batches', batches, '📊');

    // PHASE 4
    console.log('\n' + '─'.repeat(80));
    console.log('PHASE 4: AGGREGATES & SNAPSHOTS (Valuation, Vendor Performance, Labels)');
    console.log('─'.repeat(80));
    await seedCollection('snapshots', snapshots, '📈');
    await seedCollection('vendor_performance', vendorPerformance, '📈');
    await seedCollection('labels', labels, '📈');

    console.log('\n' + '═'.repeat(80));
    console.log('🎉 SEEDING COMPLETE!');
    console.log('═'.repeat(80));
    console.log('\nSummary:');
    console.log('  ✅ Suppliers:              5 docs');
    console.log('  ✅ Orders:                 5 docs');
    console.log('  ✅ Cycle Schedules:       3 docs');
    console.log('  ✅ RFQs:                   3 docs');
    console.log('  ✅ Purchase Orders:       3 docs');
    console.log('  ✅ Receipts:              3 docs');
    console.log('  ✅ Recurring Orders:      2 docs');
    console.log('  ✅ Lot Tracking:          4 docs');
    console.log('  ✅ Commissions:           3 docs');
    console.log('  ✅ Sales:                 3 docs');
    console.log('  ✅ Batches:               2 docs');
    console.log('  ✅ Snapshots:             2 docs');
    console.log('  ✅ Vendor Performance:    3 docs');
    console.log('  ✅ Labels:                3 docs');
    console.log('\n  📊 TOTAL: 44 demo documents seeded');
    console.log('  🎯 Analytics: Will compute automatically from orders + sales');
    console.log('  📝 Audit: Will populate on API calls\n');

    process.exit(0);
  } catch (err) {
    console.error('Fatal seed error:', err);
    process.exit(1);
  }
}

runSeed();
