import assert from 'node:assert/strict';
import http from 'node:http';
import { getAdvisoryDecision, getSettlementDecision } from '../src/services/LogicServiceGateway.js';

async function startStubServer({ fail = false } = {}) {
  const server = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {};
    if (req.url === '/advisory') {
      if (fail) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'forced failure' }));
        return;
      }
      const suggestions = [];
      if (body.contextType === 'finance_invoice' && (body.amount || 0) >= 50000) {
        suggestions.push({ type: 'warning', message: 'external stub warns high value' });
      }
      const verdict = suggestions.some(s => s.type === 'error') ? 'block' : suggestions.length > 0 ? 'review' : 'ok';
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, service: 'advisory', source: 'external-stub', verdict, suggestions, traceId: `ext-adv-${Date.now()}` }));
      return;
    }
    if (req.url === '/settlement') {
      if (fail) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'forced failure' }));
        return;
      }
      const subtotal = Number(body.subtotal || 0);
      const vat = subtotal * 0.15;
      const wht = body.appliesWht && subtotal >= 10000 ? subtotal * 0.02 : 0;
      const grandTotal = subtotal + vat - wht;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, service: 'settlement', source: 'external-stub', subtotal, vatAmount: vat, whtAmount: wht, grandTotal, rulesApplied: ['ET_VAT_15', wht > 0 ? 'ET_WHT_2' : null].filter(Boolean), traceId: `ext-sett-${Date.now()}` }));
      return;
    }
    res.writeHead(404);
    res.end();
  });
  await new Promise((resolve) => server.listen(0, resolve));
  const addr = server.address();
  const port = addr && addr.port;
  return { server, port };
}

(async () => {
  // Success path: server responds 200
  const { server, port } = await startStubServer({ fail: false });
  process.env.LOGIC_ADVISORY_URL = `http://127.0.0.1:${port}/advisory`;
  process.env.LOGIC_SETTLEMENT_URL = `http://127.0.0.1:${port}/settlement`;

  const advisory = await getAdvisoryDecision({ tenantId: 't', contextType: 'finance_invoice', amount: 60000 });
  assert.equal(advisory.ok, true);
  assert.equal(advisory.source, 'external-stub');
  assert.equal(advisory.verdict, 'review');

  const settlement = await getSettlementDecision({ tenantId: 't', subtotal: 10000, appliesWht: true });
  assert.equal(settlement.ok, true);
  assert.equal(settlement.source, 'external-stub');
  assert.equal(settlement.grandTotal, 11300);

  await new Promise((resolve) => server.close(resolve));

  // Failure -> fallback path: server always 500
  const s2 = await startStubServer({ fail: true });
  process.env.LOGIC_ADVISORY_URL = `http://127.0.0.1:${s2.port}/advisory`;
  process.env.LOGIC_SETTLEMENT_URL = `http://127.0.0.1:${s2.port}/settlement`;

  const advisory2 = await getAdvisoryDecision({ tenantId: 't', contextType: 'finance_invoice', amount: 60000 });
  assert.equal(advisory2.ok, true);
  assert.ok(['local-stub', 'external-stub'].includes(advisory2.source));

  const settlement2 = await getSettlementDecision({ tenantId: 't', subtotal: 10000, appliesWht: true });
  assert.equal(settlement2.ok, true);
  assert.ok(['local-stub', 'external-stub'].includes(settlement2.source));

  await new Promise((resolve) => s2.server.close(resolve));

  console.log('HTTP integration tests for LogicServiceGateway passed.');
})();
