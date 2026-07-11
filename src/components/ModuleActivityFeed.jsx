import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getApiClient } from '../lib/apiClient';
import EmptyState from './EmptyState';
import Skeleton from './Skeleton';

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
  warehouse: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  sales: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  purchase: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  finance: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  crm: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
};

function mapTimelineToEvents(timeline = []) {
  return timeline.map((entry) => ({
    id: entry.activityId,
    moduleId: 'crm',
    action: entry.subject,
    odooModel: entry.type,
    odooId: entry.linkedTo || entry.contact,
    ts: entry.occurredAt,
  }));
}

/**
 * ModuleActivityFeed — prefers live Firestore events, then seeded module activity from CRM API.
 */
export default function ModuleActivityFeed() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadSeededActivity = async () => {
      try {
        const client = getApiClient();
        const response = await client.crm('activity').catch(() => null);
        const moduleEvents = Array.isArray(response?.moduleEvents) ? response.moduleEvents : [];
        const timelineEvents = mapTimelineToEvents(response?.timeline || []);
        const combined = [...moduleEvents, ...timelineEvents]
          .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
          .slice(0, 20);
        if (isMounted && combined.length > 0) {
          setEvents(combined);
          setLoading(false);
        }
      } catch {
        // fall through to Firestore listener or empty state
      }
    };

    loadSeededActivity();

    if (!db) {
      return () => {
        isMounted = false;
      };
    }

    const q = query(collection(db, 'module_events'), orderBy('ts', 'desc'), limit(20));
    const unsub = onSnapshot(q, (snap) => {
      const liveEvents = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (liveEvents.length > 0) {
        setEvents(liveEvents);
      }
      setLoading(false);
    }, () => {
      setLoading(false);
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  if (loading) return <Skeleton lines={5} />;

  if (!events.length) {
    return <EmptyState title="No activity yet" description="Module activity will appear here as orders, inventory, and finance events are recorded." icon="📋" />;
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
