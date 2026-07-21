#!/usr/bin/env node
import { readFileSync } from 'fs';
import admin from 'firebase-admin';

const serviceAccount = JSON.parse(readFileSync('/home/ja/Documents/production-submodule/service-account.json', 'utf8'));

// Initialize with a unique app name to avoid conflicts
const firestoreApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
}, 'firestore-setup');

const db = firestoreApp.firestore();

async function setupFirestore() {
  console.log('Setting up Firestore for governance/analytics...\n');
  
  // Tenant governance
  console.log('Setting up tenant governance structure...');
  const tenantRef = db.collection('tenants').doc('tenant_default');
  await tenantRef.set({
    tenant_id: 'tenant_default',
    name: 'Addis Crown Production',
    plan: 'Enterprise',
    status: 'active',
    created_at: new Date().toISOString(),
    settings: {
      max_users: 100,
      storage_limit_mb: 10000,
      api_rate_limit: 10000
    }
  });
  
  await db.collection('tenants').doc('tenant_demo').set({
    tenant_id: 'tenant_demo',
    name: 'Demo Organization',
    plan: 'Professional',
    status: 'active',
    created_at: new Date().toISOString(),
    settings: {
      max_users: 50,
      storage_limit_mb: 5000,
      api_rate_limit: 5000
    }
  });
  
  console.log('✓ Tenant governance structure created');
  
  // Analytics aggregates
  console.log('Setting up analytics aggregates...');
  const analyticsRef = db.collection('analytics').doc('dashboard_metrics');
  await analyticsRef.set({
    tenant_id: 'tenant_default',
    total_revenue: 950000,
    total_orders: 10,
    active_employees: 45,
    inventory_value: 2850000,
    last_updated: new Date().toISOString()
  });
  
  await db.collection('analytics').doc('kpi_trends').set({
    tenant_id: 'tenant_default',
    revenue_trend: [450000, 250000, 250000],
    order_trend: [3, 2, 5],
    employee_trend: [45, 52, 48],
    period: '2026-Q1',
    last_updated: new Date().toISOString()
  });
  
  console.log('✓ Analytics aggregates created');
  
  // Module governance rules
  console.log('Setting up module governance rules...');
  await db.collection('governance').doc('module_permissions').set({
    tenant_id: 'tenant_default',
    modules: {
      inventory: { enabled: true, access_level: 'full' },
      procurement: { enabled: true, access_level: 'full' },
      finance: { enabled: true, access_level: 'full' },
      hr: { enabled: true, access_level: 'full' },
      analytics: { enabled: true, access_level: 'full' }
    },
    last_updated: new Date().toISOString()
  });
  
  console.log('✓ Module governance rules created');
  
  // Real-time KPI streams
  console.log('Setting up real-time KPI streams...');
  await db.collection('realtime_kpis').doc('current').set({
    tenant_id: 'tenant_default',
    active_users: 12,
    pending_orders: 5,
    low_stock_alerts: 2,
    system_health: 'healthy',
    timestamp: new Date().toISOString()
  });
  
  console.log('✓ Real-time KPI streams created');
  
  // Clean up the app
  await firestoreApp.delete();
  
  console.log('\n✅ Firestore setup complete!');
}

setupFirestore().catch(console.error);
