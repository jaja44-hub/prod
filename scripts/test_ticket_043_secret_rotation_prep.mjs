import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const out = path.join(root, 'copilot-reports', 'REPORT-TICKET-043.md');
let report = `# REPORT-TICKET-043\n\n## Findings\n\n`;

function run(cmd) {
  try {
    return execSync(cmd, { cwd: root, encoding: 'utf8', stdio: 'pipe' }).trim();
  } catch (e) {
    return (e.stdout || '').toString().trim();
  }
}

// Patterns and filenames to look for
const patterns = [
  "gh[pousr]_[A-Za-z0-9]+",
  "hf_[A-Za-z0-9_]+",
  "service-account.json",
  "service-account-.*.json",
  "*.key",
  "*.pem",
  "*.p12",
  "*.jks",
  "credentials.json",
  "*.env",
  "*backup*",
  "*-backup*",
  "*.bak",
  "\.zip",
  "\.tar",
  "\.tar\.gz",
];

for (const p of patterns) {
  report += `### Pattern: ${p}\n`;
  const cmd = `grep -RInE "${p.replace(/\*/g, '.*')}" . --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git --include=\"*.md\" --include=\"*.txt\" --include=\"*.json\" --include=\"*.js\" --include=\"*.mjs\" --include=\"*.env\" || true`;
  const outp = run(cmd);
  report += outp ? outp + '\n\n' : '_No matches found._\n\n';
}

// Check for large binary backups inside the repo tree
report += '### Large files (top 20 in repo)\n';
const ls = run('git ls-files -z | xargs -0 du -h 2>/dev/null | sort -hr | head -n 20 || true');
report += ls ? ls + '\n\n' : '_Unable to enumerate large tracked files (git ls-files may not be available)._\n\n';

// Recommendations stub
report += '## Recommendations\n\n- Files with embedded tokens: redact and remove from tracked history; rotate any external credentials immediately.\n- service-account.json and similarly named files: treat as sensitive, move to secure vault and rotate keys.\n- Backups (zip/tar/bak): inspect contents; if they contain secrets, remove from repo and rotate affected credentials.\n- For any external platform (GitHub, Vercel, Hugging Face, Firebase), coordinate rotation steps before deleting live keys.\n\n';

writeFileSync(out, report, 'utf8');
console.log('Wrote', out);
process.exit(0);
