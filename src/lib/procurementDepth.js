export function buildProcurementPosture(order = {}) {
  const state = String(order?.state || '').toLowerCase();
  const amount = Number(order?.amount_total || 0);
  const lineCount = Array.isArray(order?.order_lines) ? order.order_lines.length : 0;
  const approvalPending = ['draft', 'sent', 'to approve'].includes(state);
  const receiptPending = ['purchase'].includes(state);
  const stage = approvalPending ? 'approval' : receiptPending ? 'receipt' : 'complete';

  return {
    state,
    amount,
    lineCount,
    approvalPending,
    receiptPending,
    stage,
    status: approvalPending ? 'approval_required' : receiptPending ? 'awaiting_receipt' : 'complete',
  };
}
