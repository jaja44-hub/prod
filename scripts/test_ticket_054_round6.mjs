import { createLot, adjustLotQty, findByProduct } from '../server/api/inventory/lot-tracking.js';
import { createSchedule, triggerSchedule, listSchedules } from '../server/api/inventory/cycle-scheduler.js';
import { logAuditEvent, listAuditEvents } from '../server/api/audit/logging.js';

(async () => {
  try {
    const lot = createLot({ productId: 'p-100', lotRef: 'L-100', qty: 50 });
    if (!lot.lotId) throw new Error('Lot creation failed');
    const adjusted = adjustLotQty(lot.lotId, -5);
    if (adjusted.qty !== 45) throw new Error('Lot adjust failed');
    const found = findByProduct('p-100');
    if (!Array.isArray(found) || found.length === 0) throw new Error('Find by product failed');

    const sched = createSchedule({ name: 'weekly-count', cron: '0 3 * * 0', items: [{ productId: 'p-100', qty: 45 }] });
    if (!sched.id) throw new Error('Schedule creation failed');
    const triggered = await triggerSchedule(sched.id);
    if (!triggered || !triggered.schedule) throw new Error('Trigger schedule failed');

    const ev = logAuditEvent({ actor: 'tester', action: 'round6-test', details: { lotId: lot.lotId } });
    if (!ev || !ev.id) throw new Error('Audit log failed');
    const events = listAuditEvents(10);
    if (!Array.isArray(events) || events.length === 0) throw new Error('Audit listing failed');

    console.log('TICKET-054 Round6 tests passed');
    process.exit(0);
  } catch (err) {
    console.error('TICKET-054 Round6 tests failed', err);
    process.exit(2);
  }
})();
