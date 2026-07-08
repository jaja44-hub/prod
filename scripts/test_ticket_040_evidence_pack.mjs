import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const projectRoot = process.cwd();
const outputPath = path.join(projectRoot, 'copilot-reports', 'REPORT-TICKET-040.md');

const result = spawnSync('node', ['./scripts/generate_cross_repo_workflow_evidence.mjs'], {
  cwd: projectRoot,
  encoding: 'utf8',
});

assert.equal(result.status, 0, result.stdout + result.stderr);
assert.equal(existsSync(outputPath), true, 'Expected evidence report to be generated.');
const report = readFileSync(outputPath, 'utf8');
assert.match(report, /TICKET-040/i);
assert.match(report, /Cross-repo workflow evidence/i);
assert.match(report, /Validation summary/i);

console.log('Ticket 040 evidence pack regression passed.');
