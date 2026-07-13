import https from 'https';

const ODOO_URL = 'https://jafiface-addis-crown-erp.hf.space';

console.log('🔍 Testing Hugging Face Space Availability');
console.log('=============================================\n');

function checkUrl(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: '/',
      method: 'GET',
      rejectUnauthorized: false,
    };

    const req = https.request(options, (res) => {
      console.log(`Status Code: ${res.statusCode}`);
      console.log(`Headers:`, res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`Response Body (first 500 chars):`);
        console.log(data.substring(0, 500));
        resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
      });
    });

    req.on('error', (error) => {
      console.error(`Request failed: ${error.message}`);
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function main() {
  try {
    console.log(`Testing URL: ${ODOO_URL}\n`);
    const result = await checkUrl(ODOO_URL);
    
    if (result.statusCode >= 200 && result.statusCode < 400) {
      console.log('\n✅ Hugging Face Space is accessible');
    } else {
      console.log(`\n⚠️  Hugging Face Space returned status ${result.statusCode}`);
    }
  } catch (error) {
    console.error(`\n❌ Failed to reach Hugging Face Space: ${error.message}`);
    console.error('This suggests the space may be down or not accessible');
  }
}

main();
