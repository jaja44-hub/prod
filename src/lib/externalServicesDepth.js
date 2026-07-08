export function buildExternalServicePosture(input = {}) {
  const advisory = input.advisory || {};
  const settlement = input.settlement || null;
  const auditEntries = Array.isArray(input.auditEntries) ? input.auditEntries : [];

  const advisoryReady = Boolean(advisory.available && advisory.confidence >= 0.7);
  const settlementReady = Boolean(settlement && settlement.grandTotal != null && Array.isArray(settlement.rulesApplied) && settlement.rulesApplied.length > 0);
  const governanceHealthy = auditEntries.length > 0 && advisoryReady;

  const issues = [];
  if (!advisoryReady) issues.push('advisory');
  if (!settlementReady) issues.push('settlement');
  if (!governanceHealthy) issues.push('governance');

  const status = issues.length === 0 ? 'operational' : issues.length === 1 ? 'watch' : 'degraded';

  return {
    status,
    advisoryReady,
    settlementReady,
    governanceHealthy,
    auditCount: auditEntries.length,
    issues,
    summary: issues.length === 0
      ? 'Advisory, settlement, and governance signals are healthy.'
      : `External service posture requires attention: ${issues.join(', ')}.`,
  };
}
