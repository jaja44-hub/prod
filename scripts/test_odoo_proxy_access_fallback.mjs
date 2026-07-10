import assert from 'node:assert/strict';
import { shouldUseEmptyReadFallback } from '../api/odooProxy.js';

const readFallback = shouldUseEmptyReadFallback('search_read', { uid: 'u1', role: 'sales_head' });
assert.equal(readFallback, true, 'read methods should fall back to empty data for authenticated users');

const writeFallback = shouldUseEmptyReadFallback('create', { uid: 'u1', role: 'sales_head' });
assert.equal(writeFallback, false, 'write methods should not use the empty-read fallback');

console.log('✅ Odoo proxy access-fallback regression check passed');
