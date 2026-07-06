import React from 'react';
import { useLang } from '../context/LangContext';
import PageHeader from '../components/PageHeader';
import PageCard from '../components/PageCard';

export default function Analytics() {
  const { t } = useLang();

  // Mock Data representing aggregated metrics from Odoo
  const metrics = {
    oee: 84.5, // Overall Equipment Effectiveness
    stockTurnover: 4.2,
    fulfillmentRate: 98.1,
    predictiveRisk: 'Low'
  };

  return (
    <section>
      <PageHeader
        title="Operational Analytics"
        subtitle="Aggregated performance and predictive metrics (Phase 6 Preview)."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <PageCard>
          <div className="text-gray-500 dark:text-gray-400 text-sm mb-1">OEE (Overall Equip. Effectiveness)</div>
          <div className="text-3xl font-bold text-violet-600 dark:text-violet-400">{metrics.oee}%</div>
          <div className="text-xs text-green-500 mt-2">↑ 2.1% from last month</div>
        </PageCard>
        
        <PageCard>
          <div className="text-gray-500 dark:text-gray-400 text-sm mb-1">Stock Turnover Ratio</div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{metrics.stockTurnover}x</div>
          <div className="text-xs text-green-500 mt-2">↑ 0.3x from last month</div>
        </PageCard>

        <PageCard>
          <div className="text-gray-500 dark:text-gray-400 text-sm mb-1">Order Fulfillment Rate</div>
          <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{metrics.fulfillmentRate}%</div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">Stable</div>
        </PageCard>

        <PageCard>
          <div className="text-gray-500 dark:text-gray-400 text-sm mb-1">Predictive Supply Risk</div>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">{metrics.predictiveRisk}</div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">No disruptions forecasted</div>
        </PageCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PageCard>
          <h2 className="font-semibold mb-4 text-gray-800 dark:text-gray-200">Production Output (Last 7 Days)</h2>
          <div className="h-48 flex items-end gap-2 justify-between">
            {[45, 52, 38, 65, 59, 80, 71].map((val, idx) => (
              <div key={idx} className="w-full bg-violet-200 dark:bg-violet-900/45 rounded-t relative group h-full flex flex-col justify-end">
                <div 
                  className="w-full bg-violet-500 dark:bg-violet-600 rounded-t transition-all" 
                  style={{ height: `${(val / 80) * 100}%` }}
                ></div>
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  {val}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>
        </PageCard>

        <PageCard>
          <h2 className="font-semibold mb-4 text-gray-850 dark:text-gray-205">Predictive Analytics Spike</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            This module integrates AI-driven supply chain forecasting, demand pattern recognition, and preventive maintenance triggers.
            Currently stubbed for Phase 6 rollout.
          </p>
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-250 dark:border-yellow-700/50 rounded-lg text-yellow-800 dark:text-yellow-500 text-sm">
            <strong>Active Spike:</strong> Evaluating Prophet and LSTM models against historical Odoo MRP data to predict machine downtime.
          </div>
        </PageCard>
      </div>
    </section>
  );
}
