export function buildApprovalLogicContext(approval = {}, tenantId = 'production') {
  const amount = Number(approval?.amount || 0);
  const moduleName = approval?.module || 'Unknown';

  const isFinance = moduleName === 'Finance';
  const isHr = moduleName === 'HR';

  const advisoryModule = isHr ? 'legal_commerce_cost_estimator' : 'gibi_sales_service_publish';
  const settlementModule = isFinance ? 'gibi_sales_settlement' : 'legal_commerce_service_cost';

  return {
    tenantId,
    advisory: {
      tenantId,
      module: advisoryModule,
      entityId: approval?.id || null,
      contextType: isHr ? 'hr_employee' : 'finance_invoice',
      amount,
      complianceProfile: 'ethiopia_primary',
      tin: '',
      requestedBy: approval?.requestedBy || 'system',
    },
    settlement: {
      tenantId,
      module: settlementModule,
      currency: 'ETB',
      subtotal: amount,
      appliesWht: isFinance && amount >= 10000,
      jurisdiction: 'ET',
      lineItems: amount > 0 ? [{ sku: approval?.id || 'approval', amount }] : [],
    },
  };
}
