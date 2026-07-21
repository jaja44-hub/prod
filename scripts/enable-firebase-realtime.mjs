#!/usr/bin/env node
import { readFileSync } from 'fs';
import admin from 'firebase-admin';

const serviceAccount = JSON.parse(readFileSync('/home/ja/Documents/production-submodule/service-account.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function enableRealtimeDatabase() {
  console.log('Attempting to enable Firebase Realtime Database via Admin SDK...\n');
  
  try {
    // Try to access the database - this will fail if not enabled
    const db = admin.database();
    
    // Try a simple read operation to check if database is accessible
    const testRef = db.ref('.info/connected');
    await testRef.once('value');
    
    console.log('✅ Realtime Database is already enabled and accessible!');
    console.log('Database URL: https://sample-firebase-ai-app-27a8e-default-rtdb.firebaseio.com/');
    
    return true;
  } catch (error) {
    console.log('❌ Realtime Database is not enabled or not accessible');
    console.log('Error:', error.message);
    console.log('\n⚠️  Firebase Admin SDK cannot enable Realtime Database programmatically.');
    console.log('You must enable it manually in the Firebase Console.');
    
    return false;
  }
}

enableRealtimeDatabase().catch(console.error);
