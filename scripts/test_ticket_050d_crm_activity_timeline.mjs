import { buildActivityTimeline, buildActivitySummary, createActivityRecord, normalizeActivityEntry } from '../api/crm/activity.js';

(async () => {
  try {
    const timeline = buildActivityTimeline('test-tenant');
    if (!Array.isArray(timeline) || timeline.length !== 4) throw new Error('Sample timeline should include 4 entries');

    const summary = buildActivitySummary(timeline);
    if (summary.totalActivities !== 4) throw new Error('Summary totalActivities mismatch');
    if (summary.attachmentCount !== 1) throw new Error('Summary attachmentCount mismatch');
    if (summary.eventCounts.email !== 1 || summary.eventCounts.attachment !== 1) throw new Error('Event counts incorrect');
    if (!summary.latestActivityAt) throw new Error('Latest activity timestamp missing');

    const attachment = createActivityRecord({
      type: 'attachment',
      subject: 'Contract signed',
      performedBy: 'sales_manager',
      fileName: 'contract-ethio.pdf',
      mimeType: 'application/pdf',
      linkedTo: 'opp-102',
    });
    if (attachment.type !== 'attachment' || attachment.fileName !== 'contract-ethio.pdf') {
      throw new Error('Attachment normalization failed');
    }

    const normalized = normalizeActivityEntry({ type: 'call', subject: 'Follow-up call' });
    if (normalized.type !== 'call' || normalized.direction !== 'outbound') {
      throw new Error('Activity normalization defaults incorrect');
    }

    console.log('TICKET-050d CRM activity tests passed');
    process.exit(0);
  } catch (err) {
    console.error('TICKET-050d tests failed', err);
    process.exit(2);
  }
})();
