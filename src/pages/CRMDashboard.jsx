/**
 * src/pages/CRMDashboard.jsx
 * CRM dashboard component integrating pipeline and activity APIs.
 */

import { useEffect, useState } from 'react';
import { getApiClient } from '../lib/apiClient.js';
import PageHeader from '../components/PageHeader';
import useAnalyticsSnapshot from '../hooks/useAnalyticsSnapshot';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

export function CRMDashboard() {
  const [pipelineData, setPipelineData] = useState(null);
  const [activityData, setActivityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { snapshot } = useAnalyticsSnapshot();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const client = getApiClient();

        // Fetch pipeline data (leads/opportunities)
        const pipeline = await client.crm('pipeline');
        setPipelineData(pipeline);

        // Fetch activity timeline
        const activity = await client.crm('activity');
        setActivityData(activity);
      } catch (err) {
        setError(err.message || 'Failed to load CRM data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-lg font-medium text-slate-500 dark:text-slate-400 flex items-center gap-3">
          <svg className="animate-spin h-5 w-5 text-violet-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading CRM engine...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
        <h3 className="font-semibold text-lg mb-1">CRM Unavailable</h3>
        <p>{error}</p>
      </div>
    );
  }

  // Map API data paths safely
  const pipelineStats = pipelineData?.summary || {};
  const timeline = activityData?.timeline || [];
  const moduleEvents = activityData?.moduleEvents || [];
  const leads = pipelineData?.pipeline?.leads || [];
  
  // Create a funnel chart data set from opportunities
  const opportunities = pipelineData?.pipeline?.opportunities || [];
  const stages = ['new', 'qualified', 'proposition', 'won'];
  const funnelData = stages.map(stage => {
    const stageOpps = opportunities.filter(o => (o.stage || '').toLowerCase() === stage);
    return {
      name: stage.charAt(0).toUpperCase() + stage.slice(1),
      count: stageOpps.length || (stage === 'new' ? 0 : 0),
      value: stageOpps.reduce((sum, o) => sum + (Number(o.amount) || 0), 0)
    };
  });

  const COLORS = ['#8b5cf6', '#6366f1', '#ec4899', '#10b981'];

  return (
    <section className="space-y-6">
      <PageHeader 
        title="CRM Dashboard" 
        subtitle="Pipeline health, activity momentum, and lead conversions powered by the analytics engine." 
      />

      {/* Hero KPI Banner */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="col-span-1 md:col-span-4 rounded-2xl border border-white/20 bg-gradient-to-r from-violet-600/10 via-fuchsia-600/10 to-pink-600/10 p-6 backdrop-blur-xl shadow-lg dark:border-white/10 dark:from-violet-900/40 dark:to-pink-900/30 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">CRM Pulse</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Live analytics bridging sales momentum and customer interactions.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/50 px-4 py-2 text-sm font-bold text-violet-800 shadow-sm dark:bg-black/40 dark:text-violet-300 backdrop-blur-md">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            Health Score: {snapshot?.modules?.crm?.score ?? 100}%
          </div>
        </div>

        {/* Mini KPIs */}
        <div className="rounded-xl border border-white/40 bg-white/60 p-5 backdrop-blur-lg shadow-sm dark:border-slate-700/50 dark:bg-slate-800/60">
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Leads</div>
          <div className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{pipelineStats.leadCount || snapshot?.modules?.crm?.metrics?.leads || 0}</div>
        </div>
        <div className="rounded-xl border border-white/40 bg-white/60 p-5 backdrop-blur-lg shadow-sm dark:border-slate-700/50 dark:bg-slate-800/60">
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Opportunities</div>
          <div className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{pipelineStats.opportunityCount || snapshot?.modules?.crm?.metrics?.opportunities || 0}</div>
        </div>
        <div className="rounded-xl border border-white/40 bg-white/60 p-5 backdrop-blur-lg shadow-sm dark:border-slate-700/50 dark:bg-slate-800/60">
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pipeline Value</div>
          <div className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
            ${(pipelineStats.totalPipelineValue || snapshot?.modules?.crm?.metrics?.pipelineValue || 0).toLocaleString()}
          </div>
        </div>
        <div className="rounded-xl border border-white/40 bg-white/60 p-5 backdrop-blur-lg shadow-sm dark:border-slate-700/50 dark:bg-slate-800/60">
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Win Rate</div>
          <div className="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-400">0%</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pipeline Funnel Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-white/20 bg-white/60 p-6 backdrop-blur-xl shadow-lg dark:border-slate-700/50 dark:bg-slate-800/60">
          <h3 className="mb-6 text-lg font-bold text-slate-900 dark:text-white">Pipeline Distribution</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#cbd5e1" strokeOpacity={0.2} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontWeight: 600 }} width={90} />
                <RechartsTooltip 
                  cursor={{fill: 'rgba(139, 92, 246, 0.05)'}}
                  contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.95)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" name="Opportunities" radius={[0, 4, 4, 0]} barSize={32}>
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {opportunities.length === 0 && (
            <div className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400 italic">
              Note: Pipeline requires Neon DB CRM migration. Chart shows empty schema.
            </div>
          )}
        </div>

        {/* Activity Timeline */}
        <div className="rounded-2xl border border-white/20 bg-white/60 p-6 backdrop-blur-xl shadow-lg dark:border-slate-700/50 dark:bg-slate-800/60">
          <h3 className="mb-6 text-lg font-bold text-slate-900 dark:text-white">Recent Activity</h3>
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent dark:before:via-slate-700">
            {timeline.length > 0 ? timeline.slice(0, 5).map((event, idx) => (
              <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-violet-100 text-violet-600 dark:border-slate-800 dark:bg-violet-900/50 dark:text-violet-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800/80 transition-all hover:shadow-md">
                  <div className="flex items-center justify-between space-x-2 mb-1">
                    <div className="font-bold text-slate-900 dark:text-slate-100 text-sm capitalize">{event.type}</div>
                    <time className="text-xs font-medium text-violet-500">{new Date(event.occurredAt).toLocaleDateString()}</time>
                  </div>
                  <div className="text-slate-600 dark:text-slate-300 text-sm leading-snug">{event.subject}</div>
                  <div className="text-slate-400 text-xs mt-2 font-medium">with {event.contact}</div>
                </div>
              </div>
            )) : (
              <div className="text-center text-slate-500 text-sm py-10">No recent activities found.</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default CRMDashboard;
