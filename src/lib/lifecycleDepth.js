export function buildInventoryInsights(productLike = {}, quantLike = {}) {
  const qtyAvailable = Number(productLike?.qty_available ?? productLike?.quantity ?? 0);
  const reserved = Number(quantLike?.reserved_quantity ?? productLike?.reserved_quantity ?? 0);
  const threshold = Number(productLike?.reorder_threshold ?? 5);
  const onHand = Number(quantLike?.quantity ?? qtyAvailable ?? 0);

  const availableAfterReserve = Math.max(0, onHand - reserved);
  const reorderRequired = availableAfterReserve <= threshold;
  const transferSuggested = reserved > 0 && availableAfterReserve < onHand;

  let status = 'healthy';
  if (availableAfterReserve <= 0 || qtyAvailable <= threshold) {
    status = 'critical';
  } else if (qtyAvailable <= threshold * 2) {
    status = 'warning';
  }

  return {
    qtyAvailable,
    reserved,
    threshold,
    availableAfterReserve,
    reorderRequired,
    transferSuggested,
    status,
  };
}

export function buildSalesLifecycle(order = {}) {
  const state = String(order?.state || '').toLowerCase();
  const amount = Number(order?.amount_total || 0);
  const hasLines = Array.isArray(order?.order_lines) && order.order_lines.length > 0;
  const followUpNeeded = ['draft', 'sent'].includes(state) || amount <= 0;
  const revenueReady = ['sale', 'done'].includes(state);

  return {
    state,
    amount,
    hasLines,
    followUpNeeded,
    revenueReady,
    status: revenueReady ? 'ready' : followUpNeeded ? 'attention' : 'in_progress',
  };
}

export function buildPurchaseLifecycle(order = {}) {
  const state = String(order?.state || '').toLowerCase();
  const amount = Number(order?.amount_total || 0);
  const hasLines = Array.isArray(order?.order_lines) && order.order_lines.length > 0;
  const approvalNeeded = ['draft', 'sent', 'to approve'].includes(state);
  const receiptPending = ['purchase', 'to approve'].includes(state);

  return {
    state,
    amount,
    hasLines,
    approvalNeeded,
    receiptPending,
    status: approvalNeeded ? 'approval_required' : receiptPending ? 'awaiting_receipt' : 'complete',
  };
}
