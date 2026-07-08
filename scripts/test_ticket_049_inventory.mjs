import { getMovements } from '../api/inventory/movements.js';
import { computeReorderSuggestion } from '../api/inventory/reorder-suggestion.js';

(async () => {
  try {
    const mov = await getMovements('test-tenant');
    if (!Array.isArray(mov) || mov.length === 0) throw new Error('Expected movements array');

    const r1 = computeReorderSuggestion({ currentStock: 5, reorderPoint: 20, moq: 10 });
    if (!r1.shouldReorder || r1.suggestedQty <= 0) throw new Error('Expected reorder suggestion for low stock');

    const r2 = computeReorderSuggestion({ currentStock: 25, reorderPoint: 20, moq: 5 });
    if (r2.shouldReorder) throw new Error('Did not expect reorder suggestion when stock above reorder point');

    console.log('TICKET-049 inventory scaffolding tests passed');
    process.exit(0);
  } catch (err) {
    console.error('TICKET-049 tests failed', err);
    process.exit(2);
  }
})();
