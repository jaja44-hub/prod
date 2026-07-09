/**
 * src/pages/CRMDashboard.jsx
 * CRM dashboard component integrating pipeline and activity APIs.
 */

import { useEffect, useState } from 'react';
import { getApiClient } from '../../api/client.js';

export function CRMDashboard() {
  const [pipelineData, setPipelineData] = useState(null);
  const [activityData, setActivityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) return <div className="crm-dashboard loading">Loading CRM data...</div>;
  if (error) return <div className="crm-dashboard error">Error: {error}</div>;

  return (
    <div className="crm-dashboard">
      <h1>CRM Dashboard</h1>

      {pipelineData && (
        <div className="pipeline-section">
          <h2>Sales Pipeline</h2>
          <div className="pipeline-metrics">
            <div className="metric">
              <label>Total Leads:</label>
              <span>{pipelineData.report?.summary?.totalLeads || 0}</span>
            </div>
            <div className="metric">
              <label>Total Opportunities:</label>
              <span>{pipelineData.report?.summary?.totalOpportunities || 0}</span>
            </div>
            <div className="metric">
              <label>Pipeline Value:</label>
              <span>${pipelineData.report?.summary?.totalValue || 0}</span>
            </div>
          </div>

          <div className="pipeline-board">
            <h3>Opportunities by Stage</h3>
            <div className="kanban-columns">
              {pipelineData.report?.opportunities &&
                Object.entries(
                  pipelineData.report.opportunities.reduce((stages, opp) => {
                    (stages[opp.stage] = stages[opp.stage] || []).push(opp);
                    return stages;
                  }, {})
                ).map(([stage, opps]) => (
                  <div key={stage} className="kanban-column">
                    <h4>{stage}</h4>
                    <div className="card-stack">
                      {opps.map((opp) => (
                        <div key={opp.id} className="opportunity-card">
                          <p className="title">{opp.name}</p>
                          <p className="amount">${opp.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="leads-table">
            <h3>Recent Leads</h3>
            <table>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Contact</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {pipelineData.report?.leads &&
                  pipelineData.report.leads.slice(0, 10).map((lead) => (
                    <tr key={lead.id}>
                      <td>{lead.company}</td>
                      <td>{lead.contact}</td>
                      <td>{lead.status}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activityData && (
        <div className="activity-section">
          <h2>Activity Timeline</h2>
          <div className="activity-summary">
            <p>Recent activities: {activityData.report?.timeline?.length || 0}</p>
          </div>
          <div className="activity-feed">
            {activityData.report?.timeline &&
              activityData.report.timeline.slice(0, 20).map((event, idx) => (
                <div key={idx} className="activity-item">
                  <span className="timestamp">{event.timestamp}</span>
                  <span className="type">{event.type}</span>
                  <span className="description">{event.description}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CRMDashboard;
