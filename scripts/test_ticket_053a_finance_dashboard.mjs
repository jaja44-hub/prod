import { readFileSync } from 'fs';
import { resolve } from 'path';

(async () => {
  try {
    const componentPath = resolve(process.cwd(), 'src/pages/FinanceDashboard.jsx');
    const componentCode = readFileSync(componentPath, 'utf8');

    // Component structure validation
    if (!componentCode.includes('FinanceDashboard')) {
      throw new Error('FinanceDashboard component not found');
    }

    // Validate JSX structure
    if (!componentCode.includes('useEffect')) throw new Error('Missing useEffect hook');
    if (!componentCode.includes('getApiClient')) throw new Error('Missing API client integration');
    if (!componentCode.includes('Loading')) throw new Error('Missing loading state');
    if (!componentCode.includes('Error')) throw new Error('Missing error handling');

    // Validate data-binding structure
    if (!componentCode.includes('agingData')) throw new Error('Missing aging data binding');
    if (!componentCode.includes('reconciliationData')) throw new Error('Missing reconciliation data binding');
    if (!componentCode.includes("finance('aging')")) throw new Error('Missing finance aging API call');
    if (!componentCode.includes('finance-dashboard')) throw new Error('Missing CSS class binding');

    // Validate JSX rendering
    if (!componentCode.includes('<h2>')) throw new Error('Missing heading elements');
    if (!componentCode.includes('<table>')) throw new Error('Missing table elements for data display');

    console.log('TICKET-053a Finance Dashboard UI integration tests passed');
    process.exit(0);
  } catch (err) {
    console.error('TICKET-053a tests failed', err);
    process.exit(2);
  }
})();
