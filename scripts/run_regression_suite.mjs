import { spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const scriptsToRun = [
  'test_module_registry.mjs',
  'test_event_bus.mjs',
  'test_tenant_domain.mjs',
  'test_odoo_query.mjs'
];

let failed = false;

console.log('=== STARTING ODOO HF REGRESSION SUITE ===');

for (const script of scriptsToRun) {
  const scriptPath = path.resolve(process.cwd(), 'scripts', script);
  if (!fs.existsSync(scriptPath)) {
    console.error(`Script not found: ${scriptPath}`);
    failed = true;
    continue;
  }

  console.log(`\nRunning: node scripts/${script}...`);
  const res = spawnSync('node', [scriptPath], { stdio: 'inherit' });

  if (res.status !== 0) {
    console.error(`❌ FAILED: ${script}`);
    failed = true;
  } else {
    console.log(`✅ PASSED: ${script}`);
  }
}

console.log('\n=========================================');
if (failed) {
  console.error('❌ REGRESSION SUITE FAILED!');
  process.exit(1);
} else {
  console.log('✅ ALL REGRESSION TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}
