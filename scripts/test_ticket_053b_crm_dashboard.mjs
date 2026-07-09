import { readFileSync } from 'fs';
import { resolve } from 'path';

(async () => {
  try {
    const componentPath = resolve(process.cwd(), 'src/pages/CRMDashboard.jsx');
    const componentCode = readFileSync(componentPath, 'utf8');

    // Component structure validation
    if (!componentCode.includes('CRMDashboard')) {
      throw new Error('CRMDashboard component not found');
    }

    // Validate JSX structure
    if (!componentCode.includes('useEffect')) throw new Error('Missing useEffect hook');
    if (!componentCode.includes('getApiClient')) throw new Error('Missing API client integration');
    if (!componentCode.includes('Loading')) throw new Error('Missing loading state');
    if (!componentCode.includes('Error')) throw new Error('Missing error handling');

    // Validate data-binding structure
    if (!componentCode.includes('pipelineData')) throw new Error('Missing pipeline data binding');
    if (!componentCode.includes('activityData')) throw new Error('Missing activity data binding');
    if (!componentCode.includes("crm('pipeline')")) throw new Error('Missing pipeline API call');
    if (!componentCode.includes("crm('activity')")) throw new Error('Missing activity API call');
    if (!componentCode.includes('crm-dashboard')) throw new Error('Missing CSS class binding');

    // Validate JSX rendering
    if (!componentCode.includes('kanban-columns')) throw new Error('Missing kanban pipeline view');
    if (!componentCode.includes('activity-feed')) throw new Error('Missing activity timeline view');
    if (!componentCode.includes('opportunity-card')) throw new Error('Missing opportunity card component');

    console.log('TICKET-053b CRM Dashboard UI integration tests passed');
    process.exit(0);
  } catch (err) {
    console.error('TICKET-053b tests failed', err);
    process.exit(2);
  }
})();
