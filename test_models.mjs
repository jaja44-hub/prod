import xmlrpc from 'xmlrpc';

const url = 'https://jafiface-addis-crown-erp.hf.space';
const db = 'POSTGRES_DATABASE=neondb';
const username = 'admin';
const password = '6c034bd45544684399d58e003b41f70c95a04fe5'; 

const client = xmlrpc.createSecureClient({
  url: url + '/xmlrpc/2/common'
});

client.methodCall('authenticate', [db, username, password, {}], (err, uid) => {
  if (err || !uid) {
    console.error('Authentication Error:', err || 'Access Denied');
    process.exit(1);
  }
  
  const objectClient = xmlrpc.createSecureClient({
    url: url + '/xmlrpc/2/object'
  });
  
  objectClient.methodCall('execute_kw', [
    db, uid, password,
    'purchase.order', 'search_count', [[]]
  ], (err, count) => {
    if (err) console.error('Execution Error (purchase.order):', err);
    else console.log('Purchase Order Count:', count);
    
    objectClient.methodCall('execute_kw', [
        db, uid, password,
        'mrp.production', 'search_count', [[]]
    ], (err2, count2) => {
        if (err2) console.error('Execution Error (mrp.production):', err2);
        else console.log('MRP Count:', count2);
        process.exit(0);
    });
  });
});
