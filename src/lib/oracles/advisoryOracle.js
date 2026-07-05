/**
 * Advisory Oracle Stub
 * Mocks a remote AI / Legal-commerce advisor providing contextual recommendations.
 */

export async function getAdvisoryRecommendations(contextType, contextData) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const recommendations = [];

  if (contextType === 'finance_invoice') {
    if (contextData.total >= 50000) {
      recommendations.push({
        type: 'warning',
        message: 'High value invoice detected. Ensure secondary approvals are filed before proceeding with settlement.'
      });
    }
  } else if (contextType === 'hr_employee') {
    if (contextData.complianceProfile === 'ethiopia_primary' && !contextData.tin) {
      recommendations.push({
        type: 'error',
        message: 'Ethiopian statutory compliance requires a Tax Identification Number (TIN) for payroll processing.'
      });
    }
  }

  return {
    suggestions: recommendations,
    ts: new Date().toISOString()
  };
}
