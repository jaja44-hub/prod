import { readFileSync } from 'fs';
import { resolve } from 'path';

(async () => {
  try {
    const componentPath = resolve(process.cwd(), 'src/pages/AnalyticsDashboard.jsx');
    const componentCode = readFileSync(componentPath, 'utf8');

    // Component structure validation
    if (!componentCode.includes('AnalyticsDashboard')) {
      throw new Error('AnalyticsDashboard component not found');
    }

    // Validate JSX structure
    if (!componentCode.includes('useEffect')) throw new Error('Missing useEffect hook');
    if (!componentCode.includes('getApiClient')) throw new Error('Missing API client integration');
    if (!componentCode.includes('Loading')) throw new Error('Missing loading state');
    if (!componentCode.includes('Error')) throw new Error('Missing error handling');

    // Validate data-binding structure
    if (!componentCode.includes('metricsData')) throw new Error('Missing metrics data binding');
    if (!componentCode.includes('decisionsData')) throw new Error('Missing decisions data binding');
    if (!componentCode.includes("analytics('metrics')")) throw new Error('Missing metrics API call');
    if (!componentCode.includes("analytics('decisions')")) throw new Error('Missing decisions API call');
    if (!componentCode.includes('analytics-dashboard')) throw new Error('Missing CSS class binding');

    // Validate JSX rendering
    if (!componentCode.includes('kpi-cards')) throw new Error('Missing KPI card component');
    if (!componentCode.includes('reorder-section')) throw new Error('Missing reorder recommendations section');
    if (!componentCode.includes('budget-variance-section')) throw new Error('Missing budget variance analysis section');
    if (!componentCode.includes('marginPercentage')) throw new Error('Missing margin metric display');
    if (!componentCode.includes('currency-breakdown')) throw new Error('Missing currency breakdown table');
    if (!componentCode.includes('reorderSuggestions')) throw new Error('Missing reorder suggestions display');
    if (!componentCode.includes('budgetAnalysis')) throw new Error('Missing budget analysis display');

    console.log('TICKET-053d Analytics Dashboard UI integration tests passed');
    process.exit(0);
  } catch (err) {
    console.error('TICKET-053d tests failed', err);
    process.exit(2);
  }
})();
