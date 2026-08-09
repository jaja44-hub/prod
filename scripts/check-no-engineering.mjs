/**
 * ci-check: Verify no banned cross-repo/legacy layers leak into production app source.
 *
 * S1 (Core Separation & Hardening): the Odoo bridge, the cross-sector
 * EngineeringGateway, and the cross-repo GitHub connector were removed from
 * the runtime path. This guard enforces that no resurrected import, route, or
 * UI data path references them inside the active production source.
 *
 * SCOPE: Only scans production app source directories:
 *   - src/pages/         (ERP module views)
 *   - src/components/    (shared UI components)
 *   - src/context/       (React context providers)
 *   - src/lib/           (kernel utilities)
 *   - src/config/        (Firebase config)
 *   - src/services/      (service layer — gateway/files)
 *   - api/               (Vercel serverless proxy)
 *   - server/api/        (Express-era server handlers)
 *
 * DELIBERATELY EXCLUDED from scan (historical/architectural evidence):
 *   - scripts/           One-off maintenance tooling (may reference historical layers)
 *   - odoo-backend/       Odoo Community source — banned layer, kept as historical
 *   - dev notes/          Internal planning docs — strategy language
 *   - COURSE_DATABASE_FUNDAMENTALS/  Curriculum docs
 *   - node_modules/       Third-party packages
 *   - dist/               Production build output
 *   - .git/               Version control internals
 *   - src/pages/_archive/ Archived/deprecated UI files
 *
 * WHAT IT CATCHES: banned-layer imports, gateway wiring, token usage
 * (odoo / engineering / github-connector) in active source files.
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(process.cwd());

// Scan these directories — everything else is excluded by default
const SCAN_ROOTS = [
  path.join(ROOT, 'src', 'pages'),
  path.join(ROOT, 'src', 'components'),
  path.join(ROOT, 'src', 'context'),
  path.join(ROOT, 'src', 'lib'),
  path.join(ROOT, 'src', 'config'),
  path.join(ROOT, 'src', 'services'),
  path.join(ROOT, 'api'),
  path.join(ROOT, 'api', 'lib'),
  path.join(ROOT, 'server', 'api'),
];

// Files within scan roots that are explicitly allowed to contain the tokens
// (none since S1 removed the gateways — kept here intentionally empty so a
//  regression reintroducing an exemption fails loudly).
const ALLOWED_FILES = new Set([]);

// Subdirectories within scan roots to skip
const SKIP_DIRS = new Set(['_archive', 'node_modules', '.git', 'dist', 'collected']);

// Banned tokens from the S1 "No banned layer" doctrine.
const TOKENS = [
  /\bengineering\b/i,
  /\bodoo\b/i,
  /\bgithubAppClient\b/i,
  /\bEngineeringGateway\b/i,
  /\bVITE_ENG_/i,
  /\botokit\b/i,
  /ODOO_PROXY_URL/i,
  /\bgetOdoo\b/i,
  /\bodooQuery\b/i,
  /\bodooClient\b/i,
];

function walk(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return; // directory may not exist
  }

  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      walk(p);
    } else {
      if (p.endsWith('check-no-engineering.mjs')) continue;
      if (p.endsWith('package.json')) continue;
      if (p.endsWith('package-lock.json')) continue;
      if (ALLOWED_FILES.has(p)) continue;
      try {
        const txt = fs.readFileSync(p, 'utf8');
        const lines = txt.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const trimmed = line.trim();
          // Skip pure comment lines (allowed architecture notes)
          if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) continue;
          // Skip the company's own legal name (payslip PDF headers — not a sector leak)
          if (/addis crown legal.*engineering/i.test(line)) continue;
          for (const tok of TOKENS) {
            if (tok.test(line)) {
              console.error(`Found banned-layer token ${JSON.stringify(tok.toString())} in ${p}:${i + 1} — ${trimmed.substring(0, 100)}`);
              process.exitCode = 2;
              break;
            }
          }
        }
      } catch {
        // ignore binaries / unreadable files
      }
    }
  }
}

console.log('ci-check: scanning production app source for banned-layer tokens (odoo / github / engineering)...');
console.log('Scoped to: src/{pages,components,context,lib,config,services}, api/, server/api/\n');

for (const scanRoot of SCAN_ROOTS) {
  walk(scanRoot);
}

if (process.exitCode && process.exitCode !== 0) {
  console.error('\nci-check FAILED: production source contains banned-layer markers.');
  console.error('Check the files listed above and remove any odoo / github / engineering imports or data reads.');
  process.exit(process.exitCode);
}

console.log('✅ ci-check PASSED: No banned-layer markers found in production app source.');
