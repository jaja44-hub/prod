/**
 * ci-check: Verify no engineering-sector UI data leaks into production app source.
 *
 * SCOPE: Only scans production app source directories:
 *   - src/pages/         (ERP module views)
 *   - src/components/    (shared UI components)
 *   - src/context/       (React context providers)
 *   - src/lib/           (kernel utilities)
 *   - src/config/        (Firebase config)
 *   - api/               (Vercel serverless proxy)
 *
 * DELIBERATELY EXCLUDED from scan:
 *   - odoo-backend/       Odoo Community source — "engineering" is natural language there
 *   - dev notes/          Internal planning docs — architectural strategy language
 *   - node_modules/       Third-party packages
 *   - dist/               Production build output
 *   - .git/               Version control internals
 *   - src/services/EngineeringGateway.js   Intentional cross-sector bridge (by design)
 *   - src/pages/_archive/ Archived/deprecated UI files
 *   - src/services/ServiceGateway.js       Re-exports EngineeringGateway by design
 *
 * WHAT IT CATCHES: Engineering Firestore data reads, engineering UI components,
 * or engineering-sector routes appearing in active production page/component files.
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(process.cwd());

// Only scan these directories — everything else is excluded by default
const SCAN_ROOTS = [
  path.join(ROOT, 'src', 'pages'),
  path.join(ROOT, 'src', 'components'),
  path.join(ROOT, 'src', 'context'),
  path.join(ROOT, 'src', 'lib'),
  path.join(ROOT, 'src', 'config'),
  path.join(ROOT, 'api'),
];

// Files within scan roots that are explicitly allowed to contain the token
const ALLOWED_FILES = new Set([
  path.join(ROOT, 'src', 'services', 'EngineeringGateway.js'),
  path.join(ROOT, 'src', 'services', 'ServiceGateway.js'),
]);

// Subdirectories within scan roots to skip
const SKIP_DIRS = new Set(['_archive', 'node_modules', '.git', 'dist', 'collected']);

function walk(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return; // directory may not exist (e.g. src/components if not yet created)
  }

  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      walk(p);
    } else {
      if (p.endsWith('check-no-engineering.mjs')) continue;
      if (p.endsWith('package.json')) continue;
      if (ALLOWED_FILES.has(p)) continue;
      try {
        const txt = fs.readFileSync(p, 'utf8');
        // Flag if "engineering" appears — but only if it is NOT a comment explaining
        // the gateway pattern (i.e., not a JSDoc/inline architecture note)
        const lines = txt.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const trimmed = line.trim();
          // Skip pure comment lines that document the bridge (allowed architecture notes)
          if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) continue;
          // Skip the company's own legal name (appears on payslip PDF headers — not a sector leak)
          if (/addis crown legal.*engineering/i.test(line)) continue;
          if (/\bengineering\b/i.test(line)) {
            console.error(`Found engineering token in ${p}:${i + 1} — ${trimmed.substring(0, 100)}`);
            process.exitCode = 2;
          }
        }
      } catch {
        // ignore binaries / unreadable files
      }
    }
  }
}

console.log('Scanning production app source for engineering token leaks...');
console.log('Scoped to: src/pages, src/components, src/context, src/lib, src/config, api/\n');

for (const scanRoot of SCAN_ROOTS) {
  walk(scanRoot);
}

if (process.exitCode && process.exitCode !== 0) {
  console.error('\nci-check FAILED: production app source contains engineering markers.');
  console.error('Check the files listed above and remove any engineering-sector data reads or UI imports.');
  process.exit(process.exitCode);
}

console.log('✅ ci-check PASSED: No engineering markers found in production app source.');
