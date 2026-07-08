export function buildFinanceLifecycle(items = []) {
  const normalizedItems = Array.isArray(items) ? items : [];
  const total = normalizedItems.reduce((sum, item) => sum + Number(item?.amount || 0), 0);
  const posted = normalizedItems.filter((item) => String(item?.state || '').toLowerCase() === 'posted').length;
  const draft = normalizedItems.filter((item) => String(item?.state || '').toLowerCase() === 'draft').length;
  const pending = Math.max(0, draft);
  const reconciliationReady = posted > 0;

  return {
    count: normalizedItems.length,
    total,
    posted,
    draft,
    pending,
    reconciliationReady,
    status: pending > 0 ? 'needs_follow_up' : reconciliationReady ? 'reconciled_ready' : 'idle',
  };
}

export function buildFinancePosture({ payments = [], salesOrders = [], purchaseOrders = [] } = {}) {
  const financeLifecycle = buildFinanceLifecycle(payments);
  const receivablesPending = salesOrders.filter((order) => String(order?.state || '').toLowerCase() === 'draft').length;
  const payablesPending = purchaseOrders.filter((order) => ['draft', 'sent', 'to approve'].includes(String(order?.state || '').toLowerCase())).length;

  return {
    ...financeLifecycle,
    receivablesPending,
    payablesPending,
    reportingReady: financeLifecycle.reconciliationReady || receivablesPending + payablesPending > 0,
    status: financeLifecycle.pending > 0 || receivablesPending + payablesPending > 0 ? 'needs_follow_up' : 'stable',
  };
}
