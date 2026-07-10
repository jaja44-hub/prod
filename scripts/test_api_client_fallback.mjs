import assert from 'node:assert/strict';
import { ApiClient } from '../src/lib/apiClient.js';

async function main() {
  const originalFetch = global.fetch;

  global.fetch = async () => ({
    ok: true,
    headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
    text: async () => '<html><body>fallback html</body></html>',
    json: async () => {
      throw new SyntaxError("Unexpected token '<'");
    },
  });

  try {
    const client = new ApiClient({ baseUrl: 'https://example.test' });
    const value = await client.get('/api/health');

    assert.ok(value && typeof value === 'object', 'Expected a parsed fallback object');
    assert.equal(value.__rawText, '<html><body>fallback html</body></html>');
    assert.equal(value.__parseError, 'HTML or non-JSON response');
    console.log('✓ ApiClient fallback parsing handled HTML payloads');
  } finally {
    global.fetch = originalFetch;
  }
}

main().catch((err) => {
  console.error('✗ ApiClient fallback parsing test failed:', err.message);
  process.exit(1);
});
