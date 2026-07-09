/**
 * test-api-endpoints.mjs
 * Test all API endpoints with seeded demo data
 * Run: node test-api-endpoints.mjs
 * 
 * Note: This script gets an ID token using Firebase REST API to avoid needing
 * the frontend running. Replace EMAIL/PASSWORD with demo credentials.
 */

import fetch from 'node-fetch';
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
const projectId = serviceAccount.project_id;

// Firebase Web API key (public, needed for REST API)
// You can get this from Firebase Console → Project Settings → Web App
const WEB_API_KEY = 'AIzaSyAZIWJZb74WPt_uPsJfKiQfKYyYhzVXfNg'; // Replace with your actual key if different

// Demo user credentials
const DEMO_USER = {
  email: 'ceo@addiscrown.et',
  password: 'Passwrd123!',
};

// Base URL for API
const BASE_URL = 'http://localhost:3000'; // Update for Vercel deployment

// ═════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═════════════════════════════════════════════════════════════════════════════

async function getIdToken() {
  console.log('🔐 Authenticating with Firebase...');
  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${WEB_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: DEMO_USER.email,
          password: DEMO_USER.password,
          returnSecureToken: true,
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(`Firebase auth failed: ${err.error?.message}`);
    }

    const data = await response.json();
    console.log(`✅ Authenticated as ${DEMO_USER.email}`);
    return data.idToken;
  } catch (err) {
    console.error(`❌ Auth failed: ${err.message}`);
    throw err;
  }
}

async function callApi(endpoint, idToken, options = {}) {
  const { method = 'GET', body = null } = options;
  const url = `${BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: body ? JSON.stringify(body) : null,
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { status: response.status, success: false, error: data.error || 'Unknown error' };
    }

    return { status: response.status, success: true, data };
  } catch (err) {
    return { status: 0, success: false, error: err.message };
  }
}

function formatResult(endpoint, result) {
  const statusIcon = result.success ? '✅' : '❌';
  const status = result.success ? `${result.status} OK` : `${result.status || 'ERR'} - ${result.error}`;
  
  console.log(`  ${statusIcon} ${endpoint.padEnd(45)} ${status}`);
  
  if (result.success && result.data) {
    const dataPreview = JSON.stringify(result.data).substring(0, 60);
    console.log(`     └─ ${dataPreview}...`);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// TEST SUITES
// ═════════════════════════════════════════════════════════════════════════════

async function testInventoryModule(idToken) {
  console.log('\n📦 INVENTORY MODULE');
  console.log('─'.repeat(80));

  const tests = [
    { name: '/api/inventory/cycle-counts', method: 'GET' },
    { name: '/api/inventory/warehouse', method: 'GET' },
    { name: '/api/inventory/valuation', method: 'GET' },
    { name: '/api/inventory/lot', method: 'GET' },
    { name: '/api/inventory/cycle-scheduler', method: 'GET' },
    { name: '/api/inventory/movements', method: 'GET' },
  ];

  for (const test of tests) {
    const result = await callApi(test.name, idToken, { method: test.method });
    formatResult(test.name, result);
  }
}

async function testSalesModule(idToken) {
  console.log('\n💰 SALES MODULE');
  console.log('─'.repeat(80));

  const tests = [
    { name: '/api/sales/orders', method: 'GET' },
    { name: '/api/sales/quotes', method: 'GET' },
    { name: '/api/sales/commission', method: 'GET' },
  ];

  for (const test of tests) {
    const result = await callApi(test.name, idToken, { method: test.method });
    formatResult(test.name, result);
  }
}

async function testPurchaseModule(idToken) {
  console.log('\n🛒 PURCHASE MODULE');
  console.log('─'.repeat(80));

  const tests = [
    { name: '/api/purchase/rfq', method: 'GET' },
    { name: '/api/purchase/receipts', method: 'GET' },
    { name: '/api/purchase/vendor-performance', method: 'GET' },
  ];

  for (const test of tests) {
    const result = await callApi(test.name, idToken, { method: test.method });
    formatResult(test.name, result);
  }
}

async function testFinanceModule(idToken) {
  console.log('\n💳 FINANCE MODULE');
  console.log('─'.repeat(80));

  const tests = [
    { name: '/api/finance/aging', method: 'GET' },
    { name: '/api/finance/payment-batching', method: 'GET' },
    {
      name: '/api/finance/reconciliation',
      method: 'POST',
      body: {
        invoices: [
          { invoiceId: 'INV-001', amount: 500000, currency: 'ETB', vendorName: 'Supplier A' },
        ],
        payments: [
          { invoiceId: 'INV-001', amount: 500000, currency: 'ETB' },
        ],
      },
    },
  ];

  for (const test of tests) {
    const result = await callApi(test.name, idToken, { method: test.method, body: test.body });
    formatResult(test.name, result);
  }
}

async function testShippingModule(idToken) {
  console.log('\n📦 SHIPPING MODULE');
  console.log('─'.repeat(80));

  const tests = [
    { name: '/api/shipping/label', method: 'GET' },
  ];

  for (const test of tests) {
    const result = await callApi(test.name, idToken, { method: test.method });
    formatResult(test.name, result);
  }
}

async function testAuditModule(idToken) {
  console.log('\n📝 AUDIT MODULE');
  console.log('─'.repeat(80));

  const tests = [
    { name: '/api/audit/logs', method: 'GET' },
  ];

  for (const test of tests) {
    const result = await callApi(test.name, idToken, { method: test.method });
    formatResult(test.name, result);
  }
}

async function testAnalyticsModule(idToken) {
  console.log('\n📊 ANALYTICS MODULE');
  console.log('─'.repeat(80));

  const tests = [
    { name: '/api/analytics/metrics', method: 'GET' },
    { name: '/api/analytics/decisions', method: 'GET' },
  ];

  for (const test of tests) {
    const result = await callApi(test.name, idToken, { method: test.method });
    formatResult(test.name, result);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN
// ═════════════════════════════════════════════════════════════════════════════

async function runTests() {
  console.log('\n' + '═'.repeat(80));
  console.log('🧪 API ENDPOINT TEST SUITE');
  console.log('═'.repeat(80));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Demo User: ${DEMO_USER.email}`);
  console.log('═'.repeat(80));

  let idToken;
  try {
    idToken = await getIdToken();
  } catch (err) {
    console.error('\n❌ Failed to get ID token. Aborting tests.');
    process.exit(1);
  }

  try {
    await testInventoryModule(idToken);
    await testSalesModule(idToken);
    await testPurchaseModule(idToken);
    await testFinanceModule(idToken);
    await testShippingModule(idToken);
    await testAuditModule(idToken);
    await testAnalyticsModule(idToken);

    console.log('\n' + '═'.repeat(80));
    console.log('🎉 TEST SUITE COMPLETE');
    console.log('═'.repeat(80));
    console.log('\n📊 Summary: Review results above to see which endpoints are working.\n');
  } catch (err) {
    console.error('\n❌ Test suite error:', err.message);
  }

  process.exit(0);
}

runTests();
