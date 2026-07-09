import { suggestReorderQuantity, analyzeVariance, buildBudgetAnalysis } from '../api/analytics/decisions.js';

(async () => {
  try {
    const reorder = suggestReorderQuantity(150, 7, 3);
    if (reorder.reorderPoint !== 1500 || reorder.urgency !== 'normal') {
      throw new Error('Reorder suggestion calculation failed');
    }

    const variance = analyzeVariance(50000, 48500);
    if (variance.variance !== -1500 || variance.status !== 'on_track') {
      throw new Error('Variance analysis failed');
    }

    const budgetAnalysis = buildBudgetAnalysis([
      { name: 'Materials', budgeted: 50000, actual: 48500 },
      { name: 'Labor', budgeted: 30000, actual: 31200 },
      { name: 'Overhead', budgeted: 15000, actual: 14800 },
    ]);

    if (budgetAnalysis.totalBudget !== 95000 || budgetAnalysis.totalActual !== 94500) {
      throw new Error('Budget analysis totals mismatch');
    }
    if (budgetAnalysis.items.length !== 3) {
      throw new Error('Budget analysis items count mismatch');
    }
    if (budgetAnalysis.overallVariance.status !== 'on_track') {
      throw new Error('Budget overall status incorrect');
    }

    console.log('TICKET-051b Decision-support tests passed');
    process.exit(0);
  } catch (err) {
    console.error('TICKET-051b tests failed', err);
    process.exit(2);
  }
})();
