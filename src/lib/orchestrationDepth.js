export function buildCrossModulePosture({ inventorySummary, salesLifecycle, purchaseLifecycle, financeLifecycle } = {}) {
  const focusAreas = [];

  if (inventorySummary?.status === 'critical' || inventorySummary?.reorderRequired) {
    focusAreas.push('inventory');
  }

  if (salesLifecycle?.followUpNeeded) {
    focusAreas.push('sales');
  }

  if (purchaseLifecycle?.approvalNeeded || purchaseLifecycle?.receiptPending) {
    focusAreas.push('purchase');
  }

  if ((financeLifecycle?.pending || 0) > 0 || !financeLifecycle?.reconciliationReady) {
    focusAreas.push('finance');
  }

  const severity = focusAreas.length === 0
    ? 'healthy'
    : focusAreas.length >= 3 || inventorySummary?.status === 'critical'
      ? 'critical'
      : 'watch';

  return {
    severity,
    focusAreas,
    issueCount: focusAreas.length,
    headline: severity === 'healthy'
      ? 'Cross-module posture is stable'
      : 'Cross-module posture requires immediate attention',
  };
}
