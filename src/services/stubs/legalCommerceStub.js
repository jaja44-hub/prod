export async function advisoryConsultStub(request) {
  // Simulate an external advisory engine response
  await new Promise((r) => setTimeout(r, 120));
  const suggestions = [];
  if (request.contextType === 'finance_invoice' && request.amount >= 50000) {
    suggestions.push({ type: 'warning', message: 'External legal-commerce: recommend secondary approval.' });
  }
  const verdict = suggestions.some(s => s.type === 'error') ? 'block' : suggestions.length > 0 ? 'review' : 'ok';
  return {
    ok: true,
    service: 'advisory',
    source: 'external-stub',
    verdict,
    suggestions,
    traceId: `ext-adv-${Date.now()}`,
    generatedAt: new Date().toISOString(),
  };
}
