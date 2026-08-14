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
const apiKey = 'AIzaSyBbEP11mDK-ZCDY52DRSnjMJOGuR9ybozs'; // From VITE_FIREBASE_CONFIG
const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`;

const response = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token: customToken, returnSecureToken: true })
});

const data = await response.json();
console.log('ID Token response:', JSON.stringify(data, null, 2));

if (data.idToken) {
  console.log('\nID Token (first 50 chars):', data.idToken.substring(0, 50) + '...');
  
  // Now test the live mutation with this ID token
  const mutationUrl = 'https://prod-puce-three.vercel.app/api/inventory/products';
  const mutationResponse = await fetch(mutationUrl, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${data.idToken}`,
      'X-Tenant-ID': 'production'
    },
    body: JSON.stringify({ name: 'Test Product', sku: 'TEST-001' })
  });
  
  const mutationData = await mutationResponse.json();
  console.log('\nMutation response:', JSON.stringify(mutationData, null, 2));
  console.log('HTTP Status:', mutationResponse.status);
}
