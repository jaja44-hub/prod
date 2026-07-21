#!/usr/bin/env node
import { readFileSync } from 'fs';
import admin from 'firebase-admin';

const serviceAccount = JSON.parse(readFileSync('/home/ja/Documents/production-submodule/service-account.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://sample-firebase-ai-app-27a8e-default-rtdb.firebaseio.com'
});

const db = admin.database();

async function setupFirebaseRealtimeDB() {
  console.log('Setting up Firebase Realtime DB for inventory/HR modules...\n');
  
  // Inventory structure
  console.log('Setting up inventory structure...');
  await db.ref('inventory/stock_levels').set({
    'ETH-001': { sku: 'ETH-001', name: 'Steel Sheets 5mm', quantity: 500, location: 'Bole Central Warehouse', last_updated: new Date().toISOString() },
    'ETH-002': { sku: 'ETH-002', name: 'Pharmaceutical Grade Chemicals', quantity: 200, location: 'Kazanchis Distribution Center', last_updated: new Date().toISOString() },
    'ETH-003': { sku: 'ETH-003', name: 'Cement Bags 50kg', quantity: 1000, location: 'Mekelle Regional Hub', last_updated: new Date().toISOString() }
  });
  
  await db.ref('inventory/locations').set({
    'bole-central': { name: 'Bole Central Warehouse', type: 'Main', address: 'Bole Subcity, Addis Ababa' },
    'kazanchis': { name: 'Kazanchis Distribution Center', type: 'Distribution', address: 'Kazanchis, Addis Ababa' },
    'mekelle': { name: 'Mekelle Regional Hub', type: 'Regional', address: 'Mekelle, Tigray' }
  });
  
  await db.ref('inventory/movements').set({
    'MOV-001': { product_id: 'ETH-001', type: 'IN', quantity: 500, timestamp: new Date().toISOString(), reference: 'PO-001' },
    'MOV-002': { product_id: 'ETH-002', type: 'IN', quantity: 200, timestamp: new Date().toISOString(), reference: 'PO-002' }
  });
  
  console.log('✓ Inventory structure created');
  
  // HR/Attendance structure
  console.log('Setting up HR/Attendance structure...');
  await db.ref('hr/employees').set({
    'EMP-001': { employee_id: 'EMP-001', name: 'Abebe Kebede', department: 'Operations', status: 'active' },
    'EMP-002': { employee_id: 'EMP-002', name: 'Tigist Haile', department: 'Finance', status: 'active' },
    'EMP-003': { employee_id: 'EMP-003', name: 'Dawit Abebe', department: 'Procurement', status: 'active' }
  });
  
  await db.ref('hr/attendance').set({
    'ATT-2026-07-21-001': { employee_id: 'EMP-001', check_in: '2026-07-21T08:00:00', check_out: '2026-07-21T17:00:00', status: 'present' },
    'ATT-2026-07-21-002': { employee_id: 'EMP-002', check_in: '2026-07-21T08:30:00', check_out: '2026-07-21T17:30:00', status: 'present' }
  });
  
  await db.ref('hr/leave_requests').set({
    'LEAVE-001': { employee_id: 'EMP-001', type: 'Annual', start_date: '2026-08-01', end_date: '2026-08-05', status: 'approved' }
  });
  
  console.log('✓ HR/Attendance structure created');
  
  // Fleet tracking (real-time)
  console.log('Setting up fleet tracking structure...');
  await db.ref('fleet/vehicles').set({
    'VEH-001': { vehicle_id: 'VEH-001', plate: 'AA-1234', type: 'Truck', status: 'active', current_location: 'Bole', last_updated: new Date().toISOString() },
    'VEH-002': { vehicle_id: 'VEH-002', plate: 'AA-5678', type: 'Van', status: 'active', current_location: 'Kazanchis', last_updated: new Date().toISOString() }
  });
  
  await db.ref('fleet/tracking').set({
    'VEH-001': { latitude: 9.0192, longitude: 38.7569, speed: 45, timestamp: new Date().toISOString() },
    'VEH-002': { latitude: 9.0272, longitude: 38.7469, speed: 30, timestamp: new Date().toISOString() }
  });
  
  console.log('✓ Fleet tracking structure created');
  
  console.log('\n✅ Firebase Realtime DB setup complete!');
}

setupFirebaseRealtimeDB().catch(console.error);
