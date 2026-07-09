import { verifyBearerToken } from '../lib/firebaseAdmin.js';
import { enforceModuleAccess } from '../lib/policyOrchestrator.js';

const schedules = new Map();

function id() { return `sched-${Math.random().toString(36).slice(2,8)}-${Date.now()}`; }

export function createSchedule({ name = 'cycle-schedule', cron = '0 3 * * 0', items = [] } = {}) {
  const sid = id();
  const rec = { id: sid, name, cron, items, createdAt: new Date().toISOString(), lastRunAt: null };
  schedules.set(sid, rec);
  return rec;
}

export function listSchedules() { return Array.from(schedules.values()); }

export async function triggerSchedule(sid) {
  const s = schedules.get(sid);
  if (!s) throw new Error('Schedule not found');
  s.lastRunAt = new Date().toISOString();
  // attempt to snapshot via inventory valuation if available
  try {
    const mod = await import('./valuation.js');
    const snap = mod.snapshotInventory(`auto-${s.name}`, s.items || []);
    return { schedule: s, snapshot: snap };
  } catch (e) {
    return { schedule: s, snapshot: null };
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const decoded = await verifyBearerToken(req);
    if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
    await enforceModuleAccess(decoded || {}, 'inventory', 'cycle_scheduler');
    const tenantId = decoded?.tenantId || 'production';
    if (req.method === 'POST') {
      const payload = req.body || {};
      const s = createSchedule(payload);
      return res.status(201).json({ success: true, data: s, tenantId });
    }
    if (req.method === 'PUT') {
      const body = req.body || {};
      if (body.action === 'trigger') {
        const result = await triggerSchedule(body.id);
        return res.status(200).json({ success: true, data: result });
      }
      return res.status(400).json({ error: 'Unknown PUT action' });
    }
    if (req.method === 'GET') {
      return res.status(200).json({ success: true, data: listSchedules(), tenantId });
    }
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('[inventory/cycle-scheduler] error', err?.message || err);
    return res.status(500).json({ success: false, error: err?.message || 'Internal' });
  }
}
