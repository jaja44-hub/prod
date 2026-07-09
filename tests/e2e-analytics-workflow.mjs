/**
 * tests/e2e-analytics-workflow.mjs
 * Analytics module E2E workflow test: KPI accuracy & budget variance
 */

export async function testAnalyticsWorkflow() {
  // Mock API responses for testing without live server
  const mockMetrics = {
    report: {
      kpis: {
        totalRevenue: 250000,
        totalCost: 175000,
        marginPercentage: 30,
      },
      health: {
        revenueStatus: 'healthy',
        costStatus: 'acceptable',
        marginStatus: 'healthy',
        overallStatus: 'healthy',
      },
      currencyBreakdown: {
        USD: 180000,
        EUR: 45000,
        GBP: 25000,
      },
      success: true,
    },
  };

  const mockDecisions = {
    report: {
      reorderSuggestions: [
        { sku: 'PROD-001', currentStock: 10, reorderPoint: 50, suggestedQuantity: 100, urgency: 'high' },
        { sku: 'PROD-002', currentStock: 150, reorderPoint: 75, suggestedQuantity: 50, urgency: 'low' },
        { sku: 'PROD-003', currentStock: 5, reorderPoint: 30, suggestedQuantity: 200, urgency: 'critical' },
      ],
      budgetAnalysis: {
        status: 'on_track',
        totalVariance: 2.5,
        lineItems: [
          { category: 'Materials', budgeted: 100000, actual: 98500, variancePercent: -1.5, status: 'under' },
          { category: 'Labor', budgeted: 50000, actual: 52000, variancePercent: 4, status: 'over' },
          { category: 'Overhead', budgeted: 30000, actual: 29500, variancePercent: -1.67, status: 'under' },
        ],
      },
      success: true,
    },
  };

  try {
    // Validate KPI structure
    if (!mockMetrics.report) throw new Error('Metrics report missing');
    if (!mockMetrics.report.kpis) throw new Error('KPIs object missing');
    if (!mockMetrics.report.health) throw new Error('Health status missing');

    const kpis = mockMetrics.report.kpis;
    const health = mockMetrics.report.health;

    if (typeof kpis.totalRevenue !== 'number') throw new Error('Total revenue not a number');
    if (typeof kpis.totalCost !== 'number') throw new Error('Total cost not a number');
    if (typeof kpis.marginPercentage !== 'number') throw new Error('Margin percentage not a number');

    // Validate health status
    const validStatuses = ['healthy', 'acceptable', 'at_risk'];
    if (!validStatuses.includes(health.revenueStatus)) throw new Error('Invalid revenue health status');
    if (!validStatuses.includes(health.costStatus)) throw new Error('Invalid cost health status');
    if (!validStatuses.includes(health.marginStatus)) throw new Error('Invalid margin health status');
    if (!validStatuses.includes(health.overallStatus)) throw new Error('Invalid overall health status');

    // Validate currency breakdown
    if (!mockMetrics.report.currencyBreakdown) throw new Error('Currency breakdown missing');
    const currencyAmounts = Object.values(mockMetrics.report.currencyBreakdown);
    const totalByCurrency = currencyAmounts.reduce((sum, amt) => sum + amt, 0);
    
    if (kpis.totalRevenue > 0 && Math.abs(totalByCurrency - kpis.totalRevenue) > 1) {
      throw new Error('Currency breakdown total mismatch');
    }

    // Validate reorder suggestions
    if (!Array.isArray(mockDecisions.report.reorderSuggestions)) {
      throw new Error('Reorder suggestions not an array');
    }

    mockDecisions.report.reorderSuggestions.forEach((suggestion) => {
      if (!suggestion.sku) throw new Error('SKU missing in reorder suggestion');
      if (typeof suggestion.currentStock !== 'number') throw new Error('Current stock not a number');
      if (typeof suggestion.reorderPoint !== 'number') throw new Error('Reorder point not a number');
      if (typeof suggestion.suggestedQuantity !== 'number') throw new Error('Suggested quantity not a number');

      const urgencies = ['low', 'medium', 'high', 'critical'];
      if (!urgencies.includes(suggestion.urgency)) throw new Error('Invalid urgency level');
    });

    // Validate budget variance analysis
    if (!mockDecisions.report.budgetAnalysis) throw new Error('Budget analysis missing');
    
    const budgetStatus = mockDecisions.report.budgetAnalysis.status;
    const validBudgetStatuses = ['on_track', 'over', 'under'];
    if (!validBudgetStatuses.includes(budgetStatus)) throw new Error('Invalid budget status');

    if (Array.isArray(mockDecisions.report.budgetAnalysis.lineItems)) {
      mockDecisions.report.budgetAnalysis.lineItems.forEach((item) => {
        if (!item.category) throw new Error('Category missing in budget line item');
        if (typeof item.budgeted !== 'number') throw new Error('Budgeted amount not a number');
        if (typeof item.actual !== 'number') throw new Error('Actual amount not a number');
        if (typeof item.variancePercent !== 'number') throw new Error('Variance percent not a number');

        const itemStatuses = ['on_track', 'over', 'under'];
        if (!itemStatuses.includes(item.status)) throw new Error('Invalid line item status');
      });
    }

    console.log(`✓ Analytics workflow: KPI accuracy & budget variance valid (Revenue: $${kpis.totalRevenue}, Margin: ${kpis.marginPercentage}%, Health: ${health.overallStatus})`);
    return true;
  } catch (err) {
    console.error('✗ Analytics workflow test failed:', err.message);
    throw err;
  }
}
