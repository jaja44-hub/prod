import xmlrpc from 'xmlrpc';
import fs from 'fs';

const url = 'https://jafiface-addis-crown-erp.hf.space';
const db = 'POSTGRES_DATABASE=neondb';
const username = 'admin@addiscrown.com';
const password = '6c034bd45544684399d58e003b41f70c95a04fe5'; // The API key from earlier

const client = xmlrpc.createSecureClient({
  url: url + '/xmlrpc/2/common'
});

client.methodCall('authenticate', [db, username, password, {}], (err, uid) => {
  if (err) {
    console.error('Authentication Error:', err);
    process.exit(1);
  }
  console.log('Authenticated UID:', uid);
  
  const objectClient = xmlrpc.createSecureClient({
    url: url + '/xmlrpc/2/object'
  });
  
  objectClient.methodCall('execute_kw', [
    db, uid, password,
    'product.product', 'search_count', [[['active', '=', true]]]
  ], (err, count) => {
    if (err) console.error('Execution Error:', err);
    else console.log('Product Count:', count);
    process.exit(0);
  });
});
