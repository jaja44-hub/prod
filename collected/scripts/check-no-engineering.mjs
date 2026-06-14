import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(process.cwd());

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (['node_modules', '.git', 'dist', 'collected'].includes(e.name)) continue;
      walk(p);
    } else {
      try {
        const txt = fs.readFileSync(p, 'utf8');
        if (/\bengineering\b/i.test(txt)) {
          console.error('Found engineering token in', p);
          process.exitCode = 2;
        }
      } catch (err) {
        // ignore binaries
      }
    }
  }
}

walk(ROOT);
if (process.exitCode && process.exitCode !== 0) {
  console.error('\nci-check failed: production-submodule contains engineering markers');
  process.exit(process.exitCode);
}
console.log('ci-check passed: no engineering markers found in production-submodule');
