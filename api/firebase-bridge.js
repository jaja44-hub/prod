import { readFileSync } from 'fs';
import pg from 'pg';
const { Client } = pg;
import admin from 'firebase-admin';

// Firebase Admin SDK initialization
let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync('/home/ja/Documents/production-submodule/service-account.json', 'utf8'));
} catch (err) {
  // In production, use environment variable
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
}

const firebaseApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://sample-firebase-ai-app-27a8e-default-rtdb.firebaseio.com'
}, 'firebase-bridge');

const rtdb = firebaseApp.database();
const firestore = firebaseApp.firestore();

// Neon DB connections
const NEON_DBS = {
  accounting: process.env.NEON_ACCOUNTING_DB_URL || 'postgresql://neondb_owner:npg_sUbwp0cAWdH3@ep-solitary-dew-auii1z3j.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  procurement: process.env.NEON_PROCUREMENT_DB_URL || 'postgresql://neondb_owner:npg_gt5VHKpS8RDk@ep-red-dust-avdqp1ld.c-11.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  analytics: process.env.NEON_ANALYTICS_DB_URL || 'postgresql://neondb_owner:npg_7QnYZpGf6PAo@ep-silent-breeze-auk7is8u.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  tenantfinance: process.env.NEON_TENANTFINANCE_DB_URL || 'postgresql://neondb_owner:npg_0bBxKfP6ZVaE@ep-sparkling-voice-au9j0rv1.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
};

// Helper function to query Neon DB
async function queryNeon(dbName, sql, params = []) {
  const client = new Client({ connectionString: NEON_DBS[dbName] });
  await client.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows;
  } finally {
    await client.end();
  }
}

// Bridge: Inventory (Firebase Realtime DB → Neon Analytics DB)
export async function GET(req) {
  const url = new URL(req.url);
  const action = url.searchParams.get('action');
  const tenantId = url.searchParams.get('tenantId') || 'tenant_default';

  try {
    switch (action) {
      case 'sync-inventory':
        // Sync inventory from Firebase Realtime DB to Neon Analytics DB
        const inventorySnapshot = await rtdb.ref('inventory/stock_levels').once('value');
        const inventoryData = inventorySnapshot.val();
        
        for (const [sku, data] of Object.entries(inventoryData || {})) {
          await queryNeon(
            'analytics',
            `INSERT INTO inventory_products (sku, name, quantity, tenant_id) 
             VALUES ($1, $2, $3, $4) 
             ON CONFLICT (sku) DO UPDATE SET quantity = EXCLUDED.quantity`,
            [sku, data.name, data.quantity, tenantId]
          );
        }
        
        return new Response(JSON.stringify({ success: true, synced: Object.keys(inventoryData || {}).length }), {
          headers: { 'Content-Type': 'application/json' }
        });

      case 'sync-hr-attendance':
        // Sync HR attendance from Firebase Realtime DB
        const attendanceSnapshot = await rtdb.ref('hr/attendance').once('value');
        const attendanceData = attendanceSnapshot.val();
        
        // Store aggregated attendance data in Firestore for analytics
        const attendanceCount = Object.keys(attendanceData || {}).length;
        await firestore.collection('analytics').doc('hr_metrics').set({
          tenant_id: tenantId,
          total_attendance_records: attendanceCount,
          last_sync: new Date().toISOString()
        });
        
        return new Response(JSON.stringify({ success: true, synced: attendanceCount }), {
          headers: { 'Content-Type': 'application/json' }
        });

      case 'get-analytics':
        // Get analytics from Neon and sync to Firestore
        const revenue = await queryNeon('accounting', 'SELECT SUM(amount) as total FROM journal_entries WHERE entry_type = $1', ['Sales Invoice']);
        const inventory = await queryNeon('analytics', 'SELECT SUM(quantity * unit_price) as total FROM inventory_products');
        
        const analyticsData = {
          total_revenue: revenue[0]?.total || 0,
          inventory_value: inventory[0]?.total || 0,
          last_updated: new Date().toISOString()
        };
        
        await firestore.collection('analytics').doc('dashboard_metrics').set({
          tenant_id: tenantId,
          ...analyticsData
        });
        
        return new Response(JSON.stringify(analyticsData), {
          headers: { 'Content-Type': 'application/json' }
        });

      case 'get-procurement-stats':
        // Get procurement stats from Neon
        const orders = await queryNeon('procurement', 'SELECT COUNT(*) as total, SUM(total_amount) as value FROM purchase_orders WHERE tenant_id = $1', [tenantId]);
        
        return new Response(JSON.stringify({
          total_orders: orders[0]?.total || 0,
          total_value: orders[0]?.value || 0
        }), {
          headers: { 'Content-Type': 'application/json' }
        });

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle POST requests for data updates
export async function POST(req) {
  const url = new URL(req.url);
  const action = url.searchParams.get('action');
  const tenantId = url.searchParams.get('tenantId') || 'tenant_default';
  
  try {
    const body = await req.json();
    
    switch (action) {
      case 'update-inventory':
        // Update inventory in Firebase and sync to Neon
        const { sku, quantity, location } = body;
        
        await rtdb.ref(`inventory/stock_levels/${sku}`).update({
          quantity,
          location,
          last_updated: new Date().toISOString()
        });
        
        await queryNeon(
          'analytics',
          `INSERT INTO inventory_transactions (product_id, location_id, transaction_type, quantity, transaction_date, tenant_id) 
           VALUES ($1, $2, $3, $4, CURRENT_DATE, $5)`,
          [sku, location, 'UPDATE', quantity, tenantId]
        );
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' }
        });

      case 'log-attendance':
        // Log attendance in Firebase Realtime DB
        const { employee_id, check_in, check_out } = body;
        
        const attendanceRef = rtdb.ref('hr/attendance').push();
        await attendanceRef.set({
          employee_id,
          check_in,
          check_out,
          status: 'present',
          timestamp: new Date().toISOString()
        });
        
        return new Response(JSON.stringify({ success: true, id: attendanceRef.key }), {
          headers: { 'Content-Type': 'application/json' }
        });

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
