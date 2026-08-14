import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import fetch from 'node-fetch';

// Load service account
const sa = JSON.parse(fs.readFileSync('service-account.json', 'utf8'));
initializeApp({ credential: cert(sa) });
const auth = getAuth();

// CEO user UID from Firestore
const uid = 'JGXG6BzoQxXAg4hEGJ6XeN6OWts2';

// Create custom token
const customToken = await auth.createCustomToken(uid, { role: 'ceo', tenantId: 'production', tier: 1 });
console.log('Custom token created');

// Exchange custom token for ID token via REST API
const apiKey = 'AIzaSyBbEP11mDK-ZCDY52DRSnjMJOGuR9ybozs';
const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`;

const response = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token: customToken, returnSecureToken: true })
});

const data = await response.json();

if (data.idToken) {
  console.log('\nID Token obtained, testing HR mutation...');
  
  // Test HR mutation with required fields
  const mutationUrl = 'https://prod-puce-three.vercel.app/api/hr/employees';
  const mutationResponse = await fetch(mutationUrl, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${data.idToken}`,
      'X-Tenant-ID': 'production'
    },
    body: JSON.stringify({ 
      employee_id: 'EMP011', 
      first_name: 'Test', 
      last_name: 'User', 
      email: 'test@example.com', 
      department: 'HR', 
      position: 'Intern',
      hire_date: '2024-01-15',  // REQUIRED FIELD
      salary: '25000.00',
      tax_bracket: '10-15%',
      status: 'active'
    })
  });
  
  const mutationData = await mutationResponse.json();
  console.log('HR Mutation response:', JSON.stringify(mutationData, null, 2));
  console.log('HTTP Status:', mutationResponse.status);
  
  // Also test inventory mutation with required fields
  console.log('\nTesting inventory mutation...');
  const invMutationUrl = 'https://prod-puce-three.vercel.app/api/inventory/products';
  const invMutationResponse = await fetch(invMutationUrl, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${data.idToken}`,
      'X-Tenant-ID': 'production'
    },
    body: JSON.stringify({ 
      name: 'Test Product', 
      sku: 'TEST-001',  // REQUIRED FIELD
      quantity: 100,
      unit_price: '1000.00'
    })
  });
  
  const invMutationData = await invMutationResponse.json();
  console.log('Inventory Mutation response:', JSON.stringify(invMutationData, null, 2));
  console.log('HTTP Status:', invMutationResponse.status);
}
