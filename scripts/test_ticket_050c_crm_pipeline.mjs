import { buildSamplePipeline, buildPipelineSummary, createLeadRecord } from '../server/api/crm/pipeline.js';

(async () => {
  try {
    const pipeline = buildSamplePipeline('test-tenant');
    if (!pipeline || pipeline.leads.length !== 2 || pipeline.opportunities.length !== 2) throw new Error('Unexpected sample pipeline');

    const summary = buildPipelineSummary(pipeline);
    if (summary.leadCount !== 2 || summary.opportunityCount !== 2) throw new Error('Summary counts incorrect');
    if (summary.totalPipelineValue !== 25500) throw new Error('Total pipeline value mismatch');
    if (!summary.stageCounts['proposal'] || !summary.stageCounts['negotiation']) throw new Error('Stage counts missing');

    const lead = createLeadRecord({ company: 'New Retail', contact: 'Samir', value: 0, owner: 'sales_rep' });
    if (lead.company !== 'New Retail' || lead.stage !== 'new') throw new Error('Lead normalization incorrect');

    console.log('TICKET-050c CRM pipeline tests passed');
    process.exit(0);
  } catch (err) {
    console.error('TICKET-050c tests failed', err);
    process.exit(2);
  }
})();
