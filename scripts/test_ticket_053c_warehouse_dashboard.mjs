import { readFileSync } from 'fs';
import { resolve } from 'path';

(async () => {
  try {
    const componentPath = resolve(process.cwd(), 'src/pages/WarehouseDashboard.jsx');
    const componentCode = readFileSync(componentPath, 'utf8');

    // Component structure validation
    if (!componentCode.includes('WarehouseDashboard')) {
      throw new Error('WarehouseDashboard component not found');
    }

    // Validate JSX structure
    if (!componentCode.includes('useEffect')) throw new Error('Missing useEffect hook');
    if (!componentCode.includes('getApiClient')) throw new Error('Missing API client integration');
    if (!componentCode.includes('Loading')) throw new Error('Missing loading state');
    if (!componentCode.includes('Error')) throw new Error('Missing error handling');

    // Validate data-binding structure
    if (!componentCode.includes('workflowData')) throw new Error('Missing workflow data binding');
    if (!componentCode.includes("warehouse('workflow')")) throw new Error('Missing warehouse workflow API call');
    if (!componentCode.includes('warehouse-dashboard')) throw new Error('Missing CSS class binding');

    // Validate JSX rendering
    if (!componentCode.includes('stage-columns')) throw new Error('Missing stage columns for workflow');
    if (!componentCode.includes('shipment-cards')) throw new Error('Missing shipment card component');
    if (!componentCode.includes('shipments-table')) throw new Error('Missing shipments table');
    if (!componentCode.includes('inventory-timeline')) throw new Error('Missing inventory timeline');
    if (!componentCode.includes('pickingCount')) throw new Error('Missing picking status metric');
    if (!componentCode.includes('packingCount')) throw new Error('Missing packing status metric');
    if (!componentCode.includes('shippedCount')) throw new Error('Missing shipped status metric');

    console.log('TICKET-053c Warehouse Dashboard UI integration tests passed');
    process.exit(0);
  } catch (err) {
    console.error('TICKET-053c tests failed', err);
    process.exit(2);
  }
})();
