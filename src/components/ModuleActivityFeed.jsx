import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import EmptyState from './EmptyState';
import Skeleton from './Skeleton';

function buildDemoEvents() {
  return [
    { id: 'demo-1', moduleId: 'warehouse', action: 'Packed 12 orders for dispatch', odooModel: 'stock.picking', odooId: '1004', ts: new Date(Date.now() - 1000 * 60 * 12) },
    { id: 'demo-2', moduleId: 'finance', action: 'Receivables ageing refreshed', odooModel: 'account.move', odooId: '204', ts: new Date(Date.now() - 1000 * 60 * 60 * 2) },
    { id: 'demo-3', moduleId: 'sales', action: 'New order booked from partner', odooModel: 'sale.order', odooId: '512', ts: new Date(Date.now() - 1000 * 60 * 60 * 6) },
  ];
}

function timeAgo(ts) {
  if (!ts) return '—';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString();
}

const MODULE_COLORS = {
  inventory: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  sales: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  purchase: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  finance: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
};

/**
 * ModuleActivityFeed — real-time Firestore listener on module_events collection.
 * Read-only. Never writes to Firestore.
 */
export default function ModuleActivityFeed() {
  const [events, setEvents] = useState(buildDemoEvents());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) {
      setEvents(buildDemoEvents());
      setLoading(false);
      return;
    }
    const q = query(collection(db, 'module_events'), orderBy('ts', 'desc'), limit(20));
    const unsub = onSnapshot(q, (snap) => {
      const liveEvents = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setEvents(liveEvents.length ? liveEvents : buildDemoEvents());
      setLoading(false);
    }, () => {
      setEvents(buildDemoEvents());
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return <Skeleton lines={5} />;

  if (!events.length) {
    return <EmptyState title="No activity yet" description="Create a product or order to see events here." icon="📋" />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="erp-table w-full">
        <thead>
          <tr>
            <th>Time</th>
            <th>Module</th>
            <th>Action</th>
            <th>Record</th>
          </tr>
        </thead>
        <tbody>
          {events.map((ev) => {
            const moduleColor = MODULE_COLORS[ev.moduleId?.toLowerCase()] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200';
            return (
              <tr key={ev.id}>
                <td className="erp-num text-xs text-gray-400 whitespace-nowrap">{timeAgo(ev.ts)}</td>
                <td>
                  <span className={`erp-state-badge ${moduleColor}`}>{ev.moduleId || '—'}</span>
                </td>
                <td className="text-sm text-gray-700 dark:text-gray-300">{ev.action || '—'}</td>
                <td className="text-xs text-gray-400 truncate max-w-[12rem]">
                  {ev.odooModel ? `${ev.odooModel} #${ev.odooId || '?'}` : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
