#!/usr/bin/env node
import pg from 'pg';
const { Client } = pg;

const PROCUREMENT_DB_URL = 'postgresql://neondb_owner:npg_gt5VHKpS8RDk@ep-red-dust-avdqp1ld.c-11.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function seedProcurementData() {
  const client = new Client({ connectionString: PROCUREMENT_DB_URL });
  await client.connect();
  
  console.log('Seeding procurement data...\n');
  
  const suppliers = [
    { name: 'Ethio Steel Manufacturing', email: 'procurement@ethiosteel.com.et', phone: '+251-11-555-1234', address: 'Bole Subcity, Addis Ababa' },
    { name: 'Addis Pharmaceutical Factory', email: 'orders@addispharma.com.et', phone: '+251-11-555-2345', address: 'Kazanchis, Addis Ababa' },
    { name: 'Messebo Cement Factory', email: 'sales@messebo.com.et', phone: '+251-34-440-1234', address: 'Mekelle, Tigray' },
    { name: 'Ethiopian Electric Power Corp', email: 'procurement@eepc.gov.et', phone: '+251-11-555-3456', address: 'Mexico Square, Addis Ababa' },
    { name: 'Dashen Brewery', email: 'supply@dashenbrewery.com.et', phone: '+251-58-220-1234', address: 'Gondar, Amhara' },
    { name: 'MIDROC Gold Mine', email: 'procurement@midrocgold.com.et', phone: '+251-11-555-4567', address: 'Legetafo, Oromia' },
    { name: 'Ethiopian Airlines', email: 'supplies@ethiopianairlines.com', phone: '+251-11-665-0000', address: 'Bole International Airport, Addis Ababa' },
    { name: 'Hibret Bank', email: 'vendor@hibretbank.com.et', phone: '+251-11-555-5678', address: 'Bole, Addis Ababa' }
  ];
  
  console.log('Inserting suppliers...');
  for (const supplier of suppliers) {
    await client.query(
      `INSERT INTO suppliers (name, email, phone, address, tenant_id) 
       VALUES ($1, $2, $3, $4, 'tenant_default') 
       ON CONFLICT DO NOTHING`,
      [supplier.name, supplier.email, supplier.phone, supplier.address]
    );
  }
  console.log(`✓ ${suppliers.length} suppliers inserted`);
  
  const purchaseOrders = [
    { order_number: 'PO-2026-001', supplier_id: 1, order_date: '2026-01-15', expected_date: '2026-02-15', total_amount: 450000, status: 'completed' },
    { order_number: 'PO-2026-002', supplier_id: 2, order_date: '2026-01-20', expected_date: '2026-02-20', total_amount: 280000, status: 'completed' },
    { order_number: 'PO-2026-003', supplier_id: 3, order_date: '2026-02-01', expected_date: '2026-03-01', total_amount: 650000, status: 'in_transit' },
    { order_number: 'PO-2026-004', supplier_id: 4, order_date: '2026-02-10', expected_date: '2026-03-10', total_amount: 150000, status: 'pending' },
    { order_number: 'PO-2026-005', supplier_id: 5, order_date: '2026-02-15', expected_date: '2026-03-15', total_amount: 320000, status: 'pending' },
    { order_number: 'PO-2026-006', supplier_id: 6, order_date: '2026-03-01', expected_date: '2026-04-01', total_amount: 890000, status: 'draft' },
    { order_number: 'PO-2026-007', supplier_id: 7, order_date: '2026-03-05', expected_date: '2026-04-05', total_amount: 175000, status: 'draft' },
    { order_number: 'PO-2026-008', supplier_id: 8, order_date: '2026-03-10', expected_date: '2026-04-10', total_amount: 95000, status: 'draft' }
  ];
  
  console.log('Inserting purchase orders...');
  for (const po of purchaseOrders) {
    await client.query(
      `INSERT INTO purchase_orders (order_number, supplier_id, order_date, expected_date, total_amount, status, tenant_id) 
       VALUES ($1, $2, $3, $4, $5, $6, 'tenant_default') 
       ON CONFLICT (order_number) DO NOTHING`,
      [po.order_number, po.supplier_id, po.order_date, po.expected_date, po.total_amount, po.status]
    );
  }
  console.log(`✓ ${purchaseOrders.length} purchase orders inserted`);
  
  const purchaseRequisitions = [
    { requisition_number: 'PR-2026-001', requested_by: 'Abebe Kebede', request_date: '2026-01-10', total_amount: 450000, status: 'approved' },
    { requisition_number: 'PR-2026-002', requested_by: 'Tigist Haile', request_date: '2026-01-15', total_amount: 280000, status: 'approved' },
    { requisition_number: 'PR-2026-003', requested_by: 'Dawit Abebe', request_date: '2026-01-28', total_amount: 650000, status: 'approved' },
    { requisition_number: 'PR-2026-004', requested_by: 'Sara Mengistu', request_date: '2026-02-05', total_amount: 150000, status: 'pending' },
    { requisition_number: 'PR-2026-005', requested_by: 'Kifle Michael', request_date: '2026-02-10', total_amount: 320000, status: 'pending' },
    { requisition_number: 'PR-2026-006', requested_by: 'Almaz Bekele', request_date: '2026-02-25', total_amount: 890000, status: 'review' },
    { requisition_number: 'PR-2026-007', requested_by: 'Yohannes Tadesse', request_date: '2026-03-01', total_amount: 175000, status: 'review' },
    { requisition_number: 'PR-2026-008', requested_by: 'Zeritu Kassa', request_date: '2026-03-05', total_amount: 95000, status: 'draft' }
  ];
  
  console.log('Inserting purchase requisitions...');
  for (const pr of purchaseRequisitions) {
    await client.query(
      `INSERT INTO purchase_requisitions (requisition_number, requested_by, request_date, total_amount, status, tenant_id) 
       VALUES ($1, $2, $3, $4, $5, 'tenant_default') 
       ON CONFLICT (requisition_number) DO NOTHING`,
      [pr.requisition_number, pr.requested_by, pr.request_date, pr.total_amount, pr.status]
    );
  }
  console.log(`✓ ${purchaseRequisitions.length} purchase requisitions inserted`);
  
  const purchaseReceipts = [
    { receipt_number: 'REC-2026-001', purchase_order_id: 1, receipt_date: '2026-02-15', quantity_received: 450 },
    { receipt_number: 'REC-2026-002', purchase_order_id: 2, receipt_date: '2026-02-20', quantity_received: 280 },
    { receipt_number: 'REC-2026-003', purchase_order_id: 3, receipt_date: '2026-03-05', quantity_received: 300 }
  ];
  
  console.log('Inserting purchase receipts...');
  for (const receipt of purchaseReceipts) {
    await client.query(
      `INSERT INTO purchase_receipts (receipt_number, purchase_order_id, receipt_date, quantity_received, tenant_id) 
       VALUES ($1, $2, $3, $4, 'tenant_default') 
       ON CONFLICT (receipt_number) DO NOTHING`,
      [receipt.receipt_number, receipt.purchase_order_id, receipt.receipt_date, receipt.quantity_received]
    );
  }
  console.log(`✓ ${purchaseReceipts.length} purchase receipts inserted`);
  
  const budgetVariance = [
    { budget_id: 1, actual_amount: 450000, budgeted_amount: 500000, variance: -50000, period: '2026-01' },
    { budget_id: 2, actual_amount: 280000, budgeted_amount: 300000, variance: -20000, period: '2026-01' },
    { budget_id: 3, actual_amount: 650000, budgeted_amount: 600000, variance: 50000, period: '2026-02' },
    { budget_id: 4, actual_amount: 150000, budgeted_amount: 200000, variance: -50000, period: '2026-02' },
    { budget_id: 5, actual_amount: 320000, budgeted_amount: 350000, variance: -30000, period: '2026-02' }
  ];
  
  console.log('Inserting budget variance records...');
  for (const bv of budgetVariance) {
    await client.query(
      `INSERT INTO budget_variance (budget_id, actual_amount, budgeted_amount, variance, period, tenant_id) 
       VALUES ($1, $2, $3, $4, $5, 'tenant_default')`,
      [bv.budget_id, bv.actual_amount, bv.budgeted_amount, bv.variance, bv.period]
    );
  }
  console.log(`✓ ${budgetVariance.length} budget variance records inserted`);
  
  await client.end();
  console.log('\n✅ Procurement data seeded successfully!');
}

seedProcurementData().catch(console.error);
