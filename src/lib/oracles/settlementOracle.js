/**
 * Settlement Oracle Stub
 * Mocks the remote processing of compliance-heavy financial tasks (e.g., Ethiopian VAT/WHT).
 */

export async function calculateEthiopianTaxes(subtotal, appliesWht = false) {
  // Simulate network delay to remote oracle
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const vatRate = 0.15;
  const whtRate = 0.02;

  const vatAmount = subtotal * vatRate;
  const whtAmount = appliesWht && subtotal >= 10000 ? subtotal * whtRate : 0;
  
  const grandTotal = subtotal + vatAmount - whtAmount;

  return {
    subtotal,
    vatRate,
    vatAmount,
    whtRate: appliesWht && subtotal >= 10000 ? whtRate : 0,
    whtAmount,
    grandTotal,
    currency: 'ETB',
    rulesApplied: ['ET_VAT_15', appliesWht && subtotal >= 10000 ? 'ET_WHT_2' : null].filter(Boolean)
  };
}
