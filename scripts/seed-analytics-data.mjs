#!/usr/bin/env node
import pg from 'pg';
const { Client } = pg;

const ANALYTICS_DB_URL = 'postgresql://neondb_owner:npg_7QnYZpGf6PAo@ep-silent-breeze-auk7is8u.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function seedAnalyticsData() {
  const client = new Client({ connectionString: ANALYTICS_DB_URL });
  await client.connect();
  
  console.log('Seeding analytics data...\n');
  
  // Inventory Locations (Ethiopian warehouses)
  const locations = [
    { name: 'Bole Central Warehouse', location_type: 'Main', address: 'Bole Subcity, Addis Ababa' },
    { name: 'Kazanchis Distribution Center', location_type: 'Distribution', address: 'Kazanchis, Addis Ababa' },
    { name: 'Mekelle Regional Hub', location_type: 'Regional', address: 'Mekelle, Tigray' },
    { name: 'Gondar Storage Facility', location_type: 'Storage', address: 'Gondar, Amhara' },
    { name: 'Hawassa Logistics Center', location_type: 'Logistics', address: 'Hawassa, SNNPR' },
    { name: 'Dire Dawa Transit Point', location_type: 'Transit', address: 'Dire Dawa' }
  ];
  
  console.log('Inserting inventory locations...');
  for (const loc of locations) {
    await client.query(
      `INSERT INTO inventory_locations (name, location_type, address, tenant_id) 
       VALUES ($1, $2, $3, 'tenant_default')
       ON CONFLICT DO NOTHING`,
      [loc.name, loc.location_type, loc.address]
    );
  }
  console.log(`✓ ${locations.length} locations inserted`);
  
  // Inventory Products
  const products = [
    { sku: 'ETH-001', name: 'Steel Sheets 5mm', description: 'Industrial steel sheets', category: 'Raw Materials', quantity: 500, unit_price: 2500 },
    { sku: 'ETH-002', name: 'Pharmaceutical Grade Chemicals', description: 'Lab chemicals', category: 'Chemicals', quantity: 200, unit_price: 8500 },
    { sku: 'ETH-003', name: 'Cement Bags 50kg', description: 'Portland cement', category: 'Construction', quantity: 1000, unit_price: 450 },
    { sku: 'ETH-004', name: 'Electrical Transformers', description: 'Power distribution equipment', category: 'Electrical', quantity: 50, unit_price: 45000 },
    { sku: 'ETH-005', name: 'Brewing Equipment Parts', description: 'Spare parts for brewing', category: 'Manufacturing', quantity: 300, unit_price: 1200 },
    { sku: 'ETH-006', name: 'Mining Drill Bits', description: 'Industrial mining equipment', category: 'Mining', quantity: 150, unit_price: 8900 },
    { sku: 'ETH-007', name: 'Aircraft Spare Parts', description: 'Aviation components', category: 'Aviation', quantity: 80, unit_price: 25000 },
    { sku: 'ETH-008', name: 'Banking Security Systems', description: 'Security equipment', category: 'Security', quantity: 25, unit_price: 15000 }
  ];
  
  console.log('Inserting inventory products...');
  for (const prod of products) {
    await client.query(
      `INSERT INTO inventory_products (sku, name, description, category, quantity, unit_price, tenant_id) 
       VALUES ($1, $2, $3, $4, $5, $6, 'tenant_default')
       ON CONFLICT (sku) DO NOTHING`,
      [prod.sku, prod.name, prod.description, prod.category, prod.quantity, prod.unit_price]
    );
  }
  console.log(`✓ ${products.length} products inserted`);
  
  // Inventory Transactions
  const transactions = [
    { product_id: 1, location_id: 1, transaction_type: 'IN', quantity: 500, transaction_date: '2026-01-15', reference_id: 'PO-001' },
    { product_id: 2, location_id: 2, transaction_type: 'IN', quantity: 200, transaction_date: '2026-01-20', reference_id: 'PO-002' },
    { product_id: 1, location_id: 1, transaction_type: 'OUT', quantity: 100, transaction_date: '2026-02-01', reference_id: 'SO-001' },
    { product_id: 3, location_id: 3, transaction_type: 'IN', quantity: 1000, transaction_date: '2026-02-10', reference_id: 'PO-003' },
    { product_id: 4, location_id: 1, transaction_type: 'IN', quantity: 50, transaction_date: '2026-02-15', reference_id: 'PO-004' },
    { product_id: 5, location_id: 4, transaction_type: 'IN', quantity: 300, transaction_date: '2026-03-01', reference_id: 'PO-005' },
    { product_id: 6, location_id: 5, transaction_type: 'IN', quantity: 150, transaction_date: '2026-03-05', reference_id: 'PO-006' },
    { product_id: 7, location_id: 6, transaction_type: 'IN', quantity: 80, transaction_date: '2026-03-10', reference_id: 'PO-007' },
    { product_id: 8, location_id: 1, transaction_type: 'IN', quantity: 25, transaction_date: '2026-03-15', reference_id: 'PO-008' },
    { product_id: 3, location_id: 2, transaction_type: 'OUT', quantity: 200, transaction_date: '2026-03-20', reference_id: 'SO-002' }
  ];
  
  console.log('Inserting inventory transactions...');
  for (const txn of transactions) {
    await client.query(
      `INSERT INTO inventory_transactions (product_id, location_id, transaction_type, quantity, transaction_date, reference_id, tenant_id) 
       VALUES ($1, $2, $3, $4, $5, $6, 'tenant_default')
       ON CONFLICT DO NOTHING`,
      [txn.product_id, txn.location_id, txn.transaction_type, txn.quantity, txn.transaction_date, txn.reference_id]
    );
  }
  console.log(`✓ ${transactions.length} transactions inserted`);
  
  // Inventory Cycle Counts
  const cycleCounts = [
    { location_id: 1, count_date: '2026-01-31', counted_by: 'Abebe Kebede', status: 'completed' },
    { location_id: 2, count_date: '2026-02-28', counted_by: 'Tigist Haile', status: 'completed' },
    { location_id: 3, count_date: '2026-03-15', counted_by: 'Dawit Abebe', status: 'in_progress' },
    { location_id: 4, count_date: '2026-03-20', counted_by: 'Sara Mengistu', status: 'pending' }
  ];
  
  console.log('Inserting cycle counts...');
  for (const cc of cycleCounts) {
    await client.query(
      `INSERT INTO inventory_cycle_counts (location_id, count_date, counted_by, status, tenant_id) 
       VALUES ($1, $2, $3, $4, 'tenant_default')
       ON CONFLICT DO NOTHING`,
      [cc.location_id, cc.count_date, cc.counted_by, cc.status]
    );
  }
  console.log(`✓ ${cycleCounts.length} cycle counts inserted`);
  
  await client.end();
  console.log('\n✅ Analytics data seeded successfully!');
}

seedAnalyticsData().catch(console.error);
