// Lightweight, safe audit logger used when ServiceGateway is unavailable during
// Node-based regression runs. This avoids pulling the full Firestore stack
// into unit tests where `src/config/firebase` may not be configured.
async function safeLogAuditEvent(event) {
  // Test-mode capture: short-circuit and collect events in-memory when enabled
  try {
    if (process.env.TEST_CAPTURE_AUDIT === '1') {
      _testAudit.push(event);
      return { id: `test-${_testAudit.length}`, ...event };
    }
  } catch (e) { /* ignore */ }

  try {
    const mod = await import('./ServiceGateway.js');
    if (mod?.logAuditEvent) return await mod.logAuditEvent(event);
  } catch (err) {
    // swallow — regression/test environment fallback (no-op)
  }
}

// In-memory test audit collector
const _testAudit = [];
export function getTestAuditEntries() {
  return _testAudit.slice();
}

// Optional runtime: load external stubs and JSON-schema validator when available.
let advisoryConsultStub = null;
let settlementStub = null;
let Ajv = null;
let advisorySchema = null;
let settlementSchema = null;
try {
  // stubs are local and should be available in dev; if not, proceed with internal logic
  const adv = await import('./stubs/legalCommerceStub.js');
  advisoryConsultStub = adv.advisoryConsultStub;
} catch (e) {
  advisoryConsultStub = null;
}
try {
  const g = await import('./stubs/gibiSalesStub.js');
  settlementStub = g.settlementStub;
} catch (e) {
  settlementStub = null;
}
try {
  const AjvMod = await import('ajv');
  Ajv = AjvMod.default || AjvMod;
  advisorySchema = (await import('./contracts/advisory.schema.json', { assert: { type: 'json' } })).default;
  settlementSchema = (await import('./contracts/settlement.schema.json', { assert: { type: 'json' } })).default;
} catch (e) {
  // validator or schemas not present — runtime will skip validation
}

function normalizeAdvisoryRequest(input = {}) {
  return {
    tenantId: input.tenantId || 'production',
    module: input.module || 'Unknown',
    entityId: input.entityId || null,
    contextType: input.contextType || 'generic',
    amount: Number(input.amount || 0),
    complianceProfile: input.complianceProfile || null,
    tin: input.tin || '',
    requestedBy: input.requestedBy || 'system',
  };
}

function normalizeSettlementRequest(input = {}) {
  return {
    tenantId: input.tenantId || 'production',
    module: input.module || null,
    currency: input.currency || 'ETB',
    subtotal: Number(input.subtotal || 0),
    appliesWht: Boolean(input.appliesWht),
    jurisdiction: input.jurisdiction || 'ET',
    lineItems: Array.isArray(input.lineItems) ? input.lineItems : [],
  };
}

function buildCrossRepoAdvisoryEnvelope(normalized) {
  const moduleName = normalized.module || '';
  const repo = moduleName === 'legal_commerce_cost_estimator' ? 'legal-commerce' : 'gibi-sales';
  const connector = moduleName === 'legal_commerce_cost_estimator' ? 'legal-commerce-cost-estimator' : 'gibi-sales-service-publisher';
  const suggestions = [];

  if (moduleName === 'legal_commerce_cost_estimator') {
    const estimatedCost = Math.max(0, Number(normalized.amount || 0) * 0.15 + Number(normalized.distanceKm || 0) * 18);
    suggestions.push({ type: 'info', message: `legal-commerce: estimated service cost ${estimatedCost.toFixed(2)} ETB` });
    if (normalized.serviceType === 'delivery' && Number(normalized.distanceKm || 0) > 40) {
      suggestions.push({ type: 'warning', message: 'legal-commerce: delivery service exceeds the standard route threshold and should be reviewed.' });
    }
  } else if (moduleName === 'gibi_sales_service_publish') {
    suggestions.push({ type: 'warning', message: 'gibi-sales: policy review recommended before publishing a new logistics service.' });
  }

  const verdict = suggestions.some((s) => s.type === 'error') ? 'block' : suggestions.length > 0 ? 'review' : 'ok';
  return {
    ok: true,
    service: 'advisory',
    source: 'cross-repo-connector',
    connector,
    verdict,
    suggestions,
    traceId: `cross-adv-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    metadata: {
      repo,
      branch: repo === 'legal-commerce' ? 'jafer-legal-services' : 'main',
      module: moduleName,
    },
  };
}

function buildCrossRepoSettlementEnvelope(normalized) {
  const moduleName = normalized.module || '';
  const repo = moduleName === 'gibi_sales_settlement' ? 'gibi-sales' : 'legal-commerce';
  const connector = moduleName === 'gibi_sales_settlement' ? 'gibi-sales-settlement' : 'legal-commerce-cost-estimator';
  const vatRate = 0.15;
  const whtRate = 0.02;
  const vatAmount = normalized.subtotal * vatRate;
  const whtAmount = normalized.appliesWht && normalized.subtotal >= 10000 ? normalized.subtotal * whtRate : 0;
  const commissionAmount = normalized.subtotal * 0.01;
  const grandTotal = normalized.subtotal + vatAmount - whtAmount;

  return {
    ok: true,
    service: 'settlement',
    source: 'cross-repo-connector',
    connector,
    subtotal: normalized.subtotal,
    vatAmount,
    whtAmount,
    commissionAmount,
    grandTotal,
    currency: normalized.currency || 'ETB',
    rulesApplied: ['ET_VAT_15', normalized.appliesWht && normalized.subtotal >= 10000 ? 'ET_WHT_2' : null].filter(Boolean),
    traceId: `cross-sett-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    metadata: {
      repo,
      branch: repo === 'legal-commerce' ? 'jafer-legal-services' : 'main',
      module: moduleName,
    },
  };
}

function buildFailureEnvelope(service, error) {
  return {
    ok: false,
    service,
    source: 'local-stub',
    error: error?.message || 'Unknown error',
    traceId: `fail-${Date.now()}`,
  };
}

export async function getAdvisoryDecision(input = {}) {
  const normalized = normalizeAdvisoryRequest(input);
  try {
    if (normalized.module === 'legal_commerce_cost_estimator' || normalized.module === 'gibi_sales_service_publish') {
      const envelope = buildCrossRepoAdvisoryEnvelope(normalized);
      await safeLogAuditEvent({ entityType: 'logic_service', entityId: normalized.entityId || 'advisory', action: 'advisory_consulted', module: normalized.module, detail: 'Advisory consult via cross-repo connector', actor: normalized.requestedBy, meta: { source: envelope.source, connector: envelope.connector, traceId: envelope.traceId } });
      return envelope;
    }

    // Try configured external advisory URL first (env var or VITE_ prefixed), then stub, then local logic
    const url = process.env.LOGIC_ADVISORY_URL || (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_LOGIC_ADVISORY_URL : null);
    if (url) {
      try {
        const axios = (await import('axios')).default;
        const resp = await axios.post(url, normalized, { timeout: 3000 });
        if (resp && resp.data) {
          await safeLogAuditEvent({ entityType: 'logic_service', entityId: normalized.entityId || 'advisory', action: 'advisory_consulted', module: normalized.module, detail: `Advisory consult via external`, actor: normalized.requestedBy, meta: { source: 'external', traceId: resp.data.traceId || null } });
          return resp.data;
        }
      } catch (err) {
        // Retry once
        try {
          const axios = (await import('axios')).default;
          const resp = await axios.post(url, normalized, { timeout: 3000 });
          if (resp && resp.data) {
            await safeLogAuditEvent({ entityType: 'logic_service', entityId: normalized.entityId || 'advisory', action: 'advisory_consulted', module: normalized.module, detail: `Advisory consult via external (retry)`, actor: normalized.requestedBy, meta: { source: 'external', traceId: resp.data.traceId || null } });
            return resp.data;
          }
        } catch (err2) {
          // fall through to stub/local
        }
      }
    }

    if (typeof advisoryConsultStub === 'function') {
      const resp = await advisoryConsultStub(normalized);
      await safeLogAuditEvent({ entityType: 'logic_service', entityId: normalized.entityId || 'advisory', action: 'advisory_consulted', module: normalized.module, detail: `Advisory consult via stub`, actor: normalized.requestedBy, meta: { source: resp.source, traceId: resp.traceId || null } });
      return resp;
    }

    // fallback local logic
    const suggestions = [];
    if (normalized.contextType === 'finance_invoice' && normalized.amount >= 50000) {
      suggestions.push({ type: 'warning', message: 'High value invoice detected. Secondary approval is recommended before settlement.' });
    }
    if (normalized.contextType === 'hr_employee' && normalized.complianceProfile === 'ethiopia_primary' && !normalized.tin) {
      suggestions.push({ type: 'error', message: 'Ethiopian statutory compliance requires a Tax Identification Number (TIN).' });
    }
    const verdict = suggestions.some((s) => s.type === 'error') ? 'block' : suggestions.length > 0 ? 'review' : 'ok';
    const envelope = { ok: true, service: 'advisory', source: 'local-stub', verdict, suggestions, traceId: `adv-${Date.now()}`, generatedAt: new Date().toISOString() };
    await safeLogAuditEvent({ entityType: 'logic_service', entityId: normalized.entityId || 'advisory', action: 'advisory_consulted', module: normalized.module, detail: `Advisory consult via local`, actor: normalized.requestedBy, meta: { source: envelope.source, traceId: envelope.traceId } });
    return envelope;
  } catch (error) {
    return buildFailureEnvelope('advisory', error);
  }
}

export async function getSettlementDecision(input = {}) {
  const normalized = normalizeSettlementRequest(input);
  try {
    if (normalized.module === 'gibi_sales_settlement' || normalized.module === 'legal_commerce_service_cost') {
      const envelope = buildCrossRepoSettlementEnvelope(normalized);
      await safeLogAuditEvent({ entityType: 'logic_service', entityId: normalized.tenantId, action: 'settlement_calculated', module: normalized.module, detail: 'Settlement via cross-repo connector', actor: 'system', meta: { source: envelope.source, connector: envelope.connector, traceId: envelope.traceId } });
      return envelope;
    }

    // Prefer external configured settlement URL, then stub, otherwise local calc
    const url = process.env.LOGIC_SETTLEMENT_URL || (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_LOGIC_SETTLEMENT_URL : null);
    if (url) {
      try {
        const axios = (await import('axios')).default;
        const resp = await axios.post(url, normalized, { timeout: 3000 });
        if (resp && resp.data) {
          await safeLogAuditEvent({ entityType: 'logic_service', entityId: normalized.tenantId, action: 'settlement_calculated', module: 'Finance', detail: 'Settlement via external', actor: 'system', meta: { source: 'external', traceId: resp.data.traceId || null } });
          return resp.data;
        }
      } catch (err) {
        // retry once
        try {
          const axios = (await import('axios')).default;
          const resp = await axios.post(url, normalized, { timeout: 3000 });
          if (resp && resp.data) {
            await safeLogAuditEvent({ entityType: 'logic_service', entityId: normalized.tenantId, action: 'settlement_calculated', module: 'Finance', detail: 'Settlement via external (retry)', actor: 'system', meta: { source: 'external', traceId: resp.data.traceId || null } });
            return resp.data;
          }
        } catch (err2) {
          // fall through to stub/local
        }
      }
    }

    if (typeof settlementStub === 'function') {
      const resp = await settlementStub(normalized);
      await safeLogAuditEvent({ entityType: 'logic_service', entityId: normalized.tenantId, action: 'settlement_calculated', module: 'Finance', detail: 'Settlement via stub', actor: 'system', meta: { source: resp.source, traceId: resp.traceId || null } });
      return resp;
    }

    const vatRate = 0.15;
    const whtRate = 0.02;
    const vatAmount = normalized.subtotal * vatRate;
    const whtAmount = normalized.appliesWht && normalized.subtotal >= 10000 ? normalized.subtotal * whtRate : 0;
    const grandTotal = normalized.subtotal + vatAmount - whtAmount;

    const envelope = {
      ok: true,
      service: 'settlement',
      source: 'local-stub',
      subtotal: normalized.subtotal,
      vatAmount,
      whtAmount,
      grandTotal,
      currency: normalized.currency,
      rulesApplied: ['ET_VAT_15', normalized.appliesWht && normalized.subtotal >= 10000 ? 'ET_WHT_2' : null].filter(Boolean),
      traceId: `sett-${Date.now()}`,
      generatedAt: new Date().toISOString(),
    };

    await safeLogAuditEvent({
      entityType: 'logic_service',
      entityId: normalized.tenantId,
      action: 'settlement_calculated',
      module: 'Finance',
      detail: 'Settlement contract consult (local)',
      actor: 'system',
      meta: { source: envelope.source, grandTotal },
    });

    return envelope;
  } catch (error) {
    return buildFailureEnvelope('settlement', error);
  }
}

export default {
  getAdvisoryDecision,
  getSettlementDecision,
};
