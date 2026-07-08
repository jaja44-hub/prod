export function buildWarehousePosture(order = {}) {
  const state = String(order?.state || '').toLowerCase();
  const quantity = Number(order?.product_qty || 0);
  const needsAttention = ['draft', 'confirmed'].includes(state) || quantity <= 0;
  const dispatchReady = state === 'progress' && quantity > 0;

  return {
    state,
    quantity,
    needsAttention,
    dispatchReady,
    status: dispatchReady ? 'ready' : needsAttention ? 'attention' : 'stable',
  };
}
