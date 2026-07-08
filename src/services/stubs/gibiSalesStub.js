export async function settlementStub(request) {
  // Simulate external settlement engine calculation
  await new Promise((r) => setTimeout(r, 120));
  const vatRate = 0.15;
  const whtRate = 0.02;
  const vatAmount = request.subtotal * vatRate;
  const whtAmount = request.appliesWht && request.subtotal >= 10000 ? request.subtotal * whtRate : 0;
  const grandTotal = request.subtotal + vatAmount - whtAmount;
  return {
    ok: true,
    service: 'settlement',
    source: 'external-stub',
    subtotal: request.subtotal,
    vatAmount,
    whtAmount,
    grandTotal,
    currency: request.currency || 'ETB',
    rulesApplied: ['ET_VAT_15', request.appliesWht && request.subtotal >= 10000 ? 'ET_WHT_2' : null].filter(Boolean),
    traceId: `ext-sett-${Date.now()}`,
    generatedAt: new Date().toISOString(),
  };
}
