#!/usr/bin/env node
/**
 * Scan ALL current OpenRouter :free models and report which ones actually work
 * with a plain OpenRouter API key (is_byok=false) vs which are BYOK-only
 * (require the upstream provider's own key) vs unreachable.
 *
 * Usage:
 *   OPENROUTER_API_KEY=sk-or-... node scripts/scan-openrouter-free.mjs
 *
 * The key is read ONLY from the OPENROUTER_API_KEY env var. Never printed.
 */

const KEY = process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_KEY || '';
if (!KEY) {
  console.error('❌ OPENROUTER_API_KEY env var not set.');
  process.exit(2);
}
console.log(`🔑 key: ${KEY.slice(0, 6)}…${KEY.slice(-4)} (len ${KEY.length})`);

const PROBE = {
  model: '__MODEL__',
  messages: [
    { role: 'system', content: 'Reply with exactly: PONG' },
    { role: 'user', content: 'Ping' },
  ],
  max_tokens: 8,
  temperature: 0,
};

async function testModel(id) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 30000);
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://localhost/vscode-test',
        'X-Title': 'Free Model Scan',
      },
      body: JSON.stringify({ ...PROBE, model: id }),
    });
    const text = await res.text();
    if (!res.ok) {
      let j = null;
      try { j = JSON.parse(text); } catch { /* ignore */ }
      const meta = j?.error?.metadata;
      const byok = meta?.is_byok === true;
      const raw = meta?.raw || '';
      let reason = 'HTTP ' + res.status;
      if (res.status === 401) reason = byok ? 'BYOK-only (needs provider key)' : 'key rejected';
      else if (res.status === 429) reason = 'rate limited (429)';
      else if (res.status === 400) reason = byok ? 'BYOK-only (needs provider key)' : 'bad request (400)';
      else if (res.status === 404) reason = 'model unavailable (404)';
      return { id, ok: false, byok, reason, status: res.status };
    }
    const j = JSON.parse(text);
    const content = j?.choices?.[0]?.message?.content || '';
    const usage = j?.usage || {};
    return {
      id, ok: true, byok: usage.is_byok === true,
      reason: content.trim().slice(0, 20) || 'ok',
      status: res.status,
    };
  } catch (e) {
    return { id, ok: false, byok: null, reason: e.name === 'AbortError' ? 'timeout' : e.message, status: 0 };
  } finally {
    clearTimeout(t);
  }
}

// Fetch live catalog of :free models
let freeIds = [];
try {
  const r = await fetch('https://openrouter.ai/api/v1/models');
  const j = await r.json();
  freeIds = (j.data || [])
    .filter((m) => String(m.id).endsWith(':free'))
    .map((m) => m.id)
    .sort();
} catch (e) {
  console.error('Could not fetch model catalog:', e.message);
  process.exit(2);
}

console.log(`\nFound ${freeIds.length} free models on OpenRouter.\n`);
const results = [];
for (const id of freeIds) {
  process.stdout.write(`  testing ${id} ... `);
  const r = await testModel(id);
  results.push(r);
  process.stdout.write(r.ok ? '✅\n' : '❌\n');
  await new Promise((res) => setTimeout(res, 1200)); // gentle pacing to avoid 429s
}

console.log('\n================ SUMMARY ================\n');
console.log('✅ WORKS WITH PLAIN OPENROUTER KEY (is_byok=false):');
for (const r of results) if (r.ok && !r.byok) console.log('   ' + r.id);
console.log('\n⚠️  FREE BUT BYOK-ONLY (needs that provider\'s own API key):');
for (const r of results) if (!r.ok && r.byok) console.log(`   ${r.id}  (${r.reason})`);
console.log('\n❌ FAILED / UNREACHABLE / RATE LIMITED:');
for (const r of results) if (!r.ok && !r.byok) console.log(`   ${r.id}  (${r.reason})`);
