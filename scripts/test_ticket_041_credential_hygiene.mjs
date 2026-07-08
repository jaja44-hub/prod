import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';

const projectRoot = process.cwd();
const targetFile = path.join(projectRoot, 'dev notes', 'history', 'sect new one.md');
const reportPath = path.join(projectRoot, 'copilot-reports', 'REPORT-TICKET-041.md');

assert.equal(existsSync(targetFile), true, 'Expected note file to exist for cleanup.');
const content = readFileSync(targetFile, 'utf8');
assert.equal(/gh[pousr]_[A-Za-z0-9]+/.test(content), false, 'Credential pattern still present in note file.');

const result = execSync('grep -RInE "gh[pousr]_[A-Za-z0-9]+" . --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git --include="*.md" --include="*.txt" --include="*.json" --include="*.js" --include="*.mjs" | head -50', {
  cwd: projectRoot,
  encoding: 'utf8',
});
assert.equal(result.trim(), '', 'Unexpected credential pattern found in workspace files.');

console.log('Ticket 041 credential hygiene regression passed.');
