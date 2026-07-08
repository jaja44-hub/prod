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
